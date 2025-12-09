"use client";

import { useState, useMemo } from "react";
import { PieChart, Pie, Cell, Label } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { HistoricalDataPoint, Asset } from "@/types";
import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    ChartConfig,
} from "@/components/ui/chart";
import { EmptyState } from "@/components/EmptyState";
import { PieChart as PieChartIcon, ChevronLeft } from "lucide-react";
import { CurrencyService } from "@/lib/currency";
import { cn } from "@/lib/utils";
import { AssetTrendChart } from "./AssetTrendChart";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

interface DashboardChartsProps {
    pieData: { name: string; value: number }[];
    historyData: HistoricalDataPoint[];
    isLoading: boolean;
    assets: Asset[];
    hideTrendOnMobile?: boolean;
}

const pieConfig = {
    value: {
        label: "Value",
    },
} satisfies ChartConfig;

export default function DashboardCharts({ pieData, historyData, isLoading, assets, hideTrendOnMobile = false }: DashboardChartsProps) {
    const [drillDownCategory, setDrillDownCategory] = useState<string | null>(null);

    const totalValue = pieData.reduce((acc, curr) => acc + curr.value, 0);

    // Custom Colors
    const CATEGORY_COLORS = {
        "Cash": "#10b981",      // Emerald-500
        "Stock": "#3b82f6",     // Blue-500
        "Crypto": "#f59e0b",    // Amber-500
        "Real Estate": "#8b5cf6", // Violet-500
        "Custom": "#ec4899",    // Pink-500
    };

    // Calculate drill-down data
    const drillDownData = useMemo(() => {
        if (!drillDownCategory) return [];

        return assets
            .filter(asset => {
                let type = "Other";
                switch (asset.type) {
                    case "BANK": type = "Cash"; break;
                    case "STOCK": type = "Stock"; break;
                    case "CRYPTO": type = "Crypto"; break;
                    case "REAL_ESTATE": type = "Real Estate"; break;
                    case "CUSTOM": type = "Custom"; break;
                }
                return type === drillDownCategory;
            })
            .map(asset => {
                let value = 0;
                if (asset.type === "BANK" || asset.type === "REAL_ESTATE" || asset.type === "CUSTOM") {
                    value = CurrencyService.convertToUSD(asset.balance, asset.currency || "USD");
                } else {
                    value = asset.totalValue || 0;
                }
                return { name: asset.name, value };
            })
            .sort((a, b) => b.value - a.value);
    }, [assets, drillDownCategory]);

    const currentPieData = drillDownCategory ? drillDownData : pieData;
    const currentTotal = drillDownCategory
        ? drillDownData.reduce((acc, curr) => acc + curr.value, 0)
        : totalValue;

    return (
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card className="col-span-1 flex flex-col">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-base font-medium">
                        {drillDownCategory ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 -ml-2"
                                    onClick={() => setDrillDownCategory(null)}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                {drillDownCategory} Distribution
                            </div>
                        ) : "Asset Allocation"}
                    </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pb-0">
                    <div className="h-[250px] relative">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-full text-muted-foreground">
                                Loading allocation...
                            </div>
                        ) : currentPieData.length > 0 ? (
                            <div className="flex flex-col h-full">
                                <ChartContainer config={pieConfig} className="mx-auto aspect-square max-h-[250px] w-full flex-1">
                                    <PieChart>
                                        <ChartTooltip
                                            cursor={false}
                                            content={<ChartTooltipContent hideLabel formatter={(value) => CurrencyService.format(Number(value), "USD")} />}
                                        />
                                        <Pie
                                            data={currentPieData}
                                            dataKey="value"
                                            nameKey="name"
                                            innerRadius={60}
                                            outerRadius={85}
                                            paddingAngle={2}
                                            stroke="none"
                                            onClick={(data) => {
                                                if (!drillDownCategory) {
                                                    setDrillDownCategory(data.name);
                                                }
                                            }}
                                            className={!drillDownCategory ? "cursor-pointer" : ""}
                                        >
                                            {currentPieData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={drillDownCategory
                                                        ? COLORS[index % COLORS.length]
                                                        : (CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#8884d8")
                                                    }
                                                />
                                            ))}
                                            <Label
                                                content={({ viewBox }) => {
                                                    if (viewBox && "cx" in viewBox && "cy" in viewBox) {
                                                        return (
                                                            <text
                                                                x={viewBox.cx}
                                                                y={viewBox.cy}
                                                                textAnchor="middle"
                                                                dominantBaseline="middle"
                                                            >
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={viewBox.cy}
                                                                    className="fill-foreground text-2xl font-bold"
                                                                >
                                                                    ${currentTotal.toLocaleString(undefined, { maximumFractionDigits: 0, notation: "compact" })}
                                                                </tspan>
                                                                <tspan
                                                                    x={viewBox.cx}
                                                                    y={(viewBox.cy || 0) + 24}
                                                                    className="fill-muted-foreground text-xs"
                                                                >
                                                                    {drillDownCategory ? "Category Total" : "Total Net Worth"}
                                                                </tspan>
                                                            </text>
                                                        )
                                                    }
                                                }}
                                            />
                                        </Pie>
                                    </PieChart>
                                </ChartContainer>
                            </div>
                        ) : (
                            <EmptyState
                                icon={PieChartIcon}
                                title="No Allocation Data"
                                description="Add assets to see your portfolio breakdown."
                                className="h-full"
                            />
                        )}
                    </div>

                    {/* Dynamic Legend */}
                    <div className={cn(
                        "mt-4 grid gap-3 text-sm",
                        drillDownCategory ? "grid-cols-2" : "grid-cols-1"
                    )}>
                        {currentPieData.map((entry, index) => (
                            <div key={entry.name} className={cn(
                                "flex items-center gap-2",
                                !drillDownCategory && "justify-between"
                            )}>
                                <div className="flex items-center gap-2 truncate">
                                    <div
                                        className="h-3 w-3 shrink-0 rounded-full"
                                        style={{
                                            backgroundColor: drillDownCategory
                                                ? COLORS[index % COLORS.length]
                                                : (CATEGORY_COLORS[entry.name as keyof typeof CATEGORY_COLORS] || "#8884d8")
                                        }}
                                    />
                                    <span className="truncate font-medium" title={entry.name}>{entry.name}</span>
                                </div>

                                {drillDownCategory ? (
                                    <span className="ml-auto text-muted-foreground text-xs">
                                        {((entry.value / currentTotal) * 100).toFixed(1)}%
                                    </span>
                                ) : (
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground whitespace-nowrap">
                                        <span className="font-mono">{CurrencyService.format(entry.value, "USD")}</span>
                                        <span className="bg-muted px-1.5 py-0.5 rounded-md text-[10px] font-medium text-foreground">
                                            {((entry.value / currentTotal) * 100).toFixed(1)}%
                                        </span>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>

            <Card className={cn("col-span-1 md:col-span-2 flex flex-col", hideTrendOnMobile && "hidden md:flex")}>
                <CardHeader>
                    <CardTitle>Asset Trend</CardTitle>
                </CardHeader>
                <CardContent className="flex-1 pl-2">
                    <AssetTrendChart data={historyData} isLoading={isLoading} height={350} />
                </CardContent>
            </Card>
        </div>
    );
}
