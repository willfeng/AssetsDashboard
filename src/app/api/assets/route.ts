import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { MarketDataService } from '@/lib/market-data';
import { recordDailyHistoryWithTotal } from '@/lib/history';

export async function GET() {
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
        console.log(`[API] Fetching assets for ${user.id}. Found: ${assets.length}`);

        // Enrich with market data (prices)
        const enrichedAssets = await Promise.all(assets.map(async (asset: any) => {
            let currentPrice = 0;
            let totalValue = 0;
            let change24h = 0;

            if (asset.type === 'BANK') {
                totalValue = asset.balance || 0;
            } else if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                try {
                    if (asset.symbol) {
                        const marketData = await MarketDataService.getAssetPrice(asset.symbol, asset.type as any);
                        currentPrice = marketData.price;
                        change24h = marketData.change24h;
                        totalValue = (asset.quantity || 0) * currentPrice;
                    }
                } catch (e) {
                    console.error(`Failed to fetch price for ${asset.symbol}`, e);
                }
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
                change24h
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
            }
        });

        let currentPrice = 0;
        let totalValue = 0;
        let change24h = 0;

        if (newAsset.type === 'BANK') {
            totalValue = newAsset.balance || 0;
        } else {
            if (newAsset.symbol) {
                try {
                    const marketData = await MarketDataService.getAssetPrice(newAsset.symbol, newAsset.type as any);
                    currentPrice = marketData.price;
                    change24h = marketData.change24h;
                    totalValue = (newAsset.quantity || 0) * currentPrice;
                } catch (e) {
                    console.warn(`Could not fetch price for ${newAsset.symbol}`);
                }
            }
        }

        await recordDailyHistoryWithTotal(user.id);

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

        await recordDailyHistoryWithTotal(user.id);

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

        await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json(updatedAsset);
    } catch (error: any) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}
