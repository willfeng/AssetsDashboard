
import { CryptoWalletProvider } from "./types";

export const BitcoinProvider: CryptoWalletProvider = {
    name: "Bitcoin",
    chain: "BTC",

    async getBalance(address: string): Promise<number> {
        // Use Blockchain.info's simple text API
        // Returns balance in Satoshi
        const url = `https://blockchain.info/q/addressbalance/${address}`;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                // Blockchain.info returns 500 for invalid address sometimes, or just text
                throw new Error(`API error: ${response.status}`);
            }

            const text = await response.text();

            // Check if response is a number
            if (isNaN(Number(text))) {
                throw new Error(`Invalid response: ${text}`);
            }

            const satoshis = Number(text);

            // Convert Satoshi to BTC (1 BTC = 10^8 Satoshi)
            const btc = satoshis / 1e8;

            return btc;
        } catch (error) {
            console.error("[BitcoinProvider] Error fetching balance:", error);
            throw error;
        }
    }
};
