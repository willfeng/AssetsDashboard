"use client";

import { Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { HistoricalDataPoint } from "@/types";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/EmptyState";
import { TrendingUp } from "lucide-react";
import { CurrencyService } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface AssetTrendChartProps {
    data: HistoricalDataPoint[];
    isLoading: boolean;
    className?: string;
    height?: number | string;
}

const chartConfig = {
    value: {
        label: "Value",
        color: "#2563eb",
    },
} satisfies ChartConfig;

export function AssetTrendChart({ data, isLoading, className, height = "100%" }: AssetTrendChartProps) {
    if (isLoading) {
        return (
            <div className={cn("flex items-center justify-center text-muted-foreground", className)} style={{ height }}>
                Loading trend data...
            </div>
        );
    }

    if (data.length === 0) {
        return (
            <div className={cn(className)} style={{ height }}>
                <EmptyState
                    icon={TrendingUp}
                    title="No Trend Data"
                    description="History will appear after you add assets."
                    className="h-full"
                />
            </div>
        );
    }

    return (
        <div className={cn("w-full", className)} style={{ height }}>
            <ChartContainer config={chartConfig} className="h-full w-full">
                <LineChart
                    data={data}
                    margin={{
                        left: 12,
                        right: 12,
                        bottom: 20,
                        top: 10
                    }}
                >
                    <CartesianGrid vertical={false} strokeDasharray="3 3" strokeOpacity={0.2} />
                    <XAxis
                        dataKey="date"
                        tickLine={true}
                        axisLine={true}
                        tickMargin={10}
                        minTickGap={32}
                    />
                    <YAxis
                        width={45}
                        tickLine={true}
                        axisLine={true}
                        tickFormatter={(value) => CurrencyService.formatCompact(value, "USD")}
                        tick={{ fontSize: 12 }}
                        tickMargin={5}
                    />
                    <ChartTooltip
                        cursor={false}
                        content={<ChartTooltipContent indicator="line" />}
                    />
                    <Line
                        dataKey="value"
                        type="monotone"
                        stroke="var(--color-value)"
                        strokeWidth={2}
                        dot={false}
                        connectNulls={true}
                    />
                </LineChart>
            </ChartContainer>
        </div>
    );
}
