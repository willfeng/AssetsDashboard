
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { assetId, type, quantity, pricePerUnit, date, fee, notes } = body;

        // Basic validation
        if (!assetId || !type || quantity === undefined || pricePerUnit === undefined) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        // Verify asset ownership
        const asset = await prisma.asset.findUnique({
            where: { id: assetId }
        });

        if (!asset || asset.userId !== user.id) {
            return NextResponse.json({ error: 'Asset not found or unauthorized' }, { status: 404 });
        }

        const transactionDate = date ? new Date(date) : new Date();

        // 1. Create the Transaction Record
        const transaction = await prisma.transaction.create({
            data: {
                assetId,
                type, // BUY, SELL, TRANSFER_IN, TRANSFER_OUT
                quantity: Number(quantity),
                pricePerUnit: Number(pricePerUnit),
                fee: fee ? Number(fee) : 0,
                date: transactionDate,
                notes
            }
        });

        // 2. Auto-update Asset Balance & Avg Price (Only for Manual Assets)
        // If integrationId is present, we assume balance is synced from source, so we only record history.
        if (!asset.integrationId) {
            let newQuantity = asset.quantity || 0;
            let currentAvgPrice = asset.averageBuyPrice || 0;

            if (type === 'BUY' || type === 'TRANSFER_IN') {
                // Weighted Average formula: ((OldQty * OldAvg) + (NewQty * NewPrice)) / (OldQty + NewQty)
                const totalCost = (newQuantity * currentAvgPrice) + (Number(quantity) * Number(pricePerUnit));
                newQuantity += Number(quantity);
                if (newQuantity > 0) {
                    currentAvgPrice = totalCost / newQuantity;
                }
            } else if (type === 'SELL' || type === 'TRANSFER_OUT') {
                newQuantity -= Number(quantity);
                // Selling doesn't change average buy price of remaining assets
            }

            await prisma.asset.update({
                where: { id: assetId },
                data: {
                    quantity: newQuantity,
                    averageBuyPrice: currentAvgPrice
                }
            });
        }

        return NextResponse.json(transaction);

    } catch (error: any) {
        console.error("Error creating transaction:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
