// import yahooFinance from 'yahoo-finance2'; // Removed in favor of direct fetch

interface CacheItem {
    price: number;
    timestamp: number;
}

const CACHE_DURATION = 30 * 1000; // 30 seconds for demo purposes
const priceCache = new Map<string, CacheItem>();

export const MarketDataService = {
    async getAssetPrice(symbol: string, type: 'STOCK' | 'CRYPTO'): Promise<number> {
        const cacheKey = `${type}:${symbol}`;
        const cached = priceCache.get(cacheKey);

        if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
            console.log(`[MarketData] Cache HIT for ${symbol} (${cached.price})`);
            return cached.price;
        }

        console.log(`[MarketData] Cache MISS for ${symbol} (${type}) - Fetching...`);
        let price = 0;

        try {
            if (type === 'STOCK') {
                price = await this.getStockPrice(symbol);
            } else if (type === 'CRYPTO') {
                price = await this.getCryptoPrice(symbol);
            }

            if (price > 0) {
                priceCache.set(cacheKey, { price, timestamp: Date.now() });
            }
        } catch (error) {
            console.error(`[MarketData] Error fetching price for ${symbol}:`, error);
            // Return 0 or throw, depending on desired behavior. 
            // For now, returning 0 allows the asset to be created without a price (user can edit later if we add that feature)
            // or we can just let the error propagate if we want to fail the request.
            // Let's return 0 to be safe for the demo.
            return 0;
        }

        return price;
    },

    async getStockPrice(symbol: string): Promise<number> {
        try {
            console.log(`[MarketData] Fetching stock price for ${symbol}`);
            const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`);
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            const data = await response.json();
            const price = data.chart?.result?.[0]?.meta?.regularMarketPrice;
            console.log(`[MarketData] Price for ${symbol}:`, price);
            return price || 0;
        } catch (error) {
            console.error(`[MarketData] Yahoo Finance error for ${symbol}:`, error);
            return 0;
        }
    },

    async getCryptoPrice(symbol: string): Promise<number> {
        // CoinGecko API requires ID, not symbol (e.g. 'bitcoin' not 'BTC').
        // For a real app, we'd need a mapping or a search step.
        // For this demo, we'll try to map common symbols or use the symbol as id if not found.
        const id = this.mapSymbolToCoinGeckoId(symbol);

        try {
            const response = await fetch(`https://api.coingecko.com/api/v3/simple/price?ids=${id}&vs_currencies=usd`);
            if (!response.ok) throw new Error(`CoinGecko API error: ${response.statusText}`);

            const data = await response.json();
            return data[id]?.usd || 0;
        } catch (error) {
            console.error(`[MarketData] CoinGecko error for ${symbol}:`, error);
            return 0;
        }
    },

    mapSymbolToCoinGeckoId(symbol: string): string {
        const s = symbol.toLowerCase();
        const map: Record<string, string> = {
            'btc': 'bitcoin',
            'eth': 'ethereum',
            'sol': 'solana',
            'doge': 'dogecoin',
            'usdt': 'tether',
            'bnb': 'binancecoin',
            'xrp': 'ripple',
            'ada': 'cardano',
            'avax': 'avalanche-2',
            'dot': 'polkadot'
        };
        return map[s] || s;
    }
};
