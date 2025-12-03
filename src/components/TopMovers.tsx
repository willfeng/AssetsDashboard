"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Asset } from "@/types";
import { TrendingUp, TrendingDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface TopMoversProps {
    assets: Asset[];
    isLoading?: boolean;
}

export default function TopMovers({ assets, isLoading }: TopMoversProps) {
    if (isLoading) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="h-12 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Filter only assets with change24h data (Stocks & Crypto)
    const movers = assets
        .filter((a) => (a.type === "STOCK" || a.type === "CRYPTO") && a.change24h !== undefined)
        .sort((a, b) => (b.change24h || 0) - (a.change24h || 0));

    const topGainers = movers.slice(0, 3);
    const topLosers = movers.slice(-3).reverse();

    return (
        <Card className="h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>Top Movers (24h)</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 overflow-y-auto pr-2">
                <div className="space-y-6">
                    {/* Gainers */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Top Gainers</h4>
                        <div className="space-y-3">
                            {topGainers.length > 0 ? (
                                topGainers.map((asset) => (
                                    <div key={asset.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-emerald-500/10 rounded-full">
                                                <TrendingUp className="h-4 w-4 text-emerald-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{asset.name}</p>
                                                <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-emerald-500">+{asset.change24h?.toFixed(2)}%</p>
                                            <p className="text-xs text-muted-foreground">${asset.currentPrice?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No gainers today</p>
                            )}
                        </div>
                    </div>

                    {/* Losers */}
                    <div>
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase mb-3">Top Losers</h4>
                        <div className="space-y-3">
                            {topLosers.length > 0 ? (
                                topLosers.map((asset) => (
                                    <div key={asset.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-rose-500/10 rounded-full">
                                                <TrendingDown className="h-4 w-4 text-rose-500" />
                                            </div>
                                            <div>
                                                <p className="font-medium text-sm">{asset.name}</p>
                                                <p className="text-xs text-muted-foreground">{asset.symbol}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-bold text-rose-500">{asset.change24h?.toFixed(2)}%</p>
                                            <p className="text-xs text-muted-foreground">${asset.currentPrice?.toLocaleString()}</p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <p className="text-sm text-muted-foreground italic">No losers today</p>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
