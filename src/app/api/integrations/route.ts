import { NextResponse } from 'next/server';
// Force rebuild
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { encrypt } from '@/lib/encryption';

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { provider, apiKey, apiSecret, name, extraParams } = body;

        if (!provider || !apiKey) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Encrypt keys before saving
        const encryptedKey = encrypt(apiKey);
        const encryptedSecret = apiSecret ? encrypt(apiSecret) : null;
        const encryptedExtra = extraParams ? encrypt(extraParams) : null;

        // Create new integration (we allow multiple wallets now)
        const integration = await prisma.integration.create({
            data: {
                userId: user.id,
                provider: provider.toUpperCase(),
                name: name || null,
                apiKey: encryptedKey,
                apiSecret: encryptedSecret,
                extraParams: encryptedExtra,
            }
        });

        return NextResponse.json({ success: true, id: integration.id });
    } catch (error: any) {
        console.error("Error saving integration:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const integrations = await prisma.integration.findMany({
            where: { userId: user.id },
            select: {
                id: true,
                provider: true,
                name: true,
                isActive: true,
                lastSync: true,
                createdAt: true,
                // Do not return keys
            },
            orderBy: { createdAt: 'desc' }
        });

        return NextResponse.json(integrations);
    } catch (error: any) {
        console.error("Error fetching integrations:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
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
            return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
        }

        const integration = await prisma.integration.findUnique({
            where: { id },
        });

        if (!integration || integration.userId !== user.id) {
            return NextResponse.json({ error: 'Integration not found or unauthorized' }, { status: 404 });
        }

        // Delete associated assets using the direct link
        await prisma.asset.deleteMany({
            where: {
                userId: user.id,
                integrationId: id
            }
        });

        // Delete the integration
        await prisma.integration.delete({
            where: { id },
        });

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error deleting integration:", error);
        return NextResponse.json({ error: 'Failed to delete integration' }, { status: 500 });
    }
}
