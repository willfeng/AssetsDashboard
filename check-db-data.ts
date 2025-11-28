
const dotenvResult = require('dotenv').config({ path: require('path').resolve(__dirname, '.env') });
console.log("Dotenv parsed keys:", Object.keys(dotenvResult.parsed || {}));
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Unset");

import { prisma } from './src/lib/prisma';

async function checkData() {
    try {
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No users found in the database.");
            return;
        }

        console.log(`Checking data for user: ${user.email} (${user.id})`);

        const assets = await prisma.asset.findMany({ where: { userId: user.id } });
        console.log(`Assets count: ${assets.length}`);
        if (assets.length > 0) {
            console.log("First 3 assets:", assets.slice(0, 3));
        }

        const history = await prisma.history.findMany({ where: { userId: user.id } });
        console.log(`History records count: ${history.length}`);
        if (history.length > 0) {
            console.log("First 3 history records:", history.slice(0, 3));
        }

    } catch (error) {
        console.error("Error checking data:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkData();
