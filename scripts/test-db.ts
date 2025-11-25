import { prisma } from '../src/lib/prisma';

async function main() {
    console.log('Testing database connection...');
    try {
        const userCount = await prisma.user.count();
        console.log(`Successfully connected! Found ${userCount} users.`);
    } catch (error) {
        console.error('Database connection failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
