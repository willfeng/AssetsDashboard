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
                        // Fallback if API fails (keep 0 or set a flag?)
                        // For now, we'll leave it as 0 but maybe log a warning
                        console.warn(`Could not fetch price for ${newAsset.symbol}`);
                        // Optional: Set a default mock price if you really want to avoid 0 in demo
                        // newAsset.currentPrice = 100; 
                        // newAsset.totalValue = newAsset.quantity * 100;
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
