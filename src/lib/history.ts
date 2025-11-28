import { prisma } from "./prisma";
import { MarketDataService } from "./market-data";

export async function recordDailyHistoryWithTotal(userId: string) {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    try {
        // 1. Fetch all user assets
        const assets = await prisma.asset.findMany({
            where: { userId }
        });

        // 2. Calculate total worth
        let totalWorth = 0;

        for (const asset of assets) {
            if (asset.type === 'BANK') {
                totalWorth += asset.balance || 0;
            } else if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                const quantity = asset.quantity || 0;
                if (quantity > 0 && asset.symbol) {
                    try {
                        const marketData = await MarketDataService.getAssetPrice(asset.symbol, asset.type as any);
                        totalWorth += quantity * marketData.price;
                    } catch (e) {
                        console.warn(`Failed to fetch price for ${asset.symbol} during history recording`, e);
                        // If price fetch fails, we might skip this asset or use 0. 
                        // For now, we assume 0 value if price is unavailable to avoid crashing.
                    }
                }
            }
        }

        // 3. Save to History
        await prisma.history.upsert({
            where: {
                userId_date: {
                    userId,
                    date: today
                }
            },
            update: {
                value: totalWorth
            },
            create: {
                userId,
                date: today,
                value: totalWorth
            }
        });

        console.log(`Recorded history for ${userId} on ${today}: $${totalWorth}`);

    } catch (error) {
        console.error("Error recording daily history:", error);
        // We don't throw here to avoid failing the parent request (e.g. Add Asset) 
        // just because history recording failed.
    }
}

export async function getHistory(userId: string, range: string = '1M') {
    const now = new Date();
    let startDate = new Date();

    switch (range) {
        case '1W':
            startDate.setDate(now.getDate() - 7);
            break;
        case '1M':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case '3M':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case '1Y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case '3Y':
            startDate.setFullYear(now.getFullYear() - 3);
            break;
        case '5Y':
            startDate.setFullYear(now.getFullYear() - 5);
            break;
        case 'ALL':
            startDate = new Date(0); // Beginning of time
            break;
        default:
            startDate.setMonth(now.getMonth() - 1);
    }

    const startDateStr = startDate.toISOString().split('T')[0];

    const history = await prisma.history.findMany({
        where: {
            userId,
            date: {
                gte: startDateStr
            }
        },
        orderBy: {
            date: 'asc'
        }
    });

    return history;
}
