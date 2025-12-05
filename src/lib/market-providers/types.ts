
export interface StockDataProvider {
    name: string;
    getPrice(symbol: string): Promise<{ price: number; change24h: number }>;
    getHistorical?(symbol: string, queryOptions: any): Promise<any[]>;
}
