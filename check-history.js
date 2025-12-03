const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkHistory() {
    try {
        const count = await prisma.history.count();
        console.log('Total History records:', count);

        const recent = await prisma.history.findMany({
            take: 5,
            orderBy: { date: 'desc' }
        });

        console.log('\nRecent records:');
        console.log(JSON.stringify(recent, null, 2));

        // Check date format
        if (recent.length > 0) {
            console.log('\nFirst record date type:', typeof recent[0].date);
            console.log('First record date value:', recent[0].date);
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkHistory();
