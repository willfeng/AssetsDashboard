import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { plaidClient } from '@/lib/plaid';
import { prisma } from '@/lib/prisma';
import { encrypt } from '@/lib/encryption';
import { PlaidSyncService } from '@/lib/plaid-sync';

export async function POST(req: Request) {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const body = await req.json();
        const { public_token, metadata } = body;

        if (!public_token) {
            return new NextResponse('Missing public_token', { status: 400 });
        }

        // 1. Exchange public_token for access_token
        const exchangeResponse = await plaidClient.itemPublicTokenExchange({
            public_token,
        });

        const accessToken = exchangeResponse.data.access_token;
        const itemId = exchangeResponse.data.item_id;

        // 2. Encrypt the access token
        const encryptedAccessToken = encrypt(accessToken);

        // 3. Ensure User Exists in DB (Sync with Clerk)
        // We need the local DB ID (CUID), not just the Clerk ID
        const dbUser = await prisma.user.upsert({
            where: { clerkId: user.id },
            update: {}, // No updates if exists
            create: {
                clerkId: user.id,
                email: user.emailAddresses[0]?.emailAddress || "",
            },
        });

        // 4. Save to database
        const institutionName = metadata?.institution?.name || 'Unknown Bank';
        const institutionId = metadata?.institution?.institution_id;

        const integration = await prisma.integration.create({
            data: {
                userId: dbUser.id, // Use local DB ID
                provider: 'PLAID',
                name: institutionName,
                apiKey: encryptedAccessToken, // Store ENCRYPTED token
                extraParams: JSON.stringify({
                    item_id: itemId,
                    institution_id: institutionId,
                    // 'cursor' not needed for balance-only
                }),
                isActive: true,
                lastSync: new Date(),
            },
        });

        // 5. Trigger Initial Sync
        try {
            await PlaidSyncService.syncIntegration(integration.id, dbUser.id);
        } catch (syncError) {
            console.error("Initial sync warning:", syncError);
        }

        return NextResponse.json({ ok: true, integrationId: integration.id });
    } catch (error: any) {
        console.error('Error exchanging public token:', error.response?.data || error);
        return new NextResponse('Internal Server Error', { status: 500 });
    }
}
