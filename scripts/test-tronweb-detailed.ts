// @ts-ignore
import { TronWeb } from 'tronweb';

async function main() {
    console.log("Testing TronWeb library directly...\n");

    try {
        console.log("Step 1: Creating TronWeb instance...");
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io',
            headers: { "TRON-PRO-API-KEY": "" }
        });
        console.log("✓ TronWeb instance created");
        console.log("TronWeb type:", typeof tronWeb);
        console.log("TronWeb.isAddress type:", typeof tronWeb.isAddress);

        console.log("\nStep 2: Testing isAddress method...");
        const testAddresses = [
            "TLPiXNRK4dToDR4pG4M7KYsZ2hZiQzZxYt", // Foundation address
            "TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t", // USDT contract
            "TWd4WrZ9wn84f5x1hZhL4DHvk738ns5jwb", // Another valid address
        ];

        for (const addr of testAddresses) {
            const result = tronWeb.isAddress(addr);
            console.log(`  ${addr}: ${result}`);
        }

        console.log("\nStep 3: Testing getBalance...");
        const address = "TLPiXNRK4dToDR4pG4M7KYsZ2hZiQzZxYt";
        const balanceInSun = await tronWeb.trx.getBalance(address);
        console.log(`Balance in Sun: ${balanceInSun}`);
        const balanceInTrx = tronWeb.fromSun(balanceInSun);
        console.log(`Balance in TRX: ${balanceInTrx}`);

    } catch (error: any) {
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

main();
