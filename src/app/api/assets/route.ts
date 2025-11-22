import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Asset } from '@/types';
import { MarketDataService } from '@/lib/market-data';

export async function GET() {
    const db = await getDb();
    return NextResponse.json(db.data.assets);
}

export async function POST(request: Request) {
    try {
        const body = await request.json();

        // Basic validation
        if (!body.type || !body.name) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        const newAsset: Asset = {
            id: `${body.type.toLowerCase()}-${Date.now()}`,
            ...body,
            // Calculate total value for investments if not provided
            totalValue: body.type === 'BANK'
                ? body.balance
                : (body.quantity * (body.currentPrice || 0)) // Price will be 0 initially until market data integration
        };

        // Fetch real-time price for investments
        if (newAsset.type === 'STOCK' || newAsset.type === 'CRYPTO') {
            if (!newAsset.currentPrice) {
                try {
                    const price = await MarketDataService.getAssetPrice(
                        newAsset.symbol!,
                        newAsset.type
                    );
                    if (price > 0) {
                        newAsset.currentPrice = price;
                        newAsset.totalValue = newAsset.quantity * price;
                    } else {
                        console.warn(`Could not fetch price for ${newAsset.symbol}`);
                    }
                } catch (e) {
                    console.error("Price fetch failed:", e);
                }
            }
        }

        const db = await getDb();
        db.data.assets.push(newAsset);
        await db.write();

        return NextResponse.json(newAsset, { status: 201 });
    } catch (error) {
        console.error("Error creating asset:", error);
        return NextResponse.json(
            { error: 'Failed to create asset' },
            { status: 500 }
        );
    }
}

export async function PATCH() {
    let updatedCount = 0;
    try {
        const db = await getDb();
        for (const asset of db.data.assets) {
            if (asset.type === 'STOCK' || asset.type === 'CRYPTO') {
                try {
                    const price = await MarketDataService.getAssetPrice(
                        asset.symbol!,
                        asset.type
                    );
                    if (price > 0 && price !== asset.currentPrice) {
                        asset.currentPrice = price;
                        asset.totalValue = asset.quantity * price;
                        updatedCount++;
                    }
                } catch (e) {
                    console.error(`Failed to refresh price for ${asset.symbol}:`, e);
                }
            }
        }

        if (updatedCount > 0) {
            await db.write();
        }

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

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
        }

        const db = await getDb();
        const initialLength = db.data.assets.length;
        db.data.assets = db.data.assets.filter(asset => asset.id !== id);

        if (db.data.assets.length < initialLength) {
            await db.write();
            return NextResponse.json({ success: true });
        } else {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }
    } catch (error) {
        console.error("Error deleting asset:", error);
        return NextResponse.json({ error: 'Failed to delete asset' }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { id, ...updates } = body;

        if (!id) {
            return NextResponse.json({ error: 'Asset ID is required' }, { status: 400 });
        }

        const db = await getDb();
        const assetIndex = db.data.assets.findIndex(a => a.id === id);

        if (assetIndex === -1) {
            return NextResponse.json({ error: 'Asset not found' }, { status: 404 });
        }

        const asset = db.data.assets[assetIndex];

        // Update fields
        const updatedAsset = { ...asset, ...updates };

        // Recalculate totalValue if quantity or price changed
        if (updatedAsset.type === 'BANK') {
            // For bank, balance is the value
            if (updates.balance !== undefined) {
                updatedAsset.balance = updates.balance;
            }
        } else {
            // For stock/crypto
            if (updates.quantity !== undefined || updates.currentPrice !== undefined) {
                // If price wasn't provided in update, use existing
                const price = updates.currentPrice || asset.currentPrice || 0;
                updatedAsset.totalValue = updatedAsset.quantity * price;
            }
        }

        db.data.assets[assetIndex] = updatedAsset;
        await db.write();

        return NextResponse.json(updatedAsset);
    } catch (error) {
        console.error("Error updating asset:", error);
        return NextResponse.json({ error: 'Failed to update asset' }, { status: 500 });
    }
}
