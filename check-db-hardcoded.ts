
process.env.DATABASE_URL = "postgresql://postgres.zzrbzrgfqofojbvmko:86a5aeaef246d894fda01b90@aws-1-ap-south-1.pooler.supabase.com:5432/postgres";

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkData() {
    try {
        console.log("Connecting to DB...");
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found in the database.");
            return;
        }

        console.log(`Checking data for user: ${user.email} (${user.id})`);

        const assets = await prisma.asset.findMany({ where: { userId: user.id } });
        console.log(`Assets count: ${assets.length}`);

        const integrations = await prisma.integration.findMany({ where: { userId: user.id } });
        console.log(`Integrations count: ${integrations.length}`);

    } catch (error) {
        console.error("Error checking data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
