
import * as ccxt from 'ccxt';
import { ExchangeAdapter } from './types';

export class KrakenAdapter implements ExchangeAdapter {
    providerName = 'KRAKEN';

    async validateKeys(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<boolean> {
        try {
            const exchange = new ccxt.kraken({
                apiKey: apiKey,
                secret: apiSecret,
                enableRateLimit: true,
            });
            // Try to fetch balance to validate keys
            await exchange.fetchBalance();
            return true;
        } catch (error) {
            console.error(`[KrakenAdapter] Validation failed:`, error);
            return false;
        }
    }

    async fetchBalances(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<Record<string, number>> {
        const exchange = new ccxt.kraken({
            apiKey: apiKey,
            secret: apiSecret,
            enableRateLimit: true,
        });

        console.log(`[KrakenAdapter] Fetching balances...`);
        const balance = await exchange.fetchBalance();
        const rawBalances = (balance.total as unknown) as Record<string, number>;
        const aggregatedBalances: Record<string, number> = {};

        for (const [rawSymbol, quantity] of Object.entries(rawBalances)) {
            if (quantity > 0) {
                let symbol = rawSymbol;

                // Kraken often uses 'ZUSD' for USD, 'XXBT' for BTC, etc.
                // ccxt usually normalizes these, but let's be safe or rely on ccxt's common currency codes.
                // Actually ccxt `fetchBalance` usually returns common codes (BTC, USD) in the `total` object.
                // But if it returns raw codes, we might need mapping. 
                // CCXT documentation says it returns common codes by default.

                // However, just in case, let's log if we see weird prefixes.
                // Common Kraken prefixes: X for crypto (XXBT), Z for fiat (ZUSD).
                // CCXT should handle this, so we trust CCXT's output first.

                aggregatedBalances[symbol] = (aggregatedBalances[symbol] || 0) + quantity;
            }
        }

        return aggregatedBalances;
    }
}
