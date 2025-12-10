
import { PrismaClient } from '@prisma/client';
import { MarketDataService } from './lib/market-data';
import { AnalyticsEngine } from './lib/analytics-engine';
import { subDays, differenceInDays } from 'date-fns';

// Hardcode known working string (or rely on robust env loading if fixed)
// The user has a local postgres.
process.env.DATABASE_URL = process.env.DATABASE_URL || "postgresql://postgres:postgres@localhost:5432/postgres";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== FINAL DEBUG START ===");

        // 1. Get User
        const user = await prisma.user.findFirst();
        if (!user) throw new Error("No user found");
        console.log(`User ID: ${user.id}`);

        // 2. Get Stocks
        const assets = await prisma.asset.findMany({
            where: { userId: user.id, type: 'STOCK' }
        });
        console.log(`Found ${assets.length} stocks.`);
        if (assets.length === 0) return;

        const asset = assets[0];
        console.log(`Target Asset: [${asset.symbol}] ${asset.name} (AvgBuy: ${asset.averageBuyPrice})`);

        // 3. Simulate YTD Logic (Current Date: Dec 10, 2024? No, system time)
        const now = new Date();
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        const days = differenceInDays(now, startOfYear);
        console.log(`Simulating 'YTD' range. Days diff: ${days}`);

        // 4. Fetch History
        console.log("Fetching History...");
        const history = await MarketDataService.getHistoricalPrices(
            asset.symbol!,
            'STOCK',
            subDays(startOfYear, 7),
            now
        );
        console.log(`History Entries: ${history.length}`);

        // 5. Simulate Ranking Logic Map
        const prices = new Map<string, number>();
        history.forEach(p => prices.set(p.date, p.price));

        const endPrice = prices.get(now.toISOString().split('T')[0]) || asset.lastPrice || 0;
        let startPrice = 0;

        // Logic A: Standard Loop
        for (let i = days; i >= 0; i--) {
            const d = subDays(now, i).toISOString().split('T')[0];
            if (prices.has(d)) {
                startPrice = prices.get(d) || 0;
                console.log(`[Logic A] Found start price at -${i} days (${d}): ${startPrice}`);
                break;
            }
        }

        // Logic B: Earliest Available
        if (startPrice === 0 && prices.size > 0) {
            const dates = Array.from(prices.keys()).sort();
            if (dates.length > 0) {
                startPrice = prices.get(dates[0]) || 0;
                console.log(`[Logic B] Fallback to earliest date (${dates[0]}): ${startPrice}`);
            }
        }

        // Logic C: Cost Basis Fallback (The Suspect)
        if (startPrice === 0 && days >= 365) {
            console.log(`[Logic C] Checking AvgBuyPrice fallback... Condition met? YES (days >= 365)`);
            if (asset.averageBuyPrice && asset.averageBuyPrice > 0) {
                startPrice = asset.averageBuyPrice;
                console.log(`[Logic C] Used AvgBuyPrice: ${startPrice}`);
            }
        } else {
            console.log(`[Logic C] Skipped. days (${days}) < 365. THIS MIGHT BE THE BUG FOR YTD`);
        }

        if (startPrice === 0) {
            console.log("!!! RESULT: Asset EXCLUDED (StartPrice = 0) !!!");
        } else {
            console.log(`!!! RESULT: Asset INCLUDED. Start: ${startPrice}, End: ${endPrice}`);
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
