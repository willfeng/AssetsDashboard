"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis, YAxis, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight, TrendingUp, TrendingDown, DollarSign, Wallet, Bitcoin } from "lucide-react";
import { cn } from "@/lib/utils";
import { Asset, HistoricalDataPoint } from "@/types";
import { AddAssetModal } from "@/components/AddAssetModal";

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

export default function Dashboard() {
  const [timeRange, setTimeRange] = useState("1M");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [historyData, setHistoryData] = useState<HistoricalDataPoint[]>([]);
  const [returnPct, setReturnPct] = useState(0);
  const [returnVal, setReturnVal] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchAssets = useCallback(async () => {
    try {
      console.log("Fetching assets...");
      const res = await fetch('/api/assets');
      console.log("Assets response status:", res.status);
      const data = await res.json();
      console.log("Fetched assets data:", data);
      setAssets(data);
    } catch (error) {
      console.error("Failed to fetch assets:", error);
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`/api/history?range=${timeRange}`);
      const data = await res.json();
      setHistoryData(data.historyData);
      setReturnPct(data.returnPct);
      setReturnVal(data.returnVal);
    } catch (error) {
      console.error("Failed to fetch history:", error);
    }
  }, [timeRange]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await Promise.all([fetchAssets(), fetchHistory()]);
      setLoading(false);
    };
    init();
  }, [fetchAssets, fetchHistory]);

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
    <div className="p-8 space-y-8">
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
        <AddAssetModal onAssetAdded={() => {
          fetchAssets();
          fetchHistory(); // Also refresh history as it might depend on assets in real app
        }} />
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

            {/* Middle: Key Metrics (NEW) */}
            <div className="hidden md:flex gap-8 border-l pl-8 border-r pr-8">
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Month High</p>
                <p className="font-semibold">$1,280,000</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Month Low</p>
                <p className="font-semibold">$1,150,000</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">YTD</p>
                <p className="font-semibold text-green-500">+15.4%</p>
              </div>
            </div>

            {/* Right: Return Overview (NEW) */}
            <div className="flex flex-col gap-4 w-full md:w-[400px]">
              <div className="flex items-center justify-end">
                <div className="flex gap-1 bg-muted/50 p-1 rounded-lg">
                  {['1W', '1M', '1Y', '3Y', '5Y'].map((period) => (
                    <button
                      key={period}
                      onClick={() => setTimeRange(period)}
                      className={cn(
                        "px-3 py-1 text-xs font-medium rounded-md transition-all",
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
                <div className="text-5xl font-bold text-green-500 tracking-tight">
                  {returnPct}
                </div>
                <div className="text-sm font-medium text-muted-foreground mt-1">
                  {returnVal}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Middle Row: Allocation (1/3) + Trend (2/3) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="col-span-1">
          <CardHeader>
            <CardTitle>Asset Allocation</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              {pieData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      fill="#8884d8"
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
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

        <Card className="col-span-2">
          <CardHeader>
            <CardTitle>Asset Trend</CardTitle>
          </CardHeader>
          <CardContent className="pl-2">
            <div className="h-[350px]">
              {historyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={historyData}>
                    <defs>
                      <linearGradient id="colorValueMain" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <XAxis
                      dataKey="date"
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `$${value}`}
                    />
                    <Tooltip />
                    <Area
                      type="monotone"
                      dataKey="value"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#colorValueMain)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Loading trend data...
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bottom Row: Asset Lists (3 Columns) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.filter((a) => a.type === "BANK").map((asset: any) => (
                <div key={asset.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {asset.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.currency}
                    </p>
                  </div>
                  <div className="font-medium">
                    {asset.currency === "USD" ? "$" : "HK$"}
                    {asset.balance?.toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stocks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.filter((a) => a.type === "STOCK").map((asset: any) => (
                <div key={asset.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {asset.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.quantity} shares
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${asset.totalValue?.toLocaleString()}
                    </div>
                    <p className={cn("text-xs", asset.change24h >= 0 ? "text-green-500" : "text-red-500")}>
                      {asset.change24h > 0 ? "+" : ""}{asset.change24h}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Crypto</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {assets.filter((a) => a.type === "CRYPTO").map((asset: any) => (
                <div key={asset.id} className="flex items-center justify-between border-b pb-2 last:border-0 last:pb-0">
                  <div className="space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {asset.symbol}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {asset.quantity} coins
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">
                      ${asset.totalValue?.toLocaleString()}
                    </div>
                    <p className={cn("text-xs", asset.change24h >= 0 ? "text-green-500" : "text-red-500")}>
                      {asset.change24h > 0 ? "+" : ""}{asset.change24h}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
