// @ts-ignore
import { TronWeb } from 'tronweb';

async function main() {
    const userAddress = "TTwwsWP96nzaisdvfAV3mJjGDSYbLE77UV";
    console.log(`Testing Tron configurations for: ${userAddress}\n`);

    // Test 1: With empty API key header
    console.log("=== Test 1: With empty TRON-PRO-API-KEY header ===");
    try {
        const tronWeb1 = new TronWeb({
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io',
            headers: { "TRON-PRO-API-KEY": "" }
        });
        const balance1 = await tronWeb1.trx.getBalance(userAddress);
        console.log(`✓ Success! Balance: ${tronWeb1.fromSun(balance1)} TRX\n`);
    } catch (e: any) {
        console.log(`✗ Error: ${e.message}\n`);
    }

    // Test 2: Without headers at all
    console.log("=== Test 2: Without any headers ===");
    try {
        const tronWeb2 = new TronWeb({
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io'
        });
        const balance2 = await tronWeb2.trx.getBalance(userAddress);
        console.log(`✓ Success! Balance: ${tronWeb2.fromSun(balance2)} TRX\n`);
    } catch (e: any) {
        console.log(`✗ Error: ${e.message}\n`);
    }

    // Test 3: Alternative public endpoint (Nile testnet's mainnet mirror)
    console.log("=== Test 3: Alternative endpoint ===");
    try {
        const tronWeb3 = new TronWeb({
            fullHost: 'https://nile.trongrid.io'
        });
        const balance3 = await tronWeb3.trx.getBalance(userAddress);
        console.log(`✓ Success! Balance: ${tronWeb3.fromSun(balance3)} TRX\n`);
    } catch (e: any) {
        console.log(`✗ Error: ${e.message}\n`);
    }
}

main();
