"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis, Cell, CartesianGrid } from "recharts";
import { CurrencyService } from "@/lib/currency";

interface MonthlyPnLProps {
    data: { month: string; pnl: number }[] | null;
    isLoading?: boolean;
}

export default function MonthlyPnLChart({ data, isLoading }: MonthlyPnLProps) {
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

    if (!data || data.length === 0) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <CardTitle>Monthly Profit & Loss</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        );
    }

    // Format month labels (e.g., "2024-01" -> "Jan")
    const formattedData = data.map(item => {
        const [year, month] = item.month.split('-');
        const date = new Date(parseInt(year), parseInt(month) - 1);
        return {
            ...item,
            label: date.toLocaleDateString('en-US', { month: 'short' })
        };
    });

    return (
        <Card className="h-[400px]">
            <CardHeader>
                <CardTitle>Monthly Profit & Loss</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={formattedData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="label"
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                width={60}
                                tickFormatter={(value) => new Intl.NumberFormat('en-US', {
                                    style: 'currency',
                                    currency: 'USD',
                                    notation: "compact",
                                    maximumFractionDigits: 1
                                }).format(value)}
                            />
                            <Tooltip
                                cursor={{ fill: 'transparent' }}
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: "8px",
                                    border: "none",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                }}
                                formatter={(value: number) => [CurrencyService.format(value, "USD"), 'P&L']}
                            />
                            <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                                {formattedData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? "#10b981" : "#f43f5e"} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
