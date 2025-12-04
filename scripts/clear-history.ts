
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Starting historical data cleanup...');

    try {
        // Delete all AssetSnapshots
        const deletedSnapshots = await prisma.assetSnapshot.deleteMany({});
        console.log(`Deleted ${deletedSnapshots.count} asset snapshots.`);

        // Delete all History records
        const deletedHistory = await prisma.history.deleteMany({});
        console.log(`Deleted ${deletedHistory.count} history records.`);

        console.log('Cleanup completed successfully.');
    } catch (error) {
        console.error('Error clearing history:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
