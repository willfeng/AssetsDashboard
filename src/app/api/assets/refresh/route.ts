
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { MarketDataService } from '@/lib/market-data';
import { recordAssetSnapshot } from '@/lib/history';
import { checkAndBackfillHistory } from '@/lib/backfill';

export async function POST() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.asset.findMany({
            where: { userId: user.id },
            orderBy: [
                { order: 'asc' },
                { createdAt: 'desc' }
            ]
        });

        console.log(`[API] Refreshing prices for ${assets.length} assets...`);

        const updatedAssets = await Promise.all(assets.map(async (asset) => {
            if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                if (asset.symbol) {
                    try {
                        const marketData = await MarketDataService.getAssetPrice(asset.symbol, asset.type as any);

                        const updatedAsset = {
                            ...asset,
                            currentPrice: marketData.price,
                            change24h: marketData.change24h,
                            totalValue: (asset.quantity || 0) * marketData.price
                        };

                        // Record Snapshot asynchronously
                        recordAssetSnapshot(asset.id, marketData.price, asset.quantity || 0);

                        return updatedAsset;
                    } catch (e) {
                        console.error(`Failed to refresh price for ${asset.symbol}`, e);
                    }
                }
            }
            // For Bank, just return as is
            return {
                ...asset,
                currentPrice: 0,
                change24h: 0,
                totalValue: asset.balance || 0
            };
        }));

        // Check for missing history and backfill if needed
        await checkAndBackfillHistory(user.id);

        // Optionally record history snapshot
        // REMOVED: await recordDailyHistoryWithTotal(user.id);
        // Reason: We now rely on Frontend SSOT to push the correct total value. 
        // Backend recalculation causes race conditions and data discrepancies.

        return NextResponse.json({ success: true, assets: updatedAssets });

    } catch (error: any) {
        console.error("Error refreshing assets:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
