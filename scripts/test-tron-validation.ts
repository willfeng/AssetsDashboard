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
            const result2 = (TronWeb as any).utils.crypto.isAddressValid(testAddress);
            console.log(`  Result:`, result2);
        } catch (e: any) {
            console.log(`  Error:`, e.message);
        }

        // Method 3: Check typeof
        console.log("\nMethod 3: Checking TronWeb structure");
        console.log("  TronWeb.utils:", typeof (TronWeb as any).utils);
    } catch (error: any) {
        console.error("\nFatal Error:", error.message);
    }
}

main();
