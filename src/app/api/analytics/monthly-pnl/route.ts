import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get time range from query params (default 6 months)
        const { searchParams } = new URL(req.url);
        const months = parseInt(searchParams.get("months") || "6", 10);

        // Fetch historical data for the specified period
        const endDate = new Date();
        const startDate = new Date();
        startDate.setMonth(endDate.getMonth() - months);

        const history = await prisma.history.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate.toISOString().split('T')[0],
                    lte: endDate.toISOString().split('T')[0],
                },
            },
            orderBy: { date: "asc" },
        });

        if (history.length < 2) {
            return NextResponse.json([]);
        }

        // Group by month and calculate P&L
        const monthlyPnL = new Map<string, number>();

        for (let i = 1; i < history.length; i++) {
            const current = history[i];
            const previous = history[i - 1];
            const monthKey = current.date.slice(0, 7); // "YYYY-MM" from "YYYY-MM-DD"

            const dailyPnL = current.value - previous.value;

            if (!monthlyPnL.has(monthKey)) {
                monthlyPnL.set(monthKey, 0);
            }
            monthlyPnL.set(monthKey, monthlyPnL.get(monthKey)! + dailyPnL);
        }

        // Convert to array format
        const result = Array.from(monthlyPnL.entries())
            .map(([month, pnl]) => ({
                month,
                pnl: parseFloat(pnl.toFixed(2)),
            }))
            .sort((a, b) => a.month.localeCompare(b.month))
            .slice(-months); // Keep only last N months

        return NextResponse.json(result);
    } catch (error) {
        console.error("Error calculating monthly P&L:", error);
        return NextResponse.json(
            { error: "Failed to calculate monthly P&L" },
            { status: 500 }
        );
    }
}
