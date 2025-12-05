export type AssetType = 'BANK' | 'STOCK' | 'CRYPTO';

export interface BankAccount {
    id: string;
    name: string;
    balance: number;
    currency: 'USD' | 'HKD' | 'CNY' | 'EUR' | 'GBP' | 'JPY' | 'AUD' | 'CAD' | 'SGD';
    apy?: number;
    integrationId?: string;
    order?: number;
    type: 'BANK';
}

export interface StockAsset {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    totalValue: number;
    change24h: number; // Percentage
    currency?: string;
    averageBuyPrice?: number;
    integrationId?: string;
    order?: number;
    type: 'STOCK';
}

export interface CryptoAsset {
    id: string;
    symbol: string;
    name: string;
    quantity: number;
    currentPrice: number;
    totalValue: number;
    change24h: number; // Percentage
    currency?: string;
    averageBuyPrice?: number;
    integrationId?: string;
    order?: number;
    type: 'CRYPTO';
}

export type Asset = BankAccount | StockAsset | CryptoAsset;

export interface HistoricalDataPoint {
    date: string;
    value: number;
}
