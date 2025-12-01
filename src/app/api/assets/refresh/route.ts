
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { MarketDataService } from '@/lib/market-data';
import { recordDailyHistoryWithTotal } from '@/lib/history';

export async function POST() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const assets = await prisma.asset.findMany({
            where: { userId: user.id }
        });

        console.log(`[API] Refreshing prices for ${assets.length} assets...`);

        const updatedAssets = await Promise.all(assets.map(async (asset) => {
            if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                if (asset.symbol) {
                    try {
                        const marketData = await MarketDataService.getAssetPrice(asset.symbol, asset.type as any);

                        // Update DB if price changed significantly? 
                        // For now, we just return the fresh data, but maybe we should update the DB 'balance' or 'totalValue' if we stored it.
                        // The Asset model has 'quantity' and 'balance'. For crypto/stock, 'balance' is usually 0 or unused, 'quantity' is used.
                        // We calculate totalValue on the fly.

                        return {
                            ...asset,
                            currentPrice: marketData.price,
                            change24h: marketData.change24h,
                            totalValue: (asset.quantity || 0) * marketData.price
                        };
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

        // Optionally record history snapshot
        await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json({ success: true, assets: updatedAssets });

    } catch (error: any) {
        console.error("Error refreshing assets:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
