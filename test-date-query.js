const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDateQuery() {
    try {
        // Simulate API logic
        const endDate = new Date();
        const startDate = new Date();
        startDate.setFullYear(endDate.getFullYear() - 1); // 1 year ago

        const startStr = startDate.toISOString().split('T')[0];
        const endStr = endDate.toISOString().split('T')[0];

        console.log('Query parameters:');
        console.log('Start date string:', startStr);
        console.log('End date string:', endStr);

        const history = await prisma.history.findMany({
            where: {
                date: {
                    gte: startStr,
                    lte: endStr,
                },
            },
            orderBy: { date: 'asc' }
        });

        console.log('\nQuery result:', history.length, 'records');
        if (history.length > 0) {
            console.log('First record:', history[0]);
            console.log('Last record:', history[history.length - 1]);
        }

        // Also try without date filter
        const allHistory = await prisma.history.findMany({
            orderBy: { date: 'asc' }
        });
        console.log('\nAll records (no filter):', allHistory.length);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testDateQuery();
