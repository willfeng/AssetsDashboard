
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decrypt } from '@/lib/encryption';
import { recordDailyHistoryWithTotal } from '@/lib/history';
import * as ccxt from 'ccxt';
import { HttpsProxyAgent } from 'https-proxy-agent';

import { EthereumProvider } from '@/lib/crypto-providers/ethereum';
import { BitcoinProvider } from '@/lib/crypto-providers/bitcoin';

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { integrationId } = body;

        if (!integrationId) {
            return NextResponse.json({ error: 'Integration ID is required' }, { status: 400 });
        }

        const integration = await prisma.integration.findUnique({
            where: { id: integrationId }
        });

        if (!integration || integration.userId !== user.id || !integration.isActive) {
            return NextResponse.json({ error: 'Integration not found or inactive' }, { status: 404 });
        }

        const providerType = integration.provider.toUpperCase();
        const apiKey = decrypt(integration.apiKey);
        // Secret is optional for wallets
        const secret = integration.apiSecret ? decrypt(integration.apiSecret) : '';

        const aggregatedBalances: Record<string, number> = {};

        // --- Dispatch Logic ---
        if (providerType === 'BINANCE') {
            // Proxy removed as per user request
            // const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY || 'http://127.0.0.1:7890';
            // const agent = new HttpsProxyAgent(proxyUrl);

            const exchange = new ccxt.binance({
                apiKey: apiKey,
                secret: secret,
                enableRateLimit: true,
                // agent: agent, // Removed
                options: {
                    'adjustForTimeDifference': true,
                    'recvWindow': 60000, // Allow 60s discrepancy
                }
            });

            console.log(`[Sync] Fetching balances for ${user.id} from BINANCE...`);
            const balance = await exchange.fetchBalance();
            const rawBalances = (balance.total as unknown) as Record<string, number>;

            for (const [rawSymbol, quantity] of Object.entries(rawBalances)) {
                if (quantity > 0) {
                    let symbol = rawSymbol;
                    if (symbol.startsWith('LD') && symbol.length > 3) {
                        symbol = symbol.substring(2);
                    }
                    aggregatedBalances[symbol] = (aggregatedBalances[symbol] || 0) + quantity;
                }
            }

        } else if (providerType === 'WALLET_ETH') {
            console.log(`[Sync] Fetching ETH balance for ${apiKey}...`);
            const balance = await EthereumProvider.getBalance(apiKey); // apiKey stores the address
            if (balance > 0) {
                aggregatedBalances['ETH'] = balance;
            }

        } else if (providerType === 'WALLET_BTC') {
            console.log(`[Sync] Fetching BTC balance for ${apiKey}...`);
            const balance = await BitcoinProvider.getBalance(apiKey); // apiKey stores the address
            if (balance > 0) {
                aggregatedBalances['BTC'] = balance;
            }

        } else {
            return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
        }

        // --- Upsert Assets ---
        let syncedCount = 0;

        for (const [symbol, quantity] of Object.entries(aggregatedBalances)) {
            // Naming convention: "Symbol (Name)" or "Symbol (Provider)"
            // e.g. "ETH (My MetaMask)" or "BTC (Binance)"
            const sourceLabel = integration.name || providerType;
            const assetName = `${symbol} (${sourceLabel})`;

            const existingAsset = await prisma.asset.findFirst({
                where: {
                    userId: user.id,
                    type: 'CRYPTO',
                    symbol: symbol.toUpperCase(),
                    name: assetName,
                }
            });

            if (existingAsset) {
                await prisma.asset.update({
                    where: { id: existingAsset.id },
                    data: { quantity: quantity }
                });
            } else {
                await prisma.asset.create({
                    data: {
                        userId: user.id,
                        type: 'CRYPTO',
                        name: assetName,
                        symbol: symbol.toUpperCase(),
                        quantity: quantity,
                        currency: 'USD',
                    }
                });
            }
            syncedCount++;
        }

        // Update last sync time
        await prisma.integration.update({
            where: { id: integration.id },
            data: { lastSync: new Date() }
        });

        // Record history
        await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json({ success: true, syncedCount });

    } catch (error: any) {
        console.error("Error syncing integration:", error);
        return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
    }
}
