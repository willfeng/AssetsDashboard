import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Landmark, TrendingUp, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Asset } from "@/types";
import { EmptyState } from "@/components/EmptyState";

import { CurrencyService } from "@/lib/currency";

interface AssetListProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

export function AssetList({ assets, onEdit, onDelete }: AssetListProps) {
    const AssetActions = ({ asset }: { asset: Asset }) => (
        <div className="flex items-center gap-2 ml-4 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(asset.id!)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
    );

    const bankAssets = assets.filter((a) => a.type === "BANK");
    const stockAssets = assets.filter((a) => a.type === "STOCK");
    const cryptoAssets = assets.filter((a) => a.type === "CRYPTO");

    return (
        <div className="grid gap-4 md:grid-cols-3" id="assets">
            {/* Bank Accounts */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Bank Accounts</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {bankAssets.length > 0 ? (
                        <div className="space-y-4">
                            {bankAssets.map((asset) => (
                                <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    {/* ... existing item render ... */}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.currency}</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="text-right">
                                            <div className="font-medium">
                                                {CurrencyService.format(asset.balance || 0, asset.currency || "USD")}
                                            </div>
                                            {asset.currency && asset.currency !== "USD" && (
                                                <div className="text-xs text-muted-foreground">
                                                    ≈ {CurrencyService.format(CurrencyService.convertToUSD(asset.balance || 0, asset.currency), "USD")}
                                                </div>
                                            )}
                                        </div>
                                        <AssetActions asset={asset} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Landmark}
                            title="No Bank Accounts"
                            description="Add your savings or checking accounts."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Stocks */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Stocks</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {stockAssets.length > 0 ? (
                        <div className="space-y-4">
                            {stockAssets.map((asset) => (
                                <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    {/* ... existing item render ... */}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{asset.symbol}</p>
                                        <p className="text-xs text-muted-foreground">{asset.quantity} shares</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="text-right">
                                            <div className="font-medium">${asset.totalValue?.toLocaleString()}</div>
                                            <p className={cn("text-xs", (asset.change24h || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                                {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                            </p>
                                        </div>
                                        <AssetActions asset={asset} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={TrendingUp}
                            title="No Stocks"
                            description="Track your stock portfolio performance."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Crypto */}
            <Card className="flex flex-col">
                <CardHeader>
                    <CardTitle>Crypto</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {cryptoAssets.length > 0 ? (
                        <div className="space-y-4">
                            {cryptoAssets.map((asset) => (
                                <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                    {/* ... existing item render ... */}
                                    <div className="space-y-1">
                                        <p className="text-sm font-medium leading-none">{asset.name}</p>
                                        <p className="text-xs text-muted-foreground">{asset.quantity} coins</p>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="text-right">
                                            <div className="font-medium">${asset.totalValue?.toLocaleString()}</div>
                                            <p className={cn("text-xs", (asset.change24h || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                                {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                            </p>
                                        </div>
                                        <AssetActions asset={asset} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <EmptyState
                            icon={Bitcoin}
                            title="No Crypto"
                            description="Connect wallets or exchanges."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
