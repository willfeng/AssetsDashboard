"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { CurrencyService } from "@/lib/currency";

interface MetricsData {
    totalReturn: { value: number; absolute: number };
    maxDrawdown: { value: number; date: Date | null };
    sharpeRatio: number;
    volatility: number;
    sparkline: { value: number }[];
    bestAsset?: { symbol: string | null; name: string; percent: number; value: number } | null;
    worstAsset?: { symbol: string | null; name: string; percent: number; value: number } | null;
}

interface KeyMetricsProps {
    metrics: MetricsData | null;
    isLoading?: boolean;
}

export default function KeyMetrics({ metrics, isLoading }: KeyMetricsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="overflow-hidden">
                        <CardContent className="p-6">
                            <div className="h-4 w-24 bg-muted rounded mb-2 animate-pulse" />
                            <div className="h-8 w-32 bg-muted rounded animate-pulse" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!metrics) return null;

    const pnlValue = metrics.totalReturn.absolute;
    const roiValue = metrics.totalReturn.value;
    const isPositive = pnlValue >= 0;
    const drawdown = metrics.maxDrawdown.value;



    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {/* 1. Portfolio Performance (Merged PnL + ROI) */}
            <Card className="relative overflow-hidden border shadow-sm bg-background/40 backdrop-blur-xl hover:bg-background/60 transition-all duration-300 hover:-translate-y-1">
                <div className={cn("absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-50", isPositive ? "from-emerald-500/50 to-emerald-500/0" : "from-rose-500/50 to-rose-500/0")} />
                <CardContent className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Portfolio Performance</p>
                        <div className={cn("px-2 py-0.5 rounded-full text-[10px] font-bold backdrop-blur-sm flex items-center gap-1 border",
                            isPositive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600" : "bg-rose-500/10 border-rose-500/20 text-rose-600")}>
                            {roiValue > 0 ? "+" : ""}{roiValue}%
                            <Activity className="h-3 w-3" />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <h3 className={cn("text-2xl font-bold tracking-tight", isPositive ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400")}>
                            {isPositive ? "+" : ""}{CurrencyService.format(pnlValue, "USD")}
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">Total PnL & Return</p>
                    </div>
                </CardContent>
            </Card>

            {/* 2. Max Drawdown (Risk Metric) */}
            <Card className="relative overflow-hidden border shadow-sm bg-background/40 backdrop-blur-xl hover:bg-background/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-rose-500/50 to-transparent opacity-50" />
                <CardContent className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Max Drawdown</p>
                        <div className="p-1.5 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-600 backdrop-blur-sm">
                            <TrendingDown className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    <div className="space-y-0.5">
                        <h3 className="text-2xl font-bold tracking-tight text-rose-600 dark:text-rose-400">
                            -{drawdown}%
                        </h3>
                        <p className="text-xs text-muted-foreground font-medium">Peak-to-Trough Decline</p>
                    </div>
                </CardContent>
            </Card>

            {/* 3. Best Performer */}
            <Card className="relative overflow-hidden border shadow-sm bg-background/40 backdrop-blur-xl hover:bg-background/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-indigo-500/50 to-transparent opacity-50" />
                <CardContent className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Best Performer</p>
                        <div className="p-1.5 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-600 backdrop-blur-sm">
                            <Target className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    {metrics.bestAsset ? (
                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold tracking-tight text-foreground truncate max-w-[120px]" title={metrics.bestAsset.name}>
                                    {metrics.bestAsset.symbol || metrics.bestAsset.name}
                                </h3>
                                <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
                                    {metrics.bestAsset.percent > 0 ? "+" : ""}{metrics.bestAsset.percent.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate">{metrics.bestAsset.name}</p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center text-muted-foreground text-sm italic">No data</div>
                    )}
                </CardContent>
            </Card>

            {/* 4. Worst Performer */}
            <Card className="relative overflow-hidden border shadow-sm bg-background/40 backdrop-blur-xl hover:bg-background/60 transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-orange-500/50 to-transparent opacity-50" />
                <CardContent className="p-4 relative z-10">
                    <div className="flex justify-between items-start mb-2">
                        <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground/80">Worst Performer</p>
                        <div className="p-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-600 backdrop-blur-sm">
                            <Zap className="h-3.5 w-3.5" />
                        </div>
                    </div>
                    {metrics.worstAsset ? (
                        <div className="space-y-0.5">
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold tracking-tight text-foreground truncate max-w-[120px]" title={metrics.worstAsset.name}>
                                    {metrics.worstAsset.symbol || metrics.worstAsset.name}
                                </h3>
                                <span className="text-lg font-bold text-rose-600 dark:text-rose-400">
                                    {metrics.worstAsset.percent.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-xs text-muted-foreground font-medium truncate">{metrics.worstAsset.name}</p>
                        </div>
                    ) : (
                        <div className="h-full flex items-center text-muted-foreground text-sm italic">No data</div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
