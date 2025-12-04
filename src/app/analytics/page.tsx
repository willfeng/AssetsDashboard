"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KeyMetrics from "@/components/KeyMetrics";
import CategoryPerformanceChart from "@/components/CategoryPerformanceChart";
import MonthlyPnLChart from "@/components/MonthlyPnLChart";
import ConcentrationRisk from "@/components/ConcentrationRisk";
import TopMovers from "@/components/TopMovers";
import BestWorstDays from "@/components/BestWorstDays";
import { Asset } from "@/types";
import { CurrencyService } from "@/lib/currency";

interface MetricsData {
    totalReturn: { value: number; absolute: number };
    maxDrawdown: { value: number; date: Date | null };
    sharpeRatio: number;
    volatility: number;
    bestDay: { date: string; value: number; percent: number };
    worstDay: { date: string; value: number; percent: number };
    longestWinStreak: number;
    longestLossStreak: number;
    sparkline: { value: number }[];
}

interface CategoryPerformanceData {
    dates: string[];
    categories: {
        Stocks: number[];
        Crypto: number[];
        Cash: number[];
    };
}

interface MonthlyPnLData {
    month: string;
    pnl: number;
}

export default function AnalyticsPage() {
    const [timeRange, setTimeRange] = useState("1Y");
    const [loading, setLoading] = useState(true);
    const [metrics, setMetrics] = useState<MetricsData | null>(null);
    const [categoryData, setCategoryData] = useState<CategoryPerformanceData | null>(null);
    const [monthlyPnL, setMonthlyPnL] = useState<MonthlyPnLData[] | null>(null);
    const [assets, setAssets] = useState<Asset[]>([]);

    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // Initialize currency rates first
                await CurrencyService.fetchRates();

                // 1. Fetch Metrics
                const metricsRes = await fetch(`/api/analytics/metrics?range=${timeRange}`);
                if (metricsRes.ok) {
                    const metricsData = await metricsRes.json();
                    setMetrics(metricsData);
                }

                // 2. Fetch Category Performance
                const catRes = await fetch(`/api/analytics/category-performance?range=${timeRange}`);
                if (catRes.ok) {
                    const catData = await catRes.json();
                    setCategoryData(catData);
                }

                // 3. Fetch Monthly P&L
                const pnlRes = await fetch(`/api/analytics/monthly-pnl?months=12`);
                if (pnlRes.ok) {
                    const pnlData = await pnlRes.json();
                    setMonthlyPnL(pnlData);
                }

                // 4. Fetch Assets for Risk & Movers
                const assetsRes = await fetch('/api/assets');
                if (assetsRes.ok) {
                    const assetsData = await assetsRes.json();
                    setAssets(assetsData);
                }

            } catch (error) {
                console.error("Failed to fetch analytics data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [timeRange]);

    return (
        <div className="p-6 space-y-8 max-w-[1600px] mx-auto">
            {/* 1. Header Section */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Analytics</h1>
                    <p className="text-muted-foreground mt-1">
                        Comprehensive portfolio performance and risk analysis.
                    </p>
                </div>
                <Tabs value={timeRange} onValueChange={setTimeRange} className="w-full md:w-auto">
                    <TabsList>
                        <TabsTrigger value="1W">1W</TabsTrigger>
                        <TabsTrigger value="1M">1M</TabsTrigger>
                        <TabsTrigger value="3M">3M</TabsTrigger>
                        <TabsTrigger value="1Y">1Y</TabsTrigger>
                        <TabsTrigger value="ALL">ALL</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* 2. Key Metrics Section */}
            <KeyMetrics metrics={metrics} isLoading={loading} />

            {/* 3. Core Analysis Section (Split View) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <CategoryPerformanceChart data={categoryData} isLoading={loading} />
                <MonthlyPnLChart data={monthlyPnL} isLoading={loading} />
            </div>

            {/* 4. Risk & Insights Section (Grid View) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <ConcentrationRisk assets={assets} isLoading={loading} />
                <TopMovers assets={assets} isLoading={loading} />
                <BestWorstDays metrics={metrics} isLoading={loading} />
            </div>
        </div>
    );
}
