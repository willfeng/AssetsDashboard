
export interface ExchangeAdapter {
    /**
     * Unique identifier for the provider (e.g., 'BINANCE', 'OKX')
     */
    providerName: string;

    /**
     * Validate API keys
     * @param extraParams Additional parameters (e.g. passphrase for OKX)
     * @returns true if valid, throws error or returns false if invalid
     */
    validateKeys(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<boolean>;

    /**
     * Fetch all non-zero balances
     * @param extraParams Additional parameters (e.g. passphrase for OKX)
     * @returns Map of symbol to quantity (e.g., { 'BTC': 0.5, 'USDT': 100 })
     */
    fetchBalances(apiKey: string, apiSecret: string, extraParams?: Record<string, any>): Promise<Record<string, number>>;
}
