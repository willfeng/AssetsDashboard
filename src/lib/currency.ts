
// Initial static rates (Base: USD) - will be updated from API
let EXCHANGE_RATES: Record<string, number> = {
    "USD": 1,
    "HKD": 7.82,
    "CNY": 7.15,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 150.5,
    "AUD": 1.53,
    "CAD": 1.36,
    "SGD": 1.34,
};

const CURRENCY_SYMBOLS: Record<string, string> = {
    "USD": "$",
    "HKD": "HK$",
    "CNY": "¥",
    "EUR": "€",
    "GBP": "£",
    "JPY": "¥",
    "AUD": "A$",
    "CAD": "C$",
    "SGD": "S$",
};

export class CurrencyService {
    /**
     * Convert an amount from a source currency to USD
     */
    static convertToUSD(amount: number, currency: string): number {
        const rate = EXCHANGE_RATES[currency] || 1;
        return amount / rate;
    }

    /**
     * Convert an amount from USD to a target currency
     */
    static convertFromUSD(amount: number, currency: string): number {
        const rate = EXCHANGE_RATES[currency] || 1;
        return amount * rate;
    }

    /**
     * Get the symbol for a currency code
     */
    static getSymbol(currency: string): string {
        return CURRENCY_SYMBOLS[currency] || currency;
    }

    /**
     * Format a value with its currency symbol
     */
    static format(amount: number, currency: string): string {
        const symbol = this.getSymbol(currency);
        return `${symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    }

    /**
     * Format a value with compact notation (e.g. $1.2M)
     */
    static formatCompact(amount: number, currency: string): string {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: currency,
            notation: "compact",
            maximumFractionDigits: 1
        }).format(amount);
    }

    /**
     * Fetch latest rates from backend API
     */
    static async fetchRates() {
        try {
            const res = await fetch('/api/currency/rates');
            if (res.ok) {
                const rates = await res.json();
                EXCHANGE_RATES = { ...EXCHANGE_RATES, ...rates };
                console.log("Currency rates updated:", EXCHANGE_RATES);
            }
        } catch (error) {
            console.error("Failed to fetch currency rates:", error);
        }
    }

    /**
     * Get all supported currencies
     */
    static getSupportedCurrencies(): string[] {
        return Object.keys(EXCHANGE_RATES);
    }
}
