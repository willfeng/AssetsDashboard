
import { ExchangeAdapter } from './types';
import { BinanceAdapter } from './binance';
import { OkxAdapter } from './okx';
import { SolanaAdapter } from './solana';
import { TronAdapter } from './tron';
import { KrakenAdapter } from './kraken';

export class ExchangeFactory {
    private static adapters: Map<string, ExchangeAdapter> = new Map();

    static {
        // Register available adapters
        const binance = new BinanceAdapter();
        this.adapters.set(binance.providerName, binance);

        const okx = new OkxAdapter();
        this.adapters.set(okx.providerName, okx);

        const solana = new SolanaAdapter();
        this.adapters.set(solana.providerName, solana);

        const tron = new TronAdapter();
        this.adapters.set(tron.providerName, tron);

        const kraken = new KrakenAdapter();
        this.adapters.set(kraken.providerName, kraken);
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
