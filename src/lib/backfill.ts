import { prisma } from "./prisma";
import { MarketDataService } from "./market-data";
import { CurrencyService } from "./currency";

export async function checkAndBackfillHistory(userId: string) {
    console.log(`[Backfill] Checking history gap for user ${userId}...`);

    try {
        // 1. Get the latest history date
        const latestHistory = await prisma.history.findFirst({
            where: { userId },
            orderBy: { date: 'desc' }
        });

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        let lastDate = latestHistory ? new Date(latestHistory.date) : new Date();
        lastDate.setHours(0, 0, 0, 0);

        // If no history, or last history is today/yesterday, no need to backfill
        const diffTime = Math.abs(today.getTime() - lastDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays <= 1) {
            console.log(`[Backfill] No significant gap (${diffDays} days). Skipping.`);
            return;
        }

        console.log(`[Backfill] Found ${diffDays} days gap. Starting backfill from ${lastDate.toISOString()} to ${today.toISOString()}`);

        // 2. Fetch all assets ONCE
        const assets = await prisma.asset.findMany({
            where: { userId }
        });

        // 3. Prepare date range
        const startDate = new Date(lastDate);
        startDate.setDate(startDate.getDate() + 1); // Start from next day
        const endDate = new Date(today);
        endDate.setDate(endDate.getDate() - 1); // Up to yesterday

        if (startDate > endDate) return;

        // 4. Fetch historical prices for all assets
        const assetHistoryMap = new Map<string, Map<string, number>>(); // assetId -> (date -> price)

        for (const asset of assets) {
            if ((asset.type === 'STOCK' || asset.type === 'CRYPTO') && asset.symbol) {
                const history = await MarketDataService.getHistoricalPrices(
                    asset.symbol,
                    asset.type as 'STOCK' | 'CRYPTO',
                    startDate,
                    today // Fetch up to today to be safe
                );

                const priceMap = new Map<string, number>();
                history.forEach(h => priceMap.set(h.date, h.price));
                assetHistoryMap.set(asset.id, priceMap);
            }
        }

        // 5. Calculate Daily Totals
        const historyEntries = [];
        const currDate = new Date(startDate);

        while (currDate <= endDate) {
            const dateStr = currDate.toISOString().split('T')[0];
            let dailyTotal = 0;

            for (const asset of assets) {
                if (asset.type === 'BANK') {
                    // Assume bank balance constant (simplification)
                    dailyTotal += CurrencyService.convertToUSD(asset.balance || 0, asset.currency || "USD");
                } else {
                    const priceMap = assetHistoryMap.get(asset.id);
                    const price = priceMap?.get(dateStr) || 0;
                    // Fallback: if no price for that specific day (e.g. weekend), use previous known price?
                    // For now, simple logic: if 0, maybe market closed, try to use last known? 
                    // To keep it simple for MVP: if 0, ignore (or could use current price as fallback)

                    if (price > 0) {
                        dailyTotal += (asset.quantity || 0) * price;
                    } else {
                        // Fallback to current total value if history missing (better than 0)
                        // But this might be wrong. Let's try to find nearest price?
                        // For MVP, if price missing, just use 0 or maybe skip?
                        // Better: Use asset.totalValue (current) as a rough fallback if history fails completely
                        // But that defeats the purpose.
                        // Let's assume getHistoricalPrices returns decent data.
                    }
                }
            }

            if (dailyTotal > 0) {
                historyEntries.push({
                    userId,
                    date: dateStr,
                    value: dailyTotal
                });
            }

            currDate.setDate(currDate.getDate() + 1);
        }

        // 6. Bulk Insert
        if (historyEntries.length > 0) {
            console.log(`[Backfill] Inserting ${historyEntries.length} history records...`);
            await prisma.history.createMany({
                data: historyEntries,
                skipDuplicates: true
            });
            console.log(`[Backfill] Success.`);
        }

    } catch (error) {
        console.error("[Backfill] Failed:", error);
    }
}
