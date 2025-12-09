"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { AlertTriangle } from "lucide-react";
import { Asset } from "@/types";
import { CurrencyService } from "@/lib/currency";

interface ConcentrationRiskProps {
    assets: Asset[];
    isLoading?: boolean;
}

const COLORS = ["#2563eb", "#10b981", "#8b5cf6", "#f59e0b", "#ef4444", "#64748b"];

export default function ConcentrationRisk({ assets, isLoading }: ConcentrationRiskProps) {
    if (isLoading) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] bg-muted rounded animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    // Calculate allocation by asset
    const totalValue = assets.reduce((sum, asset) => {
        const val = asset.type === 'BANK'
            ? CurrencyService.convertToUSD(asset.balance, asset.currency || 'USD')
            : (asset.totalValue || 0);
        return sum + val;
    }, 0);

    const data = assets
        .map(asset => {
            const value = asset.type === 'BANK'
                ? CurrencyService.convertToUSD(asset.balance, asset.currency || 'USD')
                : (asset.totalValue || 0);
            return {
                name: asset.name,
                value,
                percent: totalValue > 0 ? (value / totalValue) * 100 : 0
            };
        })
        .sort((a, b) => b.value - a.value)
        .slice(0, 6); // Top 6 assets

    // Check for high concentration (>30%)
    const highConcentration = data.find(item => item.percent > 30);

    return (
        <Card className="h-[400px] flex flex-col">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle>Asset Allocation Risk</CardTitle>
                {highConcentration && (
                    <div className="flex items-center gap-1 text-amber-500 bg-amber-500/10 px-2 py-1 rounded text-xs font-medium">
                        <AlertTriangle className="h-3 w-3" />
                        High Concentration
                    </div>
                )}
            </CardHeader>
            <CardContent className="flex-1 min-h-0">
                <div className="h-full w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {data.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                formatter={(value: number) => [CurrencyService.format(value, "USD"), 'Value']}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: "8px",
                                    border: "none",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                }}
                            />
                            <Legend
                                layout="vertical"
                                verticalAlign="middle"
                                align="right"
                                wrapperStyle={{ fontSize: '12px' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
