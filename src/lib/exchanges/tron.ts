
// @ts-ignore
import { TronWeb } from 'tronweb';
import { ExchangeAdapter } from "./types";

export class TronAdapter implements ExchangeAdapter {
    providerName = "WALLET_TRON";
    private tronWeb: any;

    constructor() {
        // Use separate nodes for better compatibility
        const config: any = {
            fullNode: 'https://api.trongrid.io',
            solidityNode: 'https://api.trongrid.io',
            eventServer: 'https://api.trongrid.io',
        };

        // Only add header if API key is present
        if (process.env.TRON_API_KEY) {
            config.headers = { "TRON-PRO-API-KEY": process.env.TRON_API_KEY };
        }

        this.tronWeb = new TronWeb(config);
    }

    async validateKeys(apiKey: string, apiSecret?: string): Promise<boolean> {
        try {
            return this.tronWeb.isAddress(apiKey);
        } catch (e) {
            console.error("TronAdapter validateKeys error:", e);
            return false;
        }
    }

    async fetchBalances(apiKey: string, apiSecret?: string): Promise<Record<string, number>> {
        try {
            console.log(`[TronAdapter] Fetching balance for ${apiKey}...`);

            // Validate address first
            if (!this.tronWeb.isAddress(apiKey)) {
                throw new Error(`Invalid Tron address: ${apiKey}`);
            }

            // TronWeb.trx.getBalance returns Sun (1 TRX = 1,000,000 Sun)
            const balanceInSun = await this.tronWeb.trx.getBalance(apiKey);
            const balanceInTrx = this.tronWeb.fromSun(balanceInSun);

            console.log(`[TronAdapter] Balance: ${balanceInTrx} TRX`);

            return {
                "TRX": parseFloat(balanceInTrx)
            };
        } catch (error: any) {
            console.error("Failed to fetch Tron balance:", error);
            throw new Error(`Failed to fetch Tron balance: ${error.message}`);
        }
    }
}
