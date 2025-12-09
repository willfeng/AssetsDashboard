
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { prisma } from '@/lib/prisma';

export async function DELETE(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        // 1. Delete all history records for this user (Total Net Worth)
        const historyResult = await prisma.history.deleteMany({
            where: {
                userId: user.id
            }
        });

        // 2. Delete all AssetSnapshot records for this user's assets (Category Trends)
        // Since AssetSnapshot relates to Asset, and Asset relates to User.
        // Prisma allows deleting relations, but strict querying is safer.
        const snapshotResult = await prisma.assetSnapshot.deleteMany({
            where: {
                asset: {
                    userId: user.id
                }
            }
        });

        console.log(`[History Reset] User ${user.id}: Deleted ${historyResult.count} history records, ${snapshotResult.count} snapshots.`);

        return NextResponse.json({
            success: true,
            deletedHistory: historyResult.count,
            deletedSnapshots: snapshotResult.count
        });

    } catch (error) {
        console.error("[History Reset] Error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
