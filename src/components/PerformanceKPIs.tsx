"use client";

import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown, ArrowDownRight, Target, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface MetricsData {
    totalReturn: { value: number; absolute: number };
    maxDrawdown: { value: number; date: Date | null };
    sharpeRatio: number;
    volatility: number;
}

interface PerformanceKPIsProps {
    metrics: MetricsData | null;
    isLoading?: boolean;
}

export default function PerformanceKPIs({ metrics, isLoading }: PerformanceKPIsProps) {
    if (isLoading) {
        return (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="animate-pulse">
                        <CardContent className="p-6">
                            <div className="h-20 bg-muted rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    if (!metrics) {
        return null;
    }

    const getSharpeRating = (ratio: number) => {
        if (ratio > 1.5) return { label: "优秀", color: "text-green-600" };
        if (ratio > 1.0) return { label: "良好", color: "text-blue-600" };
        if (ratio > 0.5) return { label: "一般", color: "text-yellow-600" };
        return { label: "较差", color: "text-red-600" };
    };

    const sharpeRating = getSharpeRating(metrics.sharpeRatio);

    const kpis = [
        {
            title: "总收益率",
            value: `${metrics.totalReturn.value > 0 ? "+" : ""}${metrics.totalReturn.value}%`,
            subtitle: `${metrics.totalReturn.absolute > 0 ? "+" : ""}$${Math.abs(metrics.totalReturn.absolute).toLocaleString()}`,
            icon: metrics.totalReturn.value >= 0 ? TrendingUp : TrendingDown,
            iconColor: metrics.totalReturn.value >= 0 ? "text-green-600" : "text-red-600",
            valueColor: metrics.totalReturn.value >= 0 ? "text-green-600" : "text-red-600",
        },
        {
            title: "最大回撤",
            value: `${metrics.maxDrawdown.value}%`,
            subtitle: metrics.maxDrawdown.date
                ? `发生于 ${new Date(metrics.maxDrawdown.date).toLocaleDateString("zh-CN")}`
                : "暂无数据",
            icon: ArrowDownRight,
            iconColor: "text-orange-600",
            valueColor: "text-orange-600",
        },
        {
            title: "夏普比率",
            value: metrics.sharpeRatio.toFixed(2),
            subtitle: `风险调整收益 · ${sharpeRating.label}`,
            icon: Target,
            iconColor: sharpeRating.color,
            valueColor: sharpeRating.color,
        },
        {
            title: "波动率",
            value: `${metrics.volatility.toFixed(1)}%`,
            subtitle: "年化标准差",
            icon: Activity,
            iconColor: "text-blue-600",
            valueColor: "text-foreground",
        },
    ];

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {kpis.map((kpi, index) => (
                <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div className="space-y-2 flex-1">
                                <p className="text-sm font-medium text-muted-foreground">
                                    {kpi.title}
                                </p>
                                <p className={cn("text-3xl font-bold", kpi.valueColor)}>
                                    {kpi.value}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                    {kpi.subtitle}
                                </p>
                            </div>
                            <kpi.icon className={cn("h-8 w-8", kpi.iconColor)} />
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
