
const result = require('dotenv').config();
console.log("Dotenv result:", result);
console.log("DATABASE_URL:", process.env.DATABASE_URL ? "Set" : "Unset");
if (process.env.DATABASE_URL) {
    console.log("DATABASE_URL length:", process.env.DATABASE_URL.length);
    console.log("DATABASE_URL value:", process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@'));
}
import { getHistory } from './src/lib/history';
import { prisma } from './src/lib/prisma';

async function test() {
    try {
        // Find a user first
        const user = await prisma.user.findFirst();
        if (!user) {
            console.log("No user found");
            return;
        }
        console.log("Testing history for user:", user.id);
        const history = await getHistory(user.id, '1M');
        console.log("History:", history);
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await prisma.$disconnect();
    }
}

test();
