"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetList } from "@/components/AssetList";
import { ConnectionManagerModal } from "@/components/ConnectionManagerModal";
import { OnboardingModal } from "@/components/OnboardingModal";
import { AddAssetModal } from "@/components/AddAssetModal";
import { Asset, HistoricalDataPoint } from "@/types";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { CurrencyService } from "@/lib/currency";
import { AssetTrendChart } from "@/components/AssetTrendChart";
import { useAuth } from "@clerk/nextjs";

// Dynamic import for charts to avoid SSR issues
const DashboardCharts = dynamic(() => import("@/components/DashboardCharts"), { ssr: false });

export function DashboardContent() {
    const { isSignedIn, userId } = useAuth();

    // State
    const [timeRange, setTimeRange] = useState("1M");
    const [assets, setAssets] = useState<Asset[]>([]);
    const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
    const [returnPct, setReturnPct] = useState(0);
    const [returnVal, setReturnVal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
    const [dashboardMetrics, setDashboardMetrics] = useState({
        monthHigh: 0,
        monthLow: 0,
        ytd: 0,
        today: { value: 0, percent: 0 }
    });

    // Edit/Delete State
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

    // Add Asset State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);

    const [isSyncing, setIsSyncing] = useState(false);

    // --- Data Fetching ---

    const fetchAssets = useCallback(async () => {
        try {
            const res = await fetch('/api/assets');
            if (!res.ok) {
                if (res.status === 401) return;
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();
            setAssets(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
            setAssets([]);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/history?range=${timeRange}`);
            if (!res.ok) return;

            const data = await res.json();
            if (data && Array.isArray(data.historyData)) {
                setHistoryData(data.historyData);
                setReturnPct(data.returnPct || 0);
                setReturnVal(data.returnVal || 0);
            }
        } catch (error) {
            console.error("Failed to fetch history:", error);
        }
    }, [timeRange]);

    const fetchMetrics = useCallback(async () => {
        try {
            const res = await fetch('/api/analytics/metrics?range=1Y');
            if (res.ok) {
                const data = await res.json();
                if (data.dashboard) {
                    setDashboardMetrics(data.dashboard);
                }
            }
        } catch (error) {
            console.error("Failed to fetch metrics:", error);
        }
    }, []);

    const refreshPrices = useCallback(async () => {
        try {
            console.log("Refreshing prices...");
            const res = await fetch('/api/assets/refresh', { method: 'POST' });
            if (res.ok) {
                const data = await res.json();
                setAssets(data.assets);
                setLastUpdated(new Date());
                fetchHistory();
                fetchMetrics();
            }
        } catch (error) {
            console.error("Failed to refresh prices:", error);
        }
    }, [fetchHistory, fetchMetrics]);

    // Auto-Sync Logic
    const checkAutoSync = useCallback(async () => {
        try {
            const res = await fetch('/api/integrations');
            if (!res.ok) return;

            const integrations = await res.json();
            if (!Array.isArray(integrations)) return;

            const activeIntegrations = integrations.filter((i: any) => i.isActive);
            if (activeIntegrations.length === 0) return;

            const now = new Date();
            const needsSync = activeIntegrations.some((i: any) => {
                if (!i.lastSync) return true;
                const lastSyncTime = new Date(i.lastSync);
                const diffMinutes = (now.getTime() - lastSyncTime.getTime()) / 1000 / 60;
                return diffMinutes > 1;
            });

            if (needsSync) {
                console.log("Auto-sync triggered...");
                setIsSyncing(true);

                for (const integration of activeIntegrations) {
                    await fetch('/api/integrations/sync', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ integrationId: integration.id })
                    });
                }

                await fetchAssets();
                await fetchHistory();
                setLastUpdated(new Date());
                setIsSyncing(false);
            }
        } catch (error) {
            console.error("Auto-sync failed:", error);
            setIsSyncing(false);
        }
    }, [fetchAssets, fetchHistory]);

    // --- Effects ---

    useEffect(() => {
        if (!isSignedIn) return;

        const init = async () => {
            setLoading(true);
            await CurrencyService.fetchRates();
            await Promise.all([fetchAssets(), fetchHistory(), fetchMetrics()]);
            setLoading(false);
            checkAutoSync();
        };
        init();

        const interval = setInterval(refreshPrices, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isSignedIn, userId, fetchAssets, fetchHistory, fetchMetrics, refreshPrices, checkAutoSync]);

    // --- Handlers ---

    const handleEdit = (asset: Asset) => {
        setEditingAsset(asset);
        setIsEditModalOpen(true);
    };

    const handleDeleteClick = (id: string) => {
        setDeletingAssetId(id);
    };

    const confirmDelete = async () => {
        if (!deletingAssetId) return;
        try {
            await fetch(`/api/assets?id=${deletingAssetId}`, { method: 'DELETE' });
            fetchAssets();
            fetchHistory();
        } catch (error) {
            console.error("Failed to delete asset:", error);
        } finally {
            setDeletingAssetId(null);
        }
    };

    const handleReorder = async (newAssets: Asset[]) => {
        setAssets(newAssets); // Optimistic
        try {
            const items = newAssets.map((asset, index) => ({
                id: asset.id,
                order: asset.order ?? index
            }));
            await fetch('/api/assets/reorder', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items })
            });
        } catch (error) {
            console.error("Failed to save asset order:", error);
        }
    };

    // --- Calculations ---

    const totalBalance = assets.reduce((sum, asset) => {
        const rawValue = asset.type === "BANK" ? asset.balance : (asset.totalValue || 0);
        return sum + CurrencyService.convertToUSD(rawValue, asset.currency || "USD");
    }, 0);

    const allocation = assets.reduce((acc, asset) => {
        const type = asset.type === "BANK" ? "Cash" : asset.type === "STOCK" ? "Stock" : "Crypto";
        const rawValue = asset.type === "BANK" ? asset.balance : (asset.totalValue || 0);
        const value = CurrencyService.convertToUSD(rawValue, asset.currency || "USD");
        acc[type] = (acc[type] || 0) + value;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(allocation).map(([name, value]) => ({ name, value }));

    return (
        <div className="p-8 space-y-8" id="dashboard">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="space-y-1 w-full md:w-auto">
                    <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                    <div className="flex items-center gap-4">
                        {isSyncing && (
                            <div className="flex items-center gap-2 text-sm text-blue-500 animate-pulse">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                                Syncing assets...
                            </div>
                        )}
                        {lastUpdated && (
                            <p className="text-sm text-muted-foreground">
                                Last updated: {lastUpdated.toLocaleTimeString()}
                            </p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ConnectionManagerModal
                        onChanged={() => {
                            fetchAssets();
                            fetchHistory();
                        }}
                    />
                    <AddAssetModal
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                        trigger={<Button variant="outline" className="gap-2 w-full md:w-auto"><Plus className="h-4 w-4" />Add Asset</Button>}
                        onAssetAdded={() => {
                            fetchAssets();
                            fetchHistory();
                            setIsAddModalOpen(false);
                        }}
                    />
                    <OnboardingModal />
                </div>

                {/* Hidden Edit Modal - Controlled */}
                <AddAssetModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    initialData={editingAsset}
                    onAssetAdded={() => {
                        fetchAssets();
                        fetchHistory();
                        setIsEditModalOpen(false);
                    }}
                />

                <AlertDialog open={!!deletingAssetId} onOpenChange={(open: boolean) => !open && setDeletingAssetId(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the asset from your portfolio.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>

            {/* Top Row: Total Net Worth (Full Width) */}
            <Card className="w-full">
                <CardContent className="p-6">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        {/* Left: Total Balance */}
                        <div className="space-y-2">
                            <h2 className="text-sm font-medium text-muted-foreground">Total Net Worth (USD)</h2>
                            <div className="text-4xl font-bold">${totalBalance.toLocaleString()}</div>
                            <div className={cn("flex items-center text-sm", dashboardMetrics.today.value >= 0 ? "text-green-500" : "text-red-500")}>
                                <span className="font-medium">
                                    {dashboardMetrics.today.value > 0 ? "+" : ""}
                                    {dashboardMetrics.today.percent.toFixed(1)}% ({dashboardMetrics.today.value > 0 ? "+" : ""}{CurrencyService.format(dashboardMetrics.today.value, "USD")})
                                </span>
                                <span className="ml-2 text-muted-foreground">Today</span>
                            </div>
                        </div>

                        {/* Middle: Key Metrics (Responsive) */}
                        <div className="grid grid-cols-3 gap-4 md:gap-8 border-t md:border-t-0 md:border-l md:border-r pt-4 md:pt-0 md:px-8 mt-4 md:mt-0 w-full md:w-auto">
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-xs text-muted-foreground">Month High</p>
                                <p className="font-semibold text-sm md:text-base">{CurrencyService.format(dashboardMetrics.monthHigh, "USD")}</p>
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-xs text-muted-foreground">Month Low</p>
                                <p className="font-semibold text-sm md:text-base">{CurrencyService.format(dashboardMetrics.monthLow, "USD")}</p>
                            </div>
                            <div className="space-y-1 text-center md:text-left">
                                <p className="text-xs text-muted-foreground">YTD</p>
                                <p className={cn("font-semibold text-sm md:text-base", dashboardMetrics.ytd >= 0 ? "text-green-500" : "text-red-500")}>
                                    {dashboardMetrics.ytd > 0 ? "+" : ""}{dashboardMetrics.ytd.toFixed(1)}%
                                </p>
                            </div>
                        </div>

                        {/* Right: Return Overview */}
                        <div className="flex flex-col gap-4 w-full md:w-[400px] mt-4 md:mt-0">
                            <div className="flex items-center justify-between md:justify-end">
                                <span className="text-sm font-medium md:hidden">Range</span>
                                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg overflow-x-auto">
                                    {['1W', '1M', '1Y', '3Y', '5Y'].map((period) => (
                                        <button
                                            key={period}
                                            onClick={() => setTimeRange(period)}
                                            className={cn(
                                                "px-3 py-1 text-xs font-medium rounded-md transition-all whitespace-nowrap",
                                                timeRange === period
                                                    ? "bg-background text-foreground shadow-sm"
                                                    : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                                            )}
                                        >
                                            {period}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex flex-col items-end justify-center h-full pb-2">
                                <div className={cn("text-4xl md:text-5xl font-bold tracking-tight", returnPct >= 0 ? "text-green-500" : "text-red-500")}>
                                    {returnPct > 0 ? "+" : ""}{returnPct}%
                                </div>
                                <div className="text-sm font-medium text-muted-foreground mt-1">
                                    {returnVal > 0 ? "+" : ""}${returnVal.toLocaleString()}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Mobile Trend Chart */}
                    <div className="mt-6 block md:hidden h-[200px] w-full -ml-2">
                        <AssetTrendChart
                            data={(() => {
                                if (historyData.length === 0) return [];
                                const today = new Date().toISOString().split('T')[0];
                                const lastPoint = historyData[historyData.length - 1];
                                const newData = [...historyData];
                                if (lastPoint.date === today) {
                                    newData[newData.length - 1] = { ...lastPoint, value: totalBalance };
                                }
                                return newData;
                            })()}
                            isLoading={loading}
                            height="100%"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Middle Row: Charts */}
            <div id="analytics" className="space-y-8">
                <DashboardCharts
                    pieData={pieData}
                    historyData={(() => {
                        if (historyData.length === 0) return [];
                        const today = new Date().toISOString().split('T')[0];
                        const lastPoint = historyData[historyData.length - 1];
                        const newData = [...historyData];
                        if (lastPoint.date === today) {
                            newData[newData.length - 1] = { ...lastPoint, value: totalBalance };
                        }
                        return newData;
                    })()}
                    isLoading={loading}
                    assets={assets}
                    hideTrendOnMobile={true}
                />
            </div>

            {/* Bottom Row: Asset Lists (3 Columns) */}
            <AssetList
                assets={assets}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onReorder={handleReorder}
            />
        </div>
    );
}
