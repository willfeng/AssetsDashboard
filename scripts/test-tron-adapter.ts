import { TronAdapter } from '../src/lib/exchanges/tron';

async function main() {
    const adapter = new TronAdapter();
    const userAddress = "TTwwsWP96nzaisdvfAV3mJjGDSYbLE77UV";

    console.log(`Testing TronAdapter with user's address: ${userAddress}\n`);

    try {
        console.log("Step 1: Validating address...");
        const isValid = await adapter.validateKeys(userAddress);
        console.log(`Validation result: ${isValid}`);

        if (!isValid) {
            console.error("✗ Address validation failed!");
            return;
        }

        console.log("\nStep 2: Fetching balance...");
        const balance = await adapter.fetchBalances(userAddress);
        console.log("✓ Balance:", balance);

    } catch (error: any) {
        console.error("\n✗ Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

main();
