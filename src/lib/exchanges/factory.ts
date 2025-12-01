
import { ExchangeAdapter } from './types';
import { BinanceAdapter } from './binance';
import { OkxAdapter } from './okx';

export class ExchangeFactory {
    private static adapters: Map<string, ExchangeAdapter> = new Map();

    static {
        // Register available adapters
        const binance = new BinanceAdapter();
        this.adapters.set(binance.providerName, binance);

        const okx = new OkxAdapter();
        this.adapters.set(okx.providerName, okx);
    }

    /**
     * Get adapter instance by provider name
     * @param provider Provider name (e.g., 'BINANCE')
     */
    static getAdapter(provider: string): ExchangeAdapter {
        const adapter = this.adapters.get(provider.toUpperCase());
        if (!adapter) {
            throw new Error(`Unsupported exchange provider: ${provider}`);
        }
        return adapter;
    }

    /**
     * Get list of supported providers
     */
    static getSupportedProviders(): string[] {
        return Array.from(this.adapters.keys());
    }
}
