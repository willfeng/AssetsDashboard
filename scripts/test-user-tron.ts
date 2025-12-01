// @ts-ignore
import { TronWeb } from 'tronweb';

async function main() {
    const userAddress = "TTwwsWP96nzaisdvfAV3mJjGDSYbLE77UV";
    console.log(`Testing with user's address: ${userAddress}\n`);

    // Test configuration 1: fullHost
    console.log("=== Config 1: fullHost ===");
    try {
        const tronWeb1 = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        console.log("Instance created");
        const balance1 = await tronWeb1.trx.getBalance(userAddress);
        console.log(`✓ Balance: ${tronWeb1.fromSun(balance1)} TRX\n`);
    } catch (e: any) {
        console.log(`✗ Error: ${e.message}\n`);
    }

    // Test configuration 2: Separate nodes
    console.log("=== Config 2: Separate nodes ===");
    try {
        const tronWeb2 = new TronWeb({
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io'
        });
        console.log("Instance created");
        const balance2 = await tronWeb2.trx.getBalance(userAddress);
        console.log(`✓ Balance: ${tronWeb2.fromSun(balance2)} TRX\n`);
    } catch (e: any) {
        console.log(`✗ Error: ${e.message}\n`);
    }

    // Test isAddress
    console.log("=== Testing isAddress ===");
    try {
        const tronWeb3 = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });
        const isValid = tronWeb3.isAddress(userAddress);
        console.log(`isAddress result: ${isValid}`);
    } catch (e: any) {
        console.log(`Error: ${e.message}`);
    }
}

main();
