const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    }
});

async function main() {
    try {
        const users = await prisma.user.findMany({
            include: {
                assets: true,
                history: true
            }
        });

        console.log("Users found:", users.length);
        users.forEach(user => {
            console.log(`User: ${user.email} (${user.clerkId})`);
            console.log(`  Assets: ${user.assets.length}`);
            console.log(`  History Records: ${user.history.length}`);
            if (user.history.length > 0) {
                console.log("  Last History Record:", user.history[user.history.length - 1]);
            }
        });
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
