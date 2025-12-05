import { YahooProvider } from './market-providers/yahoo';
import { FinnhubProvider } from './market-providers/finnhub';

interface CacheItem {
    price: number;
    change24h?: number;
    timestamp: number;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds for demo purposes
const priceCache = new Map<string, CacheItem>();

export const MarketDataService = {
    async getAssetPrice(symbol: string, type: 'STOCK' | 'CRYPTO'): Promise<{ price: number, change24h: number }> {
        const cacheKey = `${type}:${symbol}`;
        const cached = priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`[MarketData] Cache HIT for ${symbol} (${cached.price})`);
            return { price: cached.price, change24h: cached.change24h || 0 };
        }

        console.log(`[MarketData] Cache MISS for ${symbol} (${type}) - Fetching...`);
        let result = { price: 0, change24h: 0 };

        try {
            if (type === 'STOCK') {
                result = await this.getStockPrice(symbol);
            } else if (type === 'CRYPTO') {
                result = await this.getCryptoPrice(symbol);
            }

            if (result.price > 0) {
                priceCache.set(cacheKey, { ...result, timestamp: Date.now() });
            }
        } catch (error) {
            console.error(`[MarketData] Error fetching price for ${symbol}:`, error);
            return { price: 0, change24h: 0 };
        }

        return result;
    },

    async getStockPrice(symbol: string): Promise<{ price: number, change24h: number }> {
        // 1. Try Yahoo (Primary)
        try {
            return await YahooProvider.getPrice(symbol);
        } catch (yahooError) {
            console.warn(`[MarketData] Yahoo Finance failed for ${symbol}:`, yahooError);

            // 2. Try Finnhub (Backup)
            try {
                console.log(`[MarketData] Switching to backup provider (Finnhub) for ${symbol}...`);
                return await FinnhubProvider.getPrice(symbol);
            } catch (finnhubError) {
                console.error(`[MarketData] All providers failed for ${symbol}. Finnhub error:`, finnhubError);
                return { price: 0, change24h: 0 };
            }
        }
    },

    async getCryptoPrice(symbol: string): Promise<{ price: number, change24h: number }> {
        // Binance API expects symbols like BTCUSDT
        const pair = `${symbol.toUpperCase()}USDT`;

        try {
            console.log(`[MarketData] Fetching crypto price for ${pair} from Binance`);
            // Use 24hr ticker to get both price and change
            const response = await fetch(`https://api.binance.com/api/v3/ticker/24hr?symbol=${pair}`);

            if (!response.ok) {
                if (symbol.toUpperCase() === 'USDT' || symbol.toUpperCase() === 'USDC') {
                    return { price: 1.0, change24h: 0 };
                }
                throw new Error(`Binance API error: ${response.statusText}`);
            }

            const data = await response.json();
            const price = parseFloat(data.lastPrice);
            const change24h = parseFloat(data.priceChangePercent);

            console.log(`[MarketData] Price for ${pair}: ${price}, Change: ${change24h}%`);
            return { price, change24h };
        } catch (error) {
            console.error(`[MarketData] Binance error for ${pair}:`, error);
            return { price: 0, change24h: 0 };
        }
    },

    async getHistoricalPrices(symbol: string, type: 'STOCK' | 'CRYPTO', startDate: Date, endDate: Date): Promise<Array<{ date: string, price: number }>> {
        if (type === 'STOCK') {
            try {
                // Yahoo Finance
                const queryOptions = {
                    period1: startDate,
                    period2: endDate,
                    interval: '1d' as const
                };
                const result = await YahooProvider.getHistorical(symbol, queryOptions);
                return result.map(quote => ({
                    date: quote.date.toISOString().split('T')[0],
                    price: quote.close
                }));
            } catch (error) {
                console.error(`[MarketData] Failed to fetch history for stock ${symbol}:`, error);
                return [];
            }
        } else if (type === 'CRYPTO') {
            try {
                // Binance (via CCXT or direct API)
                // Using direct API for simplicity and consistency with getCryptoPrice
                const pair = `${symbol.toUpperCase()}USDT`;
                const startTime = startDate.getTime();
                const endTime = endDate.getTime();

                const response = await fetch(`https://api.binance.com/api/v3/klines?symbol=${pair}&interval=1d&startTime=${startTime}&endTime=${endTime}`);

                if (!response.ok) throw new Error(`Binance API error: ${response.statusText}`);

                const data = await response.json();
                // Binance kline format: [open time, open, high, low, close, volume, close time, ...]
                return data.map((kline: any[]) => ({
                    date: new Date(kline[0]).toISOString().split('T')[0],
                    price: parseFloat(kline[4]) // Close price
                }));
            } catch (error) {
                console.error(`[MarketData] Failed to fetch history for crypto ${symbol}:`, error);
                return [];
            }
        }
        return [];
    }
};
