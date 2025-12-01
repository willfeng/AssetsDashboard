"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { Loader2, TrendingUp, TrendingDown, DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
    const [data, setData] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [range, setRange] = useState("1M");

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                const res = await fetch(`/api/analytics/pnl?range=${range}`);
                if (res.ok) {
                    const json = await res.json();
                    setData(json);
                }
            } catch (error) {
                console.error("Failed to fetch analytics", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [range]);

    return (
        <div className="p-8 space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <h2 className="text-3xl font-bold tracking-tight">Analytics</h2>
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                    {['1W', '1M', '3M', '1Y', 'ALL'].map((period) => (
                        <button
                            key={period}
                            onClick={() => setRange(period)}
                            className={cn(
                                "px-3 py-1 text-xs font-medium rounded-md transition-all",
                                range === period
                                    ? "bg-background text-foreground shadow-sm"
                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                            )}
                        >
                            {period}
                        </button>
                    ))}
                </div>
            </div>

            {loading && !data ? (
                <div className="flex h-[400px] items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
            ) : (
                <>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">Total P&L</CardTitle>
                                <DollarSign className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", (data?.totalPnL || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                    {(data?.totalPnL || 0) > 0 ? "+" : ""}${(data?.totalPnL || 0).toLocaleString()}
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Net profit/loss over selected period
                                </p>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium">ROI</CardTitle>
                                <Percent className="h-4 w-4 text-muted-foreground" />
                            </CardHeader>
                            <CardContent>
                                <div className={cn("text-2xl font-bold", (data?.totalPnLPct || 0) >= 0 ? "text-green-500" : "text-red-500")}>
                                    {(data?.totalPnLPct || 0) > 0 ? "+" : ""}{(data?.totalPnLPct || 0).toFixed(2)}%
                                </div>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Return on Investment
                                </p>
                            </CardContent>
                        </Card>
                    </div>

                    <Card>
                        <CardHeader>
                            <CardTitle>Daily P&L Trend</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-0">
                            <div className="h-[400px] w-full">
                                {data?.history?.length > 0 ? (
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={data.history}>
                                            <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.2} />
                                            <XAxis
                                                dataKey="date"
                                                tickLine={false}
                                                axisLine={false}
                                                tickMargin={10}
                                                minTickGap={30}
                                                tickFormatter={(value) => {
                                                    const date = new Date(value);
                                                    return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
                                                }}
                                            />
                                            <YAxis
                                                tickLine={false}
                                                axisLine={false}
                                                tickFormatter={(value) => `$${value}`}
                                            />
                                            <Tooltip
                                                cursor={{ fill: 'transparent' }}
                                                content={({ active, payload, label }) => {
                                                    if (active && payload && payload.length) {
                                                        return (
                                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                                                <div className="grid grid-cols-2 gap-2">
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                            Date
                                                                        </span>
                                                                        <span className="font-bold text-muted-foreground">
                                                                            {label}
                                                                        </span>
                                                                    </div>
                                                                    <div className="flex flex-col">
                                                                        <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                                            Value
                                                                        </span>
                                                                        <span className="font-bold">
                                                                            ${payload[0].value?.toLocaleString()}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )
                                                    }
                                                    return null
                                                }}
                                            />
                                            <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                                                {data.history.map((entry: any, index: number) => (
                                                    <Cell key={`cell-${index}`} fill={entry.value >= 0 ? '#22c55e' : '#ef4444'} />
                                                ))}
                                            </Bar>
                                        </BarChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex h-full items-center justify-center text-muted-foreground">
                                        No data available for this period
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}
        </div>
    );
}
