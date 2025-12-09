
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const assets = await prisma.asset.findMany({ take: 1 });
        if (assets.length > 0) {
            const asset = assets[0];
            console.log(`Updating asset ${asset.id} with lastPrice...`);
            const updated = await prisma.asset.update({
                where: { id: asset.id },
                data: { lastPrice: 123.45, lastPriceUpdated: new Date() }
            });
            console.log('Successfully updated:', updated.lastPrice);
        } else {
            console.log("No assets found");
        }
    } catch (e) {
        console.error('Error fetching assets:', e.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
async function main() {
    try {
        console.log("Checking DB assets...");
        const assets = await prisma.asset.findMany({
            where: {
                OR: [{ type: 'STOCK' }, { type: 'CRYPTO' }]
            },
            take: 3
        });

        console.log(`Found ${assets.length} relevant assets.`);
        for (const asset of assets) {
            console.log(`Asset: ${asset.symbol} (${asset.type})`);
            console.log(`  lastPrice: ${asset.lastPrice}`);
            console.log(`  lastChange24h: ${asset.lastChange24h} (Expected: Valid number)`);
            console.log(`  lastPriceUpdated: ${asset.lastPriceUpdated}`);
        }

        // Also Test Market Service directly
        if (assets.length > 0) {
            const target = assets[0];
            if (target.symbol) {
                console.log(`\nTesting MarketDataService for ${target.symbol}...`);
                const { MarketDataService } = require('../src/lib/market-data');
                const result = await MarketDataService.getAssetPrice(target.symbol, target.type);
                console.log("Service Result:", result);
            }
        }

    } catch (e) {
        console.error('Error:', e);
    } finally {
        await prisma.$disconnect();
    }
}
