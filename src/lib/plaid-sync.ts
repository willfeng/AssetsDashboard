
import { prisma as prismadb } from "@/lib/prisma";
import { plaidClient } from "@/lib/plaid";
import { decrypt } from "@/lib/encryption";
import { AccountsGetRequest, CountryCode } from "plaid";

export const PlaidSyncService = {
    /**
     * Syncs a single integration by ID
     */
    syncIntegration: async (integrationId: string, userId: string) => {
        const integration = await prismadb.integration.findUnique({
            where: { id: integrationId, userId },
        });

        if (!integration || !integration.apiKey) {
            throw new Error("Integration not found or missing access token");
        }

        // 1. Decrypt Access Token (Stored in apiKey for Plaid)
        const accessToken = decrypt(integration.apiKey);

        // 2. Fetch Balances from Plaid
        const request: AccountsGetRequest = {
            access_token: accessToken,
        };

        try {
            const response = await plaidClient.accountsBalanceGet(request);
            const accounts = response.data.accounts;

            // 3. Update or Create Assets for each account
            for (const account of accounts) {
                // Determine asset type mapping
                let assetType = "BANK";
                if (account.type === "investment") assetType = "STOCK";

                // We store the Plaid account_id in the 'symbol' field for uniqueness checks
                // For Bank assets, symbol is usually empty, but for Plaid it's a good place to put the external ID.

                const existingAsset = await prismadb.asset.findFirst({
                    where: {
                        userId,
                        integrationId,
                        symbol: account.account_id,
                    },
                });

                const balance = account.balances.current || account.balances.available || 0;
                const isoCurrency = account.balances.iso_currency_code || "USD";

                if (existingAsset) {
                    await prismadb.asset.update({
                        where: { id: existingAsset.id },
                        data: {
                            balance: balance, // Use balance for BANK type
                            quantity: assetType === "STOCK" ? balance : undefined, // If stock, maybe quantity? But mostly we just get balance value
                            // For Plaid "Balance Only" integration, we might not get quantity/price breakdown.
                            // We usually just get the total value. 
                            // So setting balance is safer.

                            name: account.name,
                            currency: isoCurrency,
                            updatedAt: new Date(),
                        },
                    });
                } else {
                    await prismadb.asset.create({
                        data: {
                            userId,
                            integrationId,
                            name: account.name,
                            symbol: account.account_id, // Store Plaid Account ID here
                            type: assetType,
                            balance: balance, // Use balance
                            currency: isoCurrency,
                            quantity: 0, // Default to 0 if not used
                            averageBuyPrice: 0,
                            apy: 0
                        },
                    });
                }
            }

            // 4. Update Integration Last Sync
            await prismadb.integration.update({
                where: { id: integrationId },
                data: { lastSync: new Date() },
            });

            return accounts.length;
        } catch (error: any) {
            console.error("Plaid Sync Error", error.response?.data || error.message);
            throw new Error("Failed to sync with bank");
        }
    },
};
