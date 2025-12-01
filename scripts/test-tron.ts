import { TronAdapter } from '../src/lib/exchanges/tron';

async function main() {
    const adapter = new TronAdapter();
    // Using a well-known Tron address (Tron Foundation)
    const address = "TLPiXNRK4dToDR4pG4M7KYsZ2hZiQzZxYt";

    console.log(`Testing TronAdapter with address: ${address}`);

    try {
        console.log("Step 1: Testing address validation...");
        const isValid = await adapter.validateKeys(address);
        console.log(`Validation result: ${isValid}`);

        if (isValid) {
            console.log("\nStep 2: Fetching balance...");
            const balance = await adapter.fetchBalances(address);
            console.log("Balance:", balance);
        } else {
            console.error("Address validation failed!");
        }
    } catch (error: any) {
        console.error("Error:", error.message);
        console.error("Stack:", error.stack);
    }
}

main();
