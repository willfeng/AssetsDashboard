"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import dynamic from "next/dynamic";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, Wallet, Bitcoin, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { AssetList } from "@/components/AssetList";
import { ConnectionManagerModal } from "@/components/ConnectionManagerModal";
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

const DashboardCharts = dynamic(() => import("@/components/DashboardCharts"), { ssr: false });

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("1M");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
  const [returnPct, setReturnPct] = useState(0);
  const [returnVal, setReturnVal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Edit/Delete State
  const [editingAsset, setEditingAsset] = useState<Asset | undefined>(undefined);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingAssetId, setDeletingAssetId] = useState<string | null>(null);

  // Add Asset State (Controlled)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [isSyncing, setIsSyncing] = useState(false);

  const fetchAssets = useCallback(async () => {
    try {
      console.log("Fetching assets...");
      const res = await fetch('/api/assets');
      if (!res.ok) {
        if (res.status === 401) {
          console.log("User not logged in");
          setAssets([]);
          return;
        }
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      if (Array.isArray(data)) {
        setAssets(data);
      } else {
        console.error("Assets data is not an array:", data);
        setAssets([]);
      }
    } catch (error) {
      console.error("Failed to fetch assets:", error);
      setAssets([]);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history?range=${timeRange}`);
      if (!res.ok) {
        if (res.status === 401) return;
        throw new Error(`API error: ${res.status}`);
      }
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

  const refreshPrices = useCallback(async () => {
    try {
      console.log("Refreshing prices...");
      const res = await fetch('/api/assets/refresh', { method: 'POST' });
      if (res.ok) {
        const data = await res.json();
        setAssets(data.assets); // Update with fresh data directly
        setLastUpdated(new Date());
        fetchHistory(); // Refresh history too
      }
    } catch (error) {
      console.error("Failed to refresh prices:", error);
    }
  }, [fetchHistory]);

  // Auto-Sync Logic
  const checkAutoSync = useCallback(async () => {
    try {
      const res = await fetch('/api/integrations');
      if (!res.ok) return;

      const integrations = await res.json();
      if (!Array.isArray(integrations)) return;

      const activeIntegrations = integrations.filter((i: any) => i.isActive);
      if (activeIntegrations.length === 0) return;

      // Check if any integration needs sync (lastSync > 1 min ago or null)
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

        // Sync each provider
        for (const integration of activeIntegrations) {
          await fetch('/api/integrations/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ integrationId: integration.id })
          });
        }

        // Refresh data
        await fetchAssets();
        await fetchHistory();
        setLastUpdated(new Date());
        setIsSyncing(false);
        console.log("Auto-sync completed.");
      }
    } catch (error) {
      console.error("Auto-sync failed:", error);
      setIsSyncing(false);
    }
  }, [fetchAssets, fetchHistory]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await fetchAssets();
      await fetchHistory();
      await checkAutoSync();
      setLoading(false);
    };
    init();

    // Poll for price updates every 5 minutes
    const interval = setInterval(refreshPrices, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAssets, fetchHistory, refreshPrices, checkAutoSync]);

  // Handlers
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

  // Calculate totals
  const totalBalance = assets.reduce((sum, asset) => {
    if (asset.type === "BANK") return sum + asset.balance;
    return sum + (asset.totalValue || 0);
  }, 0);

  // Calculate allocation for Pie Chart
  const allocation = assets.reduce((acc, asset) => {
    const type = asset.type === "BANK" ? "Cash" : asset.type === "STOCK" ? "Stock" : "Crypto";
    acc[type] = (acc[type] || 0) + (asset.type === "BANK" ? asset.balance : asset.totalValue || 0);
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(allocation).map(([name, value]) => ({ name, value }));



  return (
    <div className="p-8 space-y-8" id="dashboard">
      <div className="flex justify-between items-center">
        <div className="space-y-1">
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
        <div className="flex items-center gap-2">
          <ConnectionManagerModal
            onChanged={() => {
              fetchAssets();
              fetchHistory();
            }}
          />
          <AddAssetModal
            open={isAddModalOpen}
            onOpenChange={setIsAddModalOpen}
            trigger={<Button>Add Asset</Button>}
            onAssetAdded={() => {
              fetchAssets();
              fetchHistory();
              setIsAddModalOpen(false);
            }}
          />
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
              <div className="flex items-center text-sm text-green-500">
                <span className="font-medium">+2.5% (+$31,250)</span>
                <span className="ml-2 text-muted-foreground">Today</span>
              </div>
            </div>

            {/* Middle: Key Metrics (Responsive) */}
            <div className="grid grid-cols-3 gap-4 md:gap-8 border-t md:border-t-0 md:border-l md:border-r pt-4 md:pt-0 md:px-8 mt-4 md:mt-0 w-full md:w-auto">
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs text-muted-foreground">Month High</p>
                <p className="font-semibold text-sm md:text-base">$1,280,000</p>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs text-muted-foreground">Month Low</p>
                <p className="font-semibold text-sm md:text-base">$1,150,000</p>
              </div>
              <div className="space-y-1 text-center md:text-left">
                <p className="text-xs text-muted-foreground">YTD</p>
                <p className="font-semibold text-sm md:text-base text-green-500">+15.4%</p>
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
        </CardContent>
      </Card>

      {/* Middle Row: Charts */}
      <div id="analytics">
        <DashboardCharts pieData={pieData} historyData={historyData} isLoading={loading} />
      </div>

      {/* Bottom Row: Asset Lists (3 Columns) */}
      <AssetList
        assets={assets}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
      />
    </div>
  );
}
