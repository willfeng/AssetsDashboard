
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decrypt } from '@/lib/encryption';
// REMOVED: import { recordDailyHistoryWithTotal } from '@/lib/history';

import { EthereumProvider } from '@/lib/crypto-providers/ethereum';
import { BitcoinProvider } from '@/lib/crypto-providers/bitcoin';
import { ExchangeFactory } from '@/lib/exchanges/factory';
import { PlaidSyncService } from '@/lib/plaid-sync';

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

        // --- PLAID SPECIAL CASE ---
        if (providerType === 'PLAID') {
            const syncedCount = await PlaidSyncService.syncIntegration(integrationId, user.id);
            // REMOVED: await recordDailyHistoryWithTotal(user.id);
            return NextResponse.json({ success: true, syncedCount });
        }

        const apiKey = decrypt(integration.apiKey);
        // Secret is optional for wallets
        const secret = integration.apiSecret ? decrypt(integration.apiSecret) : '';

        // Extra params (e.g. passphrase for OKX)
        let extraParams: Record<string, any> | undefined = undefined;
        if (integration.extraParams) {
            try {
                const decryptedExtra = decrypt(integration.extraParams);
                extraParams = JSON.parse(decryptedExtra);
            } catch (e) {
                console.warn(`Failed to parse extraParams for integration ${integration.id}`);
            }
        }

        const aggregatedBalances: Record<string, number> = {};

        // --- Dispatch Logic ---
        if (providerType === 'WALLET_ETH') {
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
            // Try Exchange Factory for other providers (BINANCE, OKX, etc.)
            try {
                const adapter = ExchangeFactory.getAdapter(providerType);
                console.log(`[Sync] Fetching balances for ${user.id} from ${providerType}...`);

                const balances = await adapter.fetchBalances(apiKey, secret, extraParams);
                Object.assign(aggregatedBalances, balances);

            } catch (error: any) {
                if (error.message.includes('Unsupported exchange provider')) {
                    return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
                }
                throw error;
            }
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
                    data: {
                        quantity: quantity,
                        integrationId: integration.id
                    }
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
                        integrationId: integration.id
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
        // REMOVED: await recordDailyHistoryWithTotal(user.id);

        return NextResponse.json({ success: true, syncedCount });

    } catch (error: any) {
        console.error("Error syncing integration:", error);
        return NextResponse.json({ error: error.message || 'Sync failed' }, { status: 500 });
    }
}
