"use client";

import { Area, AreaChart, Line, LineChart, XAxis, YAxis, PieChart, Pie, Cell, CartesianGrid } from "recharts";
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
    isLoading: boolean;
}

const chartConfig = {
    value: {
        label: "Value",
        color: "#2563eb",
    },
} satisfies ChartConfig;

const pieConfig = {
    value: {
        label: "Value",
    },
} satisfies ChartConfig;

export default function DashboardCharts({ pieData, historyData, isLoading }: DashboardChartsProps) {
    return (
        <div className="grid gap-4 md:grid-cols-3">
            <Card className="col-span-1 flex flex-col">
                <CardHeader>
                    <CardTitle>Asset Allocation</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <div className="h-[250px]">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading allocation...
                            </div>
                        ) : pieData.length > 0 ? (
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
                                No allocation data
                            </div>
                        )}
                    </div>
                    {!isLoading && pieData.length > 0 && (
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
                    )}
                </CardContent>
            </Card>

            <Card className="col-span-2 flex flex-col">
                <CardHeader>
                    <CardTitle>Asset Trend</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pl-2">
                    <div className="h-[350px] w-full">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading trend data...
                            </div>
                        ) : historyData.length > 0 ? (
                            <ChartContainer config={chartConfig} className="h-full w-full">
                                <LineChart
                                    data={historyData}
                                    margin={{
                                        left: 12,
                                        right: 12,
                                    }}
                                >
                                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                                    <XAxis
                                        dataKey="date"
                                        tickLine={true}
                                        axisLine={true}
                                        tickMargin={16}
                                        minTickGap={32}
                                    />
                                    <YAxis
                                        width={80}
                                        tickLine={true}
                                        axisLine={true}
                                        tickFormatter={(value) => `$${value}`}
                                        tick={{ textAnchor: 'start', dx: -75 }}
                                    />
                                    <ChartTooltip
                                        cursor={false}
                                        content={<ChartTooltipContent indicator="line" />}
                                    />
                                    <Line
                                        dataKey="value"
                                        type="natural"
                                        stroke="var(--color-value)"
                                        strokeWidth={2}
                                        dot={false}
                                    />
                                </LineChart>
                            </ChartContainer>
                        ) : (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                No trend data available
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
