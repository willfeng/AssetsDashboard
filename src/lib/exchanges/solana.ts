
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";
import { ExchangeAdapter } from "./types";



export class SolanaAdapter implements ExchangeAdapter {
    providerName = "WALLET_SOL";
    private connection: Connection;

    constructor() {
        // Use official Solana RPC (tested and working)
        this.connection = new Connection("https://api.mainnet-beta.solana.com", "confirmed");
    }

    async validateKeys(apiKey: string, apiSecret?: string): Promise<boolean> {
        try {
            new PublicKey(apiKey);
            return true;
        } catch (e) {
            return false;
        }
    }

    async fetchBalances(apiKey: string, apiSecret?: string): Promise<Record<string, number>> {
        try {
            console.log(`[SolanaAdapter] Fetching balance for ${apiKey}...`);
            const publicKey = new PublicKey(apiKey);
            const balance = await this.connection.getBalance(publicKey);

            // Convert Lamports to SOL
            const solBalance = balance / LAMPORTS_PER_SOL;

            return {
                "SOL": solBalance
            };
        } catch (error: any) {
            console.error("Failed to fetch Solana balance:", error);
            throw new Error(`Failed to fetch Solana balance: ${error.message}`);
        }
    }
}
