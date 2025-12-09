
import { StockDataProvider } from "./types";

export const YahooProvider: StockDataProvider = {
    name: "YahooFinance",

    async getPrice(symbol: string): Promise<{ price: number; change24h: number }> {
        console.log(`[YahooProvider] Fetching price for ${symbol}`);
        const response = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`, { cache: 'no-store' });

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const meta = data.chart?.result?.[0]?.meta;

        if (!meta) {
            throw new Error("Invalid response format from Yahoo Finance");
        }

        const price = meta.regularMarketPrice || 0;
        const previousClose = meta.chartPreviousClose || meta.previousClose || price;

        let change24h = 0;
        if (previousClose > 0) {
            change24h = ((price - previousClose) / previousClose) * 100;
        }

        return { price, change24h };
    },

    async getHistorical(symbol: string, queryOptions: any): Promise<any[]> {
        console.log(`[YahooProvider] Fetching history for ${symbol}`);
        try {
            const yahooFinance = (await import('yahoo-finance2')).default;
            const result = await yahooFinance.historical(symbol, queryOptions);
            return result;
        } catch (error) {
            console.error(`[YahooProvider] Failed to fetch history for ${symbol}:`, error);
            throw error;
        }
    }
};
