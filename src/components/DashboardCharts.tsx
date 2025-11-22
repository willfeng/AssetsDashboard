"use client";

import { Area, AreaChart, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { HistoricalDataPoint } from "@/types";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from "@/components/ui/chart";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

interface DashboardChartsProps {
    pieData: { name: string; value: number }[];
    historyData: HistoricalDataPoint[];
}

const chartConfig = {
    value: {
        label: "Value",
        color: "hsl(var(--chart-1))",
    },
} satisfies ChartConfig;

const pieConfig = {
    value: {
        label: "Value",
    },
} satisfies ChartConfig;

export default function DashboardCharts({ pieData, historyData }: DashboardChartsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <div className="h-[250px]">
                        {pieData.length > 0 ? (
                            <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px]">
                                <PieChart>
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent hideLabel />}
                                    />
                                    <Pie
                                        data={pieData}
                                        dataKey="value"
                                        nameKey="name"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                    >
                                        {pieData.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={COLORS[index % COLORS.length]}
                                            />
                                        ))}
                                    </Pie>
                                </PieChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading allocation...
                            </div>
                        )}
                    </div>
                    <div className="mt-4 space-y-3">
                        {pieData.map((entry, index) => (
                            <div key={entry.name} className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <div
                                        className="h-3 w-3 rounded-full"
                                        style={{ backgroundColor: COLORS[index % COLORS.length] }}
                                    />
                                    <span className="text-muted-foreground">{entry.name}</span>
                                </div>
                                <div className="font-medium">
                                    ${entry.value.toLocaleString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Asset Trend</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pl-2">
                    <div className="h-[350px] w-full">
                        {historyData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <AreaChart
                                    data={historyData}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <defs>
                                        <linearGradient id="fillValue" x1="0" y1="0" x2="0" y2="1">
                                            <stop offset="5%" stopColor="var(--color-value)" stopOpacity={0.8} />
                                            <stop offset="95%" stopColor="var(--color-value)" stopOpacity={0.1} />
                                        </linearGradient>
                                    </defs>
                                    <XAxis
                                        dataKey="date"
                                        tickLine={false}
                                        axisLine={false}
                                        tickMargin={8}
                                        minTickGap={32}
                                    />
                                    <YAxis
                                        tickLine={false}
                                        axisLine={false}
                                        tickFormatter={(value) => `$${value}`}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="dot" />}
                                    />
                                    <Area
                                        dataKey="value"
                                        type="natural"
                                        fill="url(#fillValue)"
                                        fillOpacity={0.4}
                                        stroke="var(--color-value)"
                                    />
                                </AreaChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading trend data...
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
