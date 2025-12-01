
import * as ccxt from 'ccxt';
import { ExchangeAdapter } from './types';

export class OkxAdapter implements ExchangeAdapter {
    providerName = 'OKX';

    async validateKeys(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<boolean> {
        try {
            const apiPassword = extraParams?.passphrase;
            // OKX requires a password (passphrase) for API access
            if (!apiPassword) {
                console.error(`[OkxAdapter] API Password (Passphrase) is required for OKX`);
                return false;
            }

            const exchange = new ccxt.okx({
                apiKey: apiKey,
                secret: apiSecret,
                password: apiPassword,
                enableRateLimit: true,
            });

            // Try to fetch balance to validate keys
            await exchange.fetchBalance();
            return true;
        } catch (error) {
            console.error(`[OkxAdapter] Validation failed:`, error);
            return false;
        }
    }

    async fetchBalances(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<Record<string, number>> {
        const apiPassword = extraParams?.passphrase;
        if (!apiPassword) {
            throw new Error('OKX API Password (Passphrase) is required');
        }

        const exchange = new ccxt.okx({
            apiKey: apiKey,
            secret: apiSecret,
            password: apiPassword,
            enableRateLimit: true,
        });

        console.log(`[OkxAdapter] Fetching balances...`);

        // OKX fetchBalance returns a unified structure in CCXT
        // It typically aggregates Trading and Funding if using Unified Account, 
        // but sometimes they are separate. 
        // For simplicity in V1, we trust CCXT's default aggregation or 'total' field.
        const balance = await exchange.fetchBalance();
        const rawBalances = (balance.total as unknown) as Record<string, number>;
        const aggregatedBalances: Record<string, number> = {};

        for (const [symbol, quantity] of Object.entries(rawBalances)) {
            if (quantity > 0) {
                aggregatedBalances[symbol] = (aggregatedBalances[symbol] || 0) + quantity;
            }
        }

        return aggregatedBalances;
    }
}
