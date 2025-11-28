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
        const { provider, apiKey, apiSecret } = body;

        if (!provider || !apiKey || !apiSecret) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Encrypt keys before saving
        const encryptedKey = encrypt(apiKey);
        const encryptedSecret = encrypt(apiSecret);

        const integration = await prisma.integration.upsert({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: provider.toUpperCase(),
                }
            },
            update: {
                apiKey: encryptedKey,
                apiSecret: encryptedSecret,
                isActive: true,
            },
            create: {
                userId: user.id,
                provider: provider.toUpperCase(),
                apiKey: encryptedKey,
                apiSecret: encryptedSecret,
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
                isActive: true,
                lastSync: true,
                createdAt: true,
            }
        });

        return NextResponse.json(integrations);
    } catch (error: any) {
        console.error("Error fetching integrations:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
