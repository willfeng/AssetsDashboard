
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Asset } from "@/types";

interface AssetListProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
}

export function AssetList({ assets, onEdit, onDelete }: AssetListProps) {
    const AssetActions = ({ asset }: { asset: Asset }) => (
        <div className="flex items-center gap-2 ml-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(asset)}>
                <Pencil className="h-4 w-4 text-muted-foreground hover:text-primary" />
            </Button>
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onDelete(asset.id!)}>
                <Trash2 className="h-4 w-4 text-muted-foreground hover:text-destructive" />
            </Button>
        </div>
    );

    return (
        <div className="grid gap-4 md:grid-cols-3" id="assets">
            {/* Bank Accounts */}
            <Card>
                <CardHeader>
                    <CardTitle>Bank Accounts</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assets.filter((a) => a.type === "BANK").map((asset) => (
                            <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {asset.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.currency}
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="font-medium">
                                        {asset.currency === "USD" ? "$" : "HK$"}
                                        {asset.balance?.toLocaleString()}
                                    </div>
                                    <AssetActions asset={asset} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Stocks */}
            <Card>
                <CardHeader>
                    <CardTitle>Stocks</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assets.filter((a) => a.type === "STOCK").map((asset) => (
                            <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {asset.symbol}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.quantity} shares
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="text-right">
                                        <div className="font-medium">
                                            ${asset.totalValue?.toLocaleString()}
                                        </div>
                                        <p className={cn("text-xs", (asset.change24h || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                            {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                        </p>
                                    </div>
                                    <AssetActions asset={asset} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            {/* Crypto */}
            <Card>
                <CardHeader>
                    <CardTitle>Crypto</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {assets.filter((a) => a.type === "CRYPTO").map((asset) => (
                            <div key={asset.id} className="group flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                                <div className="space-y-1">
                                    <p className="text-sm font-medium leading-none">
                                        {asset.name}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {asset.quantity} coins
                                    </p>
                                </div>
                                <div className="flex items-center">
                                    <div className="text-right">
                                        <div className="font-medium">
                                            ${asset.totalValue?.toLocaleString()}
                                        </div>
                                        <p className={cn("text-xs", (asset.change24h || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                            {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                        </p>
                                    </div>
                                    <AssetActions asset={asset} />
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
