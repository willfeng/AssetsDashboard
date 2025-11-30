
const { PrismaClient } = require('@prisma/client');
const dotenv = require('dotenv');

dotenv.config();

const prisma = new PrismaClient();

async function main() {
    try {
        const integration = await prisma.integration.findFirst({
            where: { provider: 'BINANCE' }
        });

        if (!integration) {
            console.log('No Binance integration found.');
            return;
        }

        console.log(`Found integration: ${integration.id} (${integration.name})`);
        console.log(`API Key (encrypted): ${integration.apiKey.substring(0, 10)}...`);

        // Simulate the API call logic directly since we can't easily curl localhost from here without knowing port/auth cookie
        // Actually, we can just run the logic here to test it.
        // But better to test the API endpoint if possible. 
        // However, the API endpoint requires authentication (cookie).
        // So let's replicate the logic of sync/route.ts here to debug it.

        const { decrypt } = require('./src/lib/encryption'); // We need to point to the compiled JS or use ts-node? 
        // Ah, we are in JS land. src/lib/encryption is TS.
        // We can't easily require TS files in node without ts-node.

        // Let's try to use the API via fetch if the server is running on localhost:3000
        // But we need the session cookie.

        // Alternative: Use ts-node to run a TS script that imports the actual route logic?
        // No, route logic is in a function.

        // Let's go back to ts-node but fix the "implicit any" error by adding a tsconfig or just ignoring it?
        // Or just write a TS script that is loose.

        console.log("Please check the server console logs for errors.");

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
