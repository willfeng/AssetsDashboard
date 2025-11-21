import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Asset } from '@/types';

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

        // For now, if it's a stock/crypto, we need a mock price if not provided
        // In the next step (Real-time Data), this will be fetched from API
        if (newAsset.type === 'STOCK' || newAsset.type === 'CRYPTO') {
            // Temporary mock price logic to avoid 0 value
            if (!newAsset.currentPrice) {
                newAsset.currentPrice = 100; // Default mock price
                newAsset.totalValue = newAsset.quantity * newAsset.currentPrice;
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
