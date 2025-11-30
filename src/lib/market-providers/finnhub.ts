
import { StockDataProvider } from "./types";

export const FinnhubProvider: StockDataProvider = {
    name: "Finnhub",

    async getPrice(symbol: string): Promise<{ price: number; change24h: number }> {
        const API_KEY = process.env.FINNHUB_API_KEY;

        if (!API_KEY) {
            throw new Error("FINNHUB_API_KEY is not configured");
        }

        console.log(`[FinnhubProvider] Fetching price for ${symbol}`);
        // Finnhub Quote API: https://finnhub.io/docs/api/quote
        const response = await fetch(`https://finnhub.io/api/v1/quote?symbol=${symbol}&token=${API_KEY}`);

        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();

        // Finnhub response: { c: Current price, d: Change, dp: Percent change, ... }
        // c: Current price
        // dp: Percent change

        if (data.c === 0 && data.dp === null) {
            // Finnhub sometimes returns 0s for invalid symbols without 404
            throw new Error("Symbol not found or no data");
        }

        return {
            price: Number(data.c),
            change24h: Number(data.dp)
        };
    }
};
