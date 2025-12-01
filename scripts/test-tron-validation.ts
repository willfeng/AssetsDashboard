// @ts-ignore
import { TronWeb } from 'tronweb';

async function main() {
    console.log("Testing different TronWeb address validation methods...\n");

    try {
        const tronWeb = new TronWeb({
            fullHost: 'https://api.trongrid.io'
        });

        const testAddress = "TLPiXNRK4dToDR4pG4M7KYsZ2hZiQzZxYt";

        console.log(`Testing address: ${testAddress}\n`);

        // Method 1: Direct isAddress
        console.log("Method 1: tronWeb.isAddress()");
        try {
            const result1 = tronWeb.isAddress(testAddress);
            console.log(`  Result:`, result1);
        } catch (e: any) {
            console.log(`  Error:`, e.message);
        }

        // Method 2: utils.crypto
        console.log("\nMethod 2: TronWeb.utils.crypto.isAddressValid()");
        try {
            const result2 = TronWeb.utils.crypto.isAddressValid(testAddress);
            console.log(`  Result:`, result2);
        } catch (e: any) {
            console.log(`  Error:`, e.message);
        }

        // Method 3: Check typeof
        console.log("\nMethod 3: Checking TronWeb structure");
        console.log("  TronWeb.utils:", typeof TronWeb.utils);
        console.log("  TronWeb.utils.crypto:", typeof TronWeb.utils?.crypto);
        console.log("  TronWeb.utils.crypto.isAddressValid:", typeof TronWeb.utils?.crypto?.isAddressValid);

        // Method 4: Try to get balance (if it doesn't throw, address is valid)
        console.log("\nMethod 4: Try getBalance as validation");
        try {
            const balance = await tronWeb.trx.getBalance(testAddress);
            console.log(`  Success! Balance: ${balance} Sun`);
            console.log(`  Balance in TRX: ${tronWeb.fromSun(balance)}`);
        } catch (e: any) {
            console.log(`  Error:`, e.message);
        }

    } catch (error: any) {
        console.error("\nFatal Error:", error.message);
    }
}

main();
