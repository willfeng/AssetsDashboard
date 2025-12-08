export type AssetType = 'BANK' | 'STOCK' | 'CRYPTO' | 'REAL_ESTATE' | 'CUSTOM';

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

export interface RealEstateAsset {
    id: string;
    name: string; // Address or Name
    balance: number; // Current Value
    currency: string;
    averageBuyPrice?: number; // Purchase Price
    integrationId?: string;
    order?: number;
    type: 'REAL_ESTATE';
    // Mapped fields for consistent interface
    totalValue?: number; // = balance
    change24h?: number; // Calculated field if possible, else 0
}

export interface CustomAsset {
    id: string;
    name: string;
    balance: number; // Current Value
    currency: string;
    averageBuyPrice?: number; // Purchase Price
    integrationId?: string; // Likely null
    order?: number;
    type: 'CUSTOM';
    totalValue?: number; // = balance
    change24h?: number;
}

export type Asset = BankAccount | StockAsset | CryptoAsset | RealEstateAsset | CustomAsset;

export interface HistoricalDataPoint {
    date: string;
    value: number;
}
