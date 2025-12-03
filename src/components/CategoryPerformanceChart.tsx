"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Legend } from "recharts";

interface CategoryPerformanceProps {
    data: {
        dates: string[];
        categories: {
            Stocks: number[];
            Crypto: number[];
            Cash: number[];
        };
    } | null;
    isLoading?: boolean;
}

export default function CategoryPerformanceChart({ data, isLoading }: CategoryPerformanceProps) {
    if (isLoading) {
        return (
            <Card className="col-span-2 h-[400px]">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="h-[300px] bg-muted rounded animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.dates.length === 0) {
        return (
            <Card className="col-span-2 h-[400px]">
                <CardHeader>
                    <CardTitle>Cumulative Return by Category</CardTitle>
                </CardHeader>
                <CardContent className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                </CardContent>
            </Card>
        );
    }

    // Transform data for Recharts
    const chartData = data.dates.map((date, index) => ({
        date: new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        Stocks: parseFloat(data.categories.Stocks[index]?.toFixed(2) || "0"),
        Crypto: parseFloat(data.categories.Crypto[index]?.toFixed(2) || "0"),
        Cash: parseFloat(data.categories.Cash[index]?.toFixed(2) || "0"),
    }));

    return (
        <Card className="col-span-2 h-[400px]">
            <CardHeader>
                <CardTitle>Cumulative Return by Category</CardTitle>
                <p className="text-sm text-muted-foreground">Normalized performance (Base 100)</p>
            </CardHeader>
            <CardContent>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                            <XAxis
                                dataKey="date"
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                minTickGap={30}
                            />
                            <YAxis
                                domain={['auto', 'auto']}
                                tick={{ fontSize: 12, fill: "#6B7280" }}
                                axisLine={false}
                                tickLine={false}
                                width={40}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "rgba(255, 255, 255, 0.95)",
                                    borderRadius: "8px",
                                    border: "none",
                                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
                                }}
                                labelStyle={{ color: "#374151", fontWeight: 600, marginBottom: "4px" }}
                            />
                            <Legend verticalAlign="top" height={36} iconType="circle" />
                            <Line
                                type="monotone"
                                dataKey="Stocks"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Crypto"
                                stroke="#f59e0b"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="Cash"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={false}
                                activeDot={{ r: 6, strokeWidth: 0 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
