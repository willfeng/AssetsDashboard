import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { MarketDataService } from '@/lib/market-data';
import { recordDailyHistory } from '@/lib/history';

export async function POST() {
    try {
        const db = await getDb();
        const assets = db.data.assets;
        let updatedCount = 0;

        // Process updates in parallel for speed, but could throttle if needed
        const updates = assets.map(async (asset) => {
            if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                if (asset.symbol) {
                    try {
                        const newPrice = await MarketDataService.getAssetPrice(asset.symbol, asset.type);
                        if (newPrice > 0) {
                            // Only update if we got a valid price
                            if (asset.currentPrice !== newPrice) {
                                console.log(`[Refresh] Updating ${asset.symbol}: ${asset.currentPrice} -> ${newPrice}`);
                                asset.currentPrice = newPrice;
                                asset.totalValue = asset.quantity * newPrice;
                                updatedCount++;
                            } else {
                                console.log(`[Refresh] No change for ${asset.symbol}: ${newPrice}`);
                            }
                        }
                    } catch (error) {
                        console.error(`Failed to refresh price for ${asset.symbol}:`, error);
                    }
                }
            }
            return asset;
        });

        await Promise.all(updates);

        if (updatedCount > 0) {
            await db.write();
        }

        // Record daily history after refresh
        await recordDailyHistory();

        return NextResponse.json({
            success: true,
            updatedCount,
            assets: db.data.assets
        });
    } catch (error) {
        console.error("Error refreshing assets:", error);
        return NextResponse.json(
            { error: 'Failed to refresh assets' },
            { status: 500 }
        );
    }
}
