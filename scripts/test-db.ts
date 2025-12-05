import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Attempting to connect to database...");
        await prisma.$connect();
        console.log("Connection successful!");

        // Check if we can query
        const count = await prisma.user.count();
        console.log(`Found ${count} users.`);

        // Check if costBasis column exists (by trying to select it, if possible, or just by introspection)
        // We can't easily check column existence via client without raw query, but connection success is the main step.

    } catch (error) {
        console.error("Connection failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
