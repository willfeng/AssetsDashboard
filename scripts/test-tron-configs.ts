// @ts-ignore
import { TronWeb } from 'tronweb';

async function testConfig(name: string, config: any) {
    console.log(`\n=== Testing: ${name} ===`);
    try {
        const tronWeb = new TronWeb(config);
        const testAddress = "TLPiXNRK4dToDR4pG4M7KYsZ2hZiQzZxYt";

        console.log("Instance created successfully");
        console.log("Attempting getBalance...");

        const balance = await tronWeb.trx.getBalance(testAddress);
        console.log(`✓ Success! Balance: ${tronWeb.fromSun(balance)} TRX`);
        return true;
    } catch (error: any) {
        console.log(`✗ Error: ${error.message}`);
        return false;
    }
}

async function main() {
    console.log("Testing different TronWeb configurations...");

    // Config 1: fullHost only
    await testConfig("fullHost only", {
        fullHost: 'https://api.trongrid.io'
    });

    // Config 2: Separate nodes (recommended)
    await testConfig("Separate nodes", {
        fullNode: 'https://api.trongrid.io',
        solidityNode: 'https://api.trongrid.io',
        eventServer: 'https://api.trongrid.io'
    });

    // Config 3: With headers
    await testConfig("With headers", {
        fullNode: 'https://api.trongrid.io',
        solidityNode: 'https://api.trongrid.io',
        eventServer: 'https://api.trongrid.io',
        headers: { "TRON-PRO-API-KEY": "" }
    });

    // Config 4: Alternative endpoint
    await testConfig("Alternative endpoint (tronscan)", {
        fullHost: 'https://apilist.tronscan.org'
    });
}

main();
