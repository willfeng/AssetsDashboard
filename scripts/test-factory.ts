
import { ExchangeFactory } from '../src/lib/exchanges/factory';

async function main() {
    console.log("Testing ExchangeFactory...");
    try {
        const providers = ExchangeFactory.getSupportedProviders();
        console.log("Supported providers:", providers);

        const adapter = ExchangeFactory.getAdapter("WALLET_SOL");
        console.log("Got adapter:", adapter.providerName);

        const address = "GH9xi3L15J6udZBdsGt74i6kGzrJKn9BACKJD7oTV1Y4";
        const balance = await adapter.fetchBalances(address);
        console.log("Balance:", balance);

    } catch (error) {
        console.error("Error:", error);
    }
}

main();
