
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Clearing database data...');

    try {
        // Delete in order of dependencies (though Cascade delete might handle it, explicit is safer)
        await prisma.assetSnapshot.deleteMany({});
        console.log('Deleted AssetSnapshots');

        await prisma.history.deleteMany({});
        console.log('Deleted History');

        await prisma.asset.deleteMany({});
        console.log('Deleted Assets');

        // Optional: Clear integrations if needed, but user asked for "assets" and "history".
        // await prisma.integration.deleteMany({});

        console.log('Database cleared successfully.');
    } catch (error) {
        console.error('Error clearing database:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
