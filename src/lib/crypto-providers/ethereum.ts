
import { CryptoWalletProvider } from "./types";

export const EthereumProvider: CryptoWalletProvider = {
    name: "Ethereum",
    chain: "ETH",

    async getBalance(address: string): Promise<number> {
        // Use PublicNode's ETH RPC (Cloudflare was unstable)
        const rpcUrl = "https://ethereum.publicnode.com";

        try {
            const response = await fetch(rpcUrl, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    jsonrpc: "2.0",
                    method: "eth_getBalance",
                    params: [address, "latest"],
                    id: 1
                })
            });

            if (!response.ok) {
                throw new Error(`RPC error: ${response.status}`);
            }

            const data = await response.json() as any;

            if (data.error) {
                throw new Error(`RPC Error: ${data.error.message}`);
            }

            // Result is in hex wei
            const hexBalance = data.result;
            const wei = BigInt(hexBalance);

            // Convert Wei to ETH (1 ETH = 10^18 Wei)
            // Use simple division for display purposes (number precision is enough for dashboard)
            const eth = Number(wei) / 1e18;

            return eth;
        } catch (error) {
            console.error("[EthereumProvider] Error fetching balance:", error);
            throw error;
        }
    }
};
