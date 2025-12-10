import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Area, AreaChart, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Landmark, Coins } from "lucide-react";
import { CurrencyService } from "@/lib/currency";

interface TimeSeriesPoint {
    date: string;
    value: number;
    cost: number;
    liquidValue?: number;
    liquidCost?: number;
}

interface PortfolioPerformanceChartProps {
    data: TimeSeriesPoint[] | undefined;
    isLoading: boolean;
}

const CustomTooltip = ({ active, payload, label, mode }: any) => {
    if (active && payload && payload.length) {
        // Determine keys based on mode
        const vKey = mode === 'total' ? 'value' : 'liquidValue';
        const cKey = mode === 'total' ? 'cost' : 'liquidCost';

        const value = payload.find((p: any) => p.dataKey === vKey)?.value || 0;
        const cost = payload.find((p: any) => p.dataKey === cKey)?.value || 0;

        const pnl = value - cost;
        const pnlPercent = cost > 0 ? (pnl / cost) * 100 : 0;

        return (
            <div className="bg-background/95 backdrop-blur-sm border rounded-lg shadow-lg p-3 text-sm">
                <p className="font-medium text-muted-foreground mb-2">{label}</p>
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="text-muted-foreground">Value:</span>
                        <span className="font-bold font-mono">{CurrencyService.format(value, "USD")}</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                        <span className="text-muted-foreground">Cost:</span>
                        <span className="font-bold font-mono">{CurrencyService.format(cost, "USD")}</span>
                    </div>
                    <div className="border-t pt-1 mt-1 flex items-center gap-2">
                        <span className={pnl >= 0 ? "text-emerald-500" : "text-rose-500"}>
                            {pnl >= 0 ? "+" : ""}{CurrencyService.format(pnl, "USD")} ({pnlPercent.toFixed(2)}%)
                        </span>
                    </div>
                </div>
            </div>
        );
    }
    return null;
};

export default function PortfolioPerformanceChart({ data, isLoading }: PortfolioPerformanceChartProps) {
    const [viewMode, setViewMode] = useState<'total' | 'liquid'>('total');

    if (isLoading) {
        return (
            <Card className="col-span-4 transition-all duration-300">
                <CardHeader>
                    <div className="h-6 w-48 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent className="h-[400px] flex items-center justify-center">
                    <div className="h-full w-full bg-muted/20 rounded animate-pulse" />
                </CardContent>
            </Card>
        );
    }

    if (!data || data.length === 0) return null;

    return (
        <Card className="col-span-4 shadow-sm transition-all duration-300">
            <CardHeader className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 gap-4">
                <div>
                    <CardTitle className="text-lg font-medium">Portfolio Performance</CardTitle>
                    <CardDescription>
                        {viewMode === 'total' ? 'Total Net Worth vs Cost' : 'Liquid Assets Performance'}
                    </CardDescription>
                </div>
                <Tabs value={viewMode} onValueChange={(v) => setViewMode(v as any)} className="w-full sm:w-auto">
                    <TabsList className="grid w-full sm:w-fit grid-cols-2 bg-muted/50 p-1 h-9">
                        <TabsTrigger value="total" className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Landmark className="w-3.5 h-3.5 mr-2" />
                            Net Worth
                        </TabsTrigger>
                        <TabsTrigger value="liquid" className="text-xs px-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                            <Coins className="w-3.5 h-3.5 mr-2" />
                            Liquid Portfolio
                        </TabsTrigger>
                    </TabsList>
                </Tabs>
            </CardHeader>
            <CardContent>
                <div className="h-[400px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                            <defs>
                                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                                </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                            <XAxis
                                dataKey="date"
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(str) => {
                                    const date = new Date(str);
                                    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                                }}
                                minTickGap={50}
                                fontSize={12}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <YAxis
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(val) => `$${(val / 1000).toFixed(0)}k`}
                                fontSize={12}
                                stroke="hsl(var(--muted-foreground))"
                            />
                            <Tooltip content={<CustomTooltip mode={viewMode} />} />

                            {/* Cost Basis Line (Dashed) */}
                            <Area
                                type="monotone"
                                dataKey={viewMode === 'total' ? 'cost' : 'liquidCost'}
                                stroke="#94a3b8"
                                strokeWidth={2}
                                strokeDasharray="5 5"
                                fill="none"
                                activeDot={false}
                                animationDuration={500}
                            />

                            {/* Net Worth Area (Solid + Gradient) */}
                            <Area
                                type="monotone"
                                dataKey={viewMode === 'total' ? 'value' : 'liquidValue'}
                                stroke="#10b981"
                                strokeWidth={2}
                                fillOpacity={1}
                                fill="url(#colorValue)"
                                animationDuration={500}
                            />
                        </AreaChart>
                    </ResponsiveContainer>
                </div>
            </CardContent>
        </Card>
    );
}
