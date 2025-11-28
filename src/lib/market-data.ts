// import yahooFinance from 'yahoo-finance2'; // Removed in favor of direct fetch

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
        try {
            console.log(`[MarketData] Fetching stock price for ${symbol}`);
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const meta = data.chart?.result?.[0]?.meta;
            const price = meta?.regularMarketPrice || 0;
            const previousClose = meta?.chartPreviousClose || meta?.previousClose || price;

            // Try to get direct change percent if available, otherwise calculate
            // Note: Yahoo Chart API 'meta' usually has previousClose, but maybe not explicit change percent.
            // Calculation is robust: (current - prev) / prev * 100
            let change24h = 0;
            if (previousClose > 0) {
                change24h = ((price - previousClose) / previousClose) * 100;
            }

            console.log(`[MarketData] Price for ${symbol}: ${price}, Change: ${change24h.toFixed(2)}%`);
            return { price, change24h };
        } catch (error) {
            console.error(`[MarketData] Yahoo Finance error for ${symbol}:`, error);
            return { price: 0, change24h: 0 };
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
    }
};
