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
        const { items } = body;

        if (!Array.isArray(items)) {
            return NextResponse.json({ error: 'Invalid items format' }, { status: 400 });
        }

        // Transaction to update all items
        await prisma.$transaction(
            items.map((item: { id: string; order: number }) =>
                prisma.asset.update({
                    where: {
                        id: item.id,
                        userId: user.id // Security check: ensure user owns the asset
                    },
                    data: { order: item.order }
                })
            )
        );

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error("Error reordering assets:", error);
        return NextResponse.json({ error: 'Failed to reorder assets' }, { status: 500 });
    }
}
