import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { decrypt } from '@/lib/encryption';
import { recordDailyHistoryWithTotal } from '@/lib/history';
import * as ccxt from 'ccxt';

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { provider } = body;

        const integration = await prisma.integration.findUnique({
            where: {
                userId_provider: {
                    userId: user.id,
                    provider: provider.toUpperCase(),
                }
            }
        });

        if (!integration || !integration.isActive) {
            return NextResponse.json({ error: 'Integration not found or inactive' }, { status: 404 });
        }

        // Decrypt keys
        const apiKey = decrypt(integration.apiKey);
        const secret = decrypt(integration.apiSecret);

        // Initialize Exchange
        let exchange;
        if (provider.toUpperCase() === 'BINANCE') {
            exchange = new ccxt.binance({
                apiKey: apiKey,
                secret: secret,
                enableRateLimit: true,
            });
        } else {
            return NextResponse.json({ error: 'Unsupported provider' }, { status: 400 });
        }

        console.log(`[Sync] Fetching balances for ${user.id} from ${provider}...`);

        // Fetch Balance
        const balance = await exchange.fetchBalance();
        const items = balance.items || []; // ccxt unifies this usually, but 'total' is safer

        // Process non-zero balances
        // ccxt structure: balance['total'] = { 'BTC': 0.1, 'USDT': 100 ... }
        const rawBalances = (balance.total as unknown) as Record<string, number>;
        const aggregatedBalances: Record<string, number> = {};

        for (const [rawSymbol, quantity] of Object.entries(rawBalances)) {
            if (quantity > 0) {
                let symbol = rawSymbol;
                // Handle Binance Earn "LD" prefix (e.g. LDBTC -> BTC)
                // We check length > 3 to avoid stripping valid symbols like LDO (Lido DAO)
                // LDO starts with LD but is 3 chars. LDBTC is 5 chars.
                if (symbol.startsWith('LD') && symbol.length > 3) {
                    symbol = symbol.substring(2);
                }

                // Aggregate quantity
                if (aggregatedBalances[symbol]) {
                    aggregatedBalances[symbol] += quantity;
                } else {
                    aggregatedBalances[symbol] = quantity;
                }
            }
        }

        let syncedCount = 0;

        for (const [symbol, quantity] of Object.entries(aggregatedBalances)) {
            // Upsert Asset
            // To support multiple exchanges (e.g. Binance + Coinbase) and prevent overwriting manual assets,
            // we scope the asset by naming it "Symbol (Provider)", e.g. "BTC (Binance)".

            const assetName = `${symbol} (${provider})`; // e.g. "BTC (Binance)"

            const existingAsset = await prisma.asset.findFirst({
                where: {
                    userId: user.id,
                    type: 'CRYPTO',
                    symbol: symbol.toUpperCase(),
                    name: assetName, // Strict match to ensure we only update this provider's asset
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
                        currency: 'USD', // Default
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
