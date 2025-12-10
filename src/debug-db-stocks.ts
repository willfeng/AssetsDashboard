
import { PrismaClient } from '@prisma/client';

// Hardcode connection to bypass env loading issues
process.env.DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/postgres";

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("=== Inspecting Stocks ===");
        const user = await prisma.user.findFirst();
        if (!user) { console.error("No user found"); return; }

        console.log(`User: ${user.id}`);

        const assets = await prisma.asset.findMany({
            where: { userId: user.id }
        });

        const stocks = assets.filter(a => a.type === 'STOCK');
        console.log(`Total Assets: ${assets.length}`);
        console.log(`Stock Assets: ${stocks.length}`);

        stocks.forEach(s => {
            console.log(`- [${s.symbol}] ${s.name} (Qty: ${s.quantity})`);
        });

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
