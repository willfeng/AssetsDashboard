import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get time range from query params
        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "1Y";

        // Fetch all assets belonging to this user with their snapshots
        const assets = await prisma.asset.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                type: true,
                snapshots: {
                    select: {
                        date: true,
                        value: true,
                    },
                    orderBy: { date: "asc" },
                },
            },
        });

        if (assets.length === 0 || assets.every((a) => a.snapshots.length === 0)) {
            return NextResponse.json({
                dates: [],
                categories: {
                    Stocks: [],
                    Crypto: [],
                    Cash: [],
                },
            });
        }

        // Group snapshots by date and category
        const dateMap = new Map<string, { Stocks: number; Crypto: number; Cash: number }>();

        assets.forEach((asset) => {
            asset.snapshots.forEach((snapshot) => {
                const dateKey = snapshot.date; // Already in YYYY-MM-DD format

                if (!dateMap.has(dateKey)) {
                    dateMap.set(dateKey, { Stocks: 0, Crypto: 0, Cash: 0 });
                }

                const dayData = dateMap.get(dateKey)!;

                if (asset.type === "STOCK") {
                    dayData.Stocks += snapshot.value;
                } else if (asset.type === "CRYPTO") {
                    dayData.Crypto += snapshot.value;
                } else if (asset.type === "BANK") {
                    dayData.Cash += snapshot.value;
                }
            });
        });

        // Sort dates
        const sortedDates = Array.from(dateMap.keys()).sort();

        // Build category arrays
        const stocksData = [];
        const cryptoData = [];
        const cashData = [];

        for (const date of sortedDates) {
            const dayData = dateMap.get(date)!;
            stocksData.push(dayData.Stocks);
            cryptoData.push(dayData.Crypto);
            cashData.push(dayData.Cash);
        }

        // Normalize to base 100 (percentage change from start)
        const normalize = (data: number[]) => {
            if (data.length === 0) return [];
            const baseValue = data[0] || 1; // Avoid division by zero
            return data.map((val) => (val / baseValue) * 100);
        };

        return NextResponse.json({
            dates: sortedDates,
            categories: {
                Stocks: normalize(stocksData),
                Crypto: normalize(cryptoData),
                Cash: normalize(cashData),
            },
        });
    } catch (error) {
        console.error("Error fetching category performance:", error);
        return NextResponse.json(
            { error: "Failed to fetch category performance" },
            { status: 500 }
        );
    }
}
