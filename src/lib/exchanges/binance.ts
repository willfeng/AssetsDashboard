
import * as ccxt from 'ccxt';
import { ExchangeAdapter } from './types';

export class BinanceAdapter implements ExchangeAdapter {
    providerName = 'BINANCE';

    async validateKeys(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<boolean> {
        try {
            const exchange = new ccxt.binance({
                apiKey: apiKey,
                secret: apiSecret,
                enableRateLimit: true,
                options: {
                    'adjustForTimeDifference': true,
                    'recvWindow': 60000,
                }
            });
            // Try to fetch balance to validate keys
            await exchange.fetchBalance();
            return true;
        } catch (error) {
            console.error(`[BinanceAdapter] Validation failed:`, error);
            return false;
        }
    }

    async fetchBalances(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<Record<string, number>> {
        // Proxy logic removed as per user request
        // const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7890';
        // const agent = new HttpsProxyAgent(proxyUrl);

        const exchange = new ccxt.binance({
            apiKey: apiKey,
            secret: apiSecret,
            enableRateLimit: true,
            // agent: agent, 
            options: {
                'adjustForTimeDifference': true,
                'recvWindow': 60000,
            }
        });

        console.log(`[BinanceAdapter] Fetching balances...`);
        const balance = await exchange.fetchBalance();
        const rawBalances = (balance.total as unknown) as Record<string, number>;
        const aggregatedBalances: Record<string, number> = {};

        for (const [rawSymbol, quantity] of Object.entries(rawBalances)) {
            if (quantity > 0) {
                let symbol = rawSymbol;
                // Handle Binance Earn "LD" prefix (e.g. LDBTC -> BTC)
                if (symbol.startsWith('LD') && symbol.length > 3) {
                    symbol = symbol.substring(2);
                }
                aggregatedBalances[symbol] = (aggregatedBalances[symbol] || 0) + quantity;
            }
        }

        return aggregatedBalances;
    }
}
