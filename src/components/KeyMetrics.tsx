"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, Activity, Target, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface MetricsData {
    totalReturn: { value: number; absolute: number };
    maxDrawdown: { value: number; date: Date | null };
    sharpeRatio: number;
    volatility: number;
}

interface KeyMetricsProps {
    metrics: MetricsData | null;
    isLoading?: boolean;
}

// Mock sparkline data for visual effect (in a real app, this would come from history)
const sparklineData = [
    { value: 10 }, { value: 15 }, { value: 12 }, { value: 20 }, { value: 18 }, { value: 25 }, { value: 22 }
];

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

    const items = [
        {
            title: "Total Return",
            value: `${metrics.totalReturn.value > 0 ? "+" : ""}${metrics.totalReturn.value}%`,
            subValue: `$${metrics.totalReturn.absolute.toLocaleString()}`,
            icon: metrics.totalReturn.value >= 0 ? TrendingUp : TrendingDown,
            color: metrics.totalReturn.value >= 0 ? "text-emerald-500" : "text-rose-500",
            chartColor: metrics.totalReturn.value >= 0 ? "#10b981" : "#f43f5e",
        },
        {
            title: "Max Drawdown",
            value: `${metrics.maxDrawdown.value}%`,
            subValue: metrics.maxDrawdown.date ? new Date(metrics.maxDrawdown.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : "No data",
            icon: TrendingDown,
            color: "text-rose-500",
            chartColor: "#f43f5e",
        },
        {
            title: "Sharpe Ratio",
            value: metrics.sharpeRatio.toFixed(2),
            subValue: metrics.sharpeRatio > 1 ? "Excellent" : metrics.sharpeRatio > 0 ? "Good" : "Poor",
            icon: Target,
            color: "text-blue-500",
            chartColor: "#3b82f6",
        },
        {
            title: "Volatility",
            value: `${metrics.volatility}%`,
            subValue: "Annualized",
            icon: Activity,
            color: "text-violet-500",
            chartColor: "#8b5cf6",
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {items.map((item, index) => (
                <Card key={index} className="overflow-hidden relative">
                    <CardContent className="p-6">
                        <div className="flex justify-between items-start z-10 relative">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">{item.title}</p>
                                <h3 className={cn("text-2xl font-bold mt-2", item.color)}>{item.value}</h3>
                                <p className="text-xs text-muted-foreground mt-1">{item.subValue}</p>
                            </div>
                            <div className={cn("p-2 rounded-full bg-opacity-10", item.color.replace("text-", "bg-"))}>
                                <item.icon className={cn("h-4 w-4", item.color)} />
                            </div>
                        </div>

                        {/* Sparkline Background */}
                        <div className="absolute bottom-0 left-0 right-0 h-12 opacity-10">
                            <ResponsiveContainer width="100%" height="100%">
                                <AreaChart data={sparklineData}>
                                    <Area
                                        type="monotone"
                                        dataKey="value"
                                        stroke={item.chartColor}
                                        fill={item.chartColor}
                                        strokeWidth={2}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
