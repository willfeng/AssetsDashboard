import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { MarketDataService } from '@/lib/market-data';
import { recordAssetSnapshot } from '@/lib/history';

export const dynamic = 'force-dynamic';

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const forceRefresh = searchParams.get('refresh') === 'true';

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
        console.log(`[API] Fetching assets for ${user.id}. Found: ${assets.length}`);

        // Enrich with market data (prices)
        const enrichedAssets = await Promise.all(assets.map(async (asset: any) => {
            let currentPrice = asset.lastPrice || 0;
            let lastUpdated = asset.lastPriceUpdated;
            let totalValue = 0;
            let change24h = asset.lastChange24h || 0;

            if (asset.type === 'BANK' || asset.type === 'REAL_ESTATE' || asset.type === 'CUSTOM') {
                totalValue = asset.balance || 0;
            } else if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                // CACHING STRATEGY:
                // Use the DB price (lastPrice). If missing, we return 0 (or fallback to fetch).
                // To prevent "Zero Balance" shock, if lastPrice is missing, we could try to fetch.
                // But generally, the "Refresh" loop should handle it. 

                // Auto-Refresh Logic: If price is 0 OR stale (> 5 mins) OR Forced, fetch fresh data.
                const isStale = forceRefresh || !lastUpdated || (new Date().getTime() - new Date(lastUpdated).getTime() > CACHE_DURATION);

                if ((currentPrice === 0 || isStale || asset.lastChange24h === null || asset.lastChange24h === undefined) && asset.symbol) {
                    try {
                        console.log(`[API] Refreshing price for ${asset.symbol} (Stale: ${isStale}, Force: ${forceRefresh})`);
                        const marketData = await MarketDataService.getAssetPrice(asset.symbol, asset.type as any);
                        currentPrice = marketData.price;
                        change24h = marketData.change24h;

                        // Self-Heal: Update DB asynchronously (fire and forget to not block UI too much)
                        prisma.asset.update({
                            where: { id: asset.id },
                            data: {
                                lastPrice: currentPrice,
                                lastChange24h: change24h,
                                lastPriceUpdated: new Date()
                            }
                        }).catch(e => console.error("Failed to self-heal price:", e));

                    } catch (e) {
                        // ignore
                    }
                }

                totalValue = (asset.quantity || 0) * currentPrice;
            }

            return {
                ...asset,
                type: asset.type as any,
                balance: asset.balance || 0,
                quantity: asset.quantity || 0,
                currency: asset.currency || 'USD',
                integrationId: asset.integrationId,
                currentPrice,
                totalValue,
                change24h,
                lastPriceUpdated: lastUpdated
            };
        }));

        return NextResponse.json(enrichedAssets);
    } catch (error: any) {
        console.error("Error fetching assets:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();

        if (!body.type || !body.name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // 1. Prepare Initial Price
        let currentPrice = 0;
        let change24h = 0;

        if (body.type === 'STOCK' || body.type === 'CRYPTO') {
            if (body.symbol) {
                try {
                    const marketData = await MarketDataService.getAssetPrice(body.symbol, body.type as any);
                    currentPrice = marketData.price;
                    change24h = marketData.change24h;
                } catch (e) {
                    console.warn(`Could not fetch price for ${body.symbol}`);
                }
            }
        }

        // 2. Create Asset with Price
        const newAsset = await prisma.asset.create({
            data: {
                userId: user.id,
                type: body.type,
                name: body.name,
                balance: body.balance,
                currency: body.currency,
                apy: body.apy,
                symbol: body.symbol,
                quantity: body.quantity,
                averageBuyPrice: body.averageBuyPrice,
                lastPrice: currentPrice, // Save it!
                lastChange24h: change24h, // Save it!
                lastPriceUpdated: new Date()
            }
        });

        let totalValue = 0;
        if (newAsset.type === 'BANK' || newAsset.type === 'REAL_ESTATE' || newAsset.type === 'CUSTOM') {
            totalValue = newAsset.balance || 0;
        } else {
            totalValue = (newAsset.quantity || 0) * currentPrice;
        }

        // REMOVED: await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json({
            ...newAsset,
            currentPrice,
            totalValue,
            change24h
        }, { status: 201 });

    } catch (error: any) {
        console.error("Error creating asset:", error);
        return NextResponse.json(
            { error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}

export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
        }

        const asset = await prisma.asset.findUnique({
            where: { id },
        });

        if (!asset || asset.userId !== user.id) {
            return NextResponse.json({ error: 'Asset not found or unauthorized' }, { status: 404 });
        }

        await prisma.asset.delete({
            where: { id },
        });

        // REMOVED: await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting asset:", error);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
        }

        const existingAsset = await prisma.asset.findUnique({
            where: { id },
        });

        if (!existingAsset || existingAsset.userId !== user.id) {
            return NextResponse.json({ error: 'Asset not found or unauthorized' }, { status: 404 });
        }

        const updatedAsset = await prisma.asset.update({
            where: { id },
            data: {
                name: updates.name,
                balance: updates.balance,
                quantity: updates.quantity,
                currency: updates.currency,
                apy: updates.apy,
                symbol: updates.symbol,
                averageBuyPrice: updates.averageBuyPrice,
            }
        });

        // REMOVED: await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json(updatedAsset);
    } catch (error: any) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}
