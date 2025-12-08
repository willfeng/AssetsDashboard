"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Landmark, TrendingUp, Bitcoin, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartEmptyDashboardProps {
    onConnectBank: () => void;
    onAddStock: () => void;
    onAddCrypto: () => void;
    userName?: string;
}

export function SmartEmptyDashboard({ onConnectBank, onAddStock, onAddCrypto, userName }: SmartEmptyDashboardProps) {
    return (
        <div className="w-full space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">

            {/* Header Blueprint */}
            <div className="text-center space-y-2 py-8">
                <h2 className="text-3xl font-bold tracking-tight">Access Configuration</h2>
                <p className="text-muted-foreground">Select a data source to activate your dashboard telemetry.</p>
            </div>

            {/* The 3 Pillars */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">

                {/* 1. Banking Pillar */}
                <Card
                    className="group relative overflow-hidden border-dashed border-2 hover:border-solid hover:border-primary/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    onClick={onConnectBank}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-4 rounded-full bg-blue-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Landmark className="w-8 h-8 text-blue-500" />
                        </div>
                        <CardTitle>Cash & Banking</CardTitle>
                        <CardDescription>Connect via Plaid</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Auto-sync balances from Chase, Wells Fargo, Citi, and 12,000+ institutions.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-blue-500 group-hover:text-white transition-colors">
                            Connect Bank <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* 2. Investment Pillar */}
                <Card
                    className="group relative overflow-hidden border-dashed border-2 hover:border-solid hover:border-primary/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    onClick={onAddStock}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-green-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-4 rounded-full bg-green-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <TrendingUp className="w-8 h-8 text-green-500" />
                        </div>
                        <CardTitle>Investments</CardTitle>
                        <CardDescription>Stocks & ETFs</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Track real-time performance of your customized stock portfolio automatically.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-green-500 group-hover:text-white transition-colors">
                            Add Portfolio <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>

                {/* 3. Crypto Pillar */}
                <Card
                    className="group relative overflow-hidden border-dashed border-2 hover:border-solid hover:border-primary/50 transition-all duration-300 cursor-pointer hover:-translate-y-1 hover:shadow-lg"
                    onClick={onAddCrypto}
                >
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="text-center pb-2">
                        <div className="mx-auto p-4 rounded-full bg-orange-500/10 mb-4 group-hover:scale-110 transition-transform duration-300">
                            <Bitcoin className="w-8 h-8 text-orange-500" />
                        </div>
                        <CardTitle>Crypto Assets</CardTitle>
                        <CardDescription>Wallets & Exchanges</CardDescription>
                    </CardHeader>
                    <CardContent className="text-center">
                        <p className="text-sm text-muted-foreground mb-6">
                            Sync with Binance, OKX, or track your cold wallets seamlessly.
                        </p>
                        <Button variant="outline" className="w-full group-hover:bg-orange-500 group-hover:text-white transition-colors">
                            Add Crypto <Plus className="w-4 h-4 ml-2" />
                        </Button>
                    </CardContent>
                </Card>
            </div>

            {/* Footer Trust Indicators */}
            <div className="pt-12 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest opacity-50">
                    Trusted by serious investors • Bank-level security • End-to-end encryption
                </p>
            </div>
        </div>
    );
}
