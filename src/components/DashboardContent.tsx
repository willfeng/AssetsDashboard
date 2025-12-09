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
import { SettingsModal } from "@/components/SettingsModal";
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
import confetti from "canvas-confetti"; // Magic Moment

import { WelcomeOverlay } from "@/components/onboarding/WelcomeOverlay";
import { SmartEmptyDashboard } from "@/components/onboarding/SmartEmptyDashboard";

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

    // Onboarding State
    const [onboardingStatus, setOnboardingStatus] = useState<string | null>(null);
    const [isTransitioning, setIsTransitioning] = useState(false); // Magic Moment State

    // Edit/Delete State
    const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

    // Add Asset State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [addAssetType, setAddAssetType] = useState<'BANK' | 'STOCK' | 'CRYPTO'>('BANK');

    // Connection Modal State (for triggers)
    const [isConnectionModalOpen, setIsConnectionModalOpen] = useState(false);

    const [isSyncing, setIsSyncing] = useState(false);

    // --- Data Fetching ---

    const fetchUserStatus = useCallback(async () => {
        try {
            const res = await fetch('/api/user/onboarding', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setOnboardingStatus(data.status);
            }
        } catch (error) {
            console.error("Failed to fetch onboarding status:", error);
        }
    }, []);

    const updateOnboardingStatus = async (status: string) => {
        try {
            await fetch('/api/user/onboarding', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status })
            });
            setOnboardingStatus(status);
        } catch (error) {
            console.error("Failed to update status:", error);
        }
    };

    const fetchAssets = useCallback(async () => {
        try {
            const res = await fetch('/api/assets', { cache: 'no-store' });
            if (!res.ok) {
                if (res.status === 401) return;
                throw new Error(`API error: ${res.status}`);
            }
            const data = await res.json();
            const assetList = Array.isArray(data) ? data : [];
            setAssets(assetList);
        } catch (error) {
            console.error("Failed to fetch assets:", error);
            setAssets([]);
        }
    }, []);

    const fetchHistory = useCallback(async () => {
        try {
            const res = await fetch(`/api/history?range=${timeRange}`, { cache: 'no-store' });
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
            const res = await fetch('/api/analytics/metrics?range=1Y', { cache: 'no-store' });
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
                // Instead of partial update, trigger strict full refresh flow
                // This ensures SSOT logic (Calc -> Push) runs.
                await refreshDashboardData();
            }
        } catch (error) {
            console.error("Failed to refresh prices:", error);
        }
    }, [fetchHistory, fetchMetrics]);

    // Auto-Sync Logic
    const checkAutoSync = useCallback(async () => {
        try {
            const res = await fetch('/api/integrations', { cache: 'no-store' });
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

                // Sync complete. Now do a full SSOT refresh.
                await refreshDashboardData();
                setIsSyncing(false);
            }
        } catch (error) {
            console.error("Auto-sync failed:", error);
            setIsSyncing(false);
        }
    }, [fetchAssets, fetchHistory]);

    // --- Effects ---

    // 2. Calculate Total Balance (Client-Side Logic to match UI)
    // Note: We duplicate the calculation here to ensure what we push is what we render
    // Or we could rely on the render cycle, but that's async.
    // Better to calculate explicitly.

    const refreshDashboardData = useCallback(async (force: boolean = false) => {
        try {
            // 1. Fetch assets first to get latest values
            const assetsRes = await fetch('/api/assets' + (force ? '?refresh=true' : ''), { cache: 'no-store' });
            if (!assetsRes.ok) return;
            const assetsData = await assetsRes.json();
            const assetList = Array.isArray(assetsData) ? assetsData : [];
            setAssets(assetList);

            // 2. Calculate Total Balance (Client-Side Logic to match UI)
            // Note: We duplicate the calculation here to ensure what we push is what we render
            // Or we could rely on the render cycle, but that's async.
            // Better to calculate explicitly.

            let calculatedTotal = 0;
            // We need CurrencyService to be ready. It is fetched in init.

            for (const asset of assetList) {
                const rawValue = (asset.type === "BANK" || asset.type === "REAL_ESTATE" || asset.type === "CUSTOM")
                    ? (asset.balance || 0)
                    : (asset.totalValue || 0);
                calculatedTotal += CurrencyService.convertToUSD(rawValue, asset.currency || "USD");
            }

            // 3. Push this "Truth" to Backend History
            try {
                await fetch('/api/history', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ value: calculatedTotal })
                });
            } catch (e) {
                console.error("Failed to sync history:", e);
            }

            // 4. Then Fetch History (which will now have the correct point) and Metrics
            await fetchHistory();
            await fetchMetrics();
            setLastUpdated(new Date());
        } catch (error) {
            console.error("Failed to refresh dashboard:", error);
        }
    }, [fetchHistory, fetchMetrics]);

    // --- Effects ---

    useEffect(() => {
        if (!isSignedIn) return;

        const init = async () => {
            setLoading(true);

            // Parallel fetching to reduce initial load time
            await Promise.all([
                CurrencyService.fetchRates(),
                fetchUserStatus(),
                refreshDashboardData(false) // Optimistic Load: Fetch cached data immediately
            ]);

            setLoading(false); // Reveal UI instantly

            // 2. Background Refresh: Force strict update (Slow but silent)
            refreshDashboardData(true);

            checkAutoSync();
        };
        init();

        const interval = setInterval(refreshDashboardData, 5 * 60 * 1000);
        return () => clearInterval(interval);
    }, [isSignedIn, userId, refreshPrices, checkAutoSync, fetchUserStatus, refreshDashboardData]);

    // Effect to auto-graduate user from onboarding if they have assets (Magic Moment Logic)
    useEffect(() => {
        if (assets.length > 0 && onboardingStatus !== 'COMPLETED' && onboardingStatus !== null) {
            // Trigger Magic Moment Celebration
            setIsTransitioning(true);

            // Fire Confetti from bottom corners
            const duration = 3000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({
                    particleCount: 2,
                    angle: 60,
                    spread: 55,
                    origin: { x: 0 },
                    colors: ['#2563eb', '#9333ea', '#10b981'] // Brand colors
                });
                confetti({
                    particleCount: 2,
                    angle: 120,
                    spread: 55,
                    origin: { x: 1 },
                    colors: ['#2563eb', '#9333ea', '#10b981']
                });

                if (Date.now() < end) {
                    requestAnimationFrame(frame);
                }
            };
            frame();

            // Big burst in the middle
            setTimeout(() => {
                confetti({
                    particleCount: 100,
                    spread: 70,
                    origin: { y: 0.6 }
                });
            }, 500);

            // Wait for animation to finish before showing real dashboard
            setTimeout(() => {
                updateOnboardingStatus('COMPLETED');
                setIsTransitioning(false);
            }, 3500);
        }
    }, [assets.length, onboardingStatus]);

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
            await refreshDashboardData();
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

    const handleWelcomeComplete = () => {
        updateOnboardingStatus('SEEN_WELCOME');
    };

    // --- Calculations ---

    const totalBalance = assets.reduce((sum, asset) => {
        const rawValue = (asset.type === "BANK" || asset.type === "REAL_ESTATE" || asset.type === "CUSTOM")
            ? (asset.balance || 0)
            : (asset.totalValue || 0);
        return sum + CurrencyService.convertToUSD(rawValue, asset.currency || "USD");
    }, 0);

    const allocation = assets.reduce((acc, asset) => {
        let type = "Other";
        switch (asset.type) {
            case "BANK": type = "Cash"; break;
            case "STOCK": type = "Stock"; break;
            case "CRYPTO": type = "Crypto"; break;
            case "REAL_ESTATE": type = "Real Estate"; break;
            case "CUSTOM": type = "Custom"; break;
        }

        const rawValue = (asset.type === "BANK" || asset.type === "REAL_ESTATE" || asset.type === "CUSTOM")
            ? (asset.balance || 0)
            : (asset.totalValue || 0);
        const value = CurrencyService.convertToUSD(rawValue, asset.currency || "USD");
        acc[type] = (acc[type] || 0) + value;
        return acc;
    }, {} as Record<string, number>);

    const pieData = Object.entries(allocation).map(([name, value]) => ({ name, value }));

    // --- Render Logic ---

    // 1. Show Welcome Overlay if NEW
    if (onboardingStatus === 'NEW') {
        return <WelcomeOverlay onComplete={handleWelcomeComplete} />;
    }

    // 2. Main Dashboard Layout
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

                {/* Global Controls */}
                <div className="flex items-center gap-2 w-full md:w-auto">
                    <ConnectionManagerModal
                        open={isConnectionModalOpen}
                        onOpenChange={setIsConnectionModalOpen}
                        onChanged={refreshDashboardData}
                    />
                    <AddAssetModal
                        open={isAddModalOpen}
                        onOpenChange={setIsAddModalOpen}
                        defaultType={addAssetType}
                        trigger={
                            <Button
                                variant="outline"
                                className="gap-2 w-full md:w-auto"
                                onClick={() => {
                                    setAddAssetType('BANK'); // Default
                                    setIsAddModalOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4" />Add Asset
                            </Button>
                        }
                        onAssetAdded={() => {
                            refreshDashboardData();
                            setIsAddModalOpen(false);
                            // Magic Moment transition handled by effect
                        }}
                    />
                    <OnboardingModal />
                    <SettingsModal onHistoryReset={() => {
                        refreshDashboardData();
                        // Optional: Show success toast
                    }} />
                </div>

                {/* Hidden Edit Modal - Controlled */}
                <AddAssetModal
                    open={isEditModalOpen}
                    onOpenChange={setIsEditModalOpen}
                    initialData={editingAsset}
                    onAssetAdded={() => {
                        refreshDashboardData();
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

            {/* CONTENT AREA SWITCH */}
            {(assets.length === 0 || isTransitioning) && !loading ? (
                <SmartEmptyDashboard
                    onConnectBank={() => setIsConnectionModalOpen(true)}
                    onAddStock={() => {
                        setAddAssetType('STOCK');
                        setIsAddModalOpen(true);
                    }}
                    onAddCrypto={() => {
                        setAddAssetType('CRYPTO');
                        setIsAddModalOpen(true);
                    }}
                />
            ) : (
                <>
                    {/* Top Row: Total Net Worth (Full Width) */}
                    <Card className="w-full">
                        <CardContent className="p-6">
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                {/* Left: Total Balance */}
                                <div className="space-y-2">
                                    <h2 className="text-sm font-medium text-muted-foreground">Total Net Worth (USD)</h2>
                                    <div className="text-4xl font-bold">{CurrencyService.format(totalBalance, "USD")}</div>
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
                                            {returnVal > 0 ? "+" : ""}{CurrencyService.format(returnVal, "USD")}
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
                </>
            )}
        </div>
    );
}

// Fixed DashboardContent to correctly handle imports and structure
