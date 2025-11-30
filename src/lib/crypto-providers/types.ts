
export interface CryptoWalletProvider {
    name: string;
    chain: 'ETH' | 'BTC';
    getBalance(address: string): Promise<number>; // Returns balance in native unit (ETH/BTC)
}
