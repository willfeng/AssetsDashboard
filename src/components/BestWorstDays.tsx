"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, TrendingDown, Flame } from "lucide-react";

interface BestWorstDaysProps {
    metrics: {
        bestDay: { date: string; value: number; percent: number };
        worstDay: { date: string; value: number; percent: number };
        longestWinStreak: number;
        longestLossStreak: number;
    } | null;
    isLoading?: boolean;
}

export default function BestWorstDays({ metrics, isLoading }: BestWorstDaysProps) {
    if (isLoading) {
        return (
            <Card className="h-[400px]">
                <CardHeader>
                    <div className="h-6 w-32 bg-muted rounded animate-pulse" />
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="h-20 bg-muted rounded animate-pulse" />
                        ))}
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (!metrics) return null;

    return (
        <Card className="h-[400px] flex flex-col">
            <CardHeader>
                <CardTitle>Performance Extremes</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col justify-between">
                {/* Best Day */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                    <div className="p-2 bg-emerald-500/10 rounded-full">
                        <Trophy className="h-5 w-5 text-emerald-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Best Day</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-emerald-500">+{metrics.bestDay.percent.toFixed(2)}%</span>
                            <span className="text-xs text-muted-foreground">{metrics.bestDay.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">+${metrics.bestDay.value.toLocaleString()}</p>
                    </div>
                </div>

                {/* Worst Day */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-rose-500/5 border border-rose-500/10">
                    <div className="p-2 bg-rose-500/10 rounded-full">
                        <TrendingDown className="h-5 w-5 text-rose-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Worst Day</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-rose-500">{metrics.worstDay.percent.toFixed(2)}%</span>
                            <span className="text-xs text-muted-foreground">{metrics.worstDay.date}</span>
                        </div>
                        <p className="text-xs text-muted-foreground">${metrics.worstDay.value.toLocaleString()}</p>
                    </div>
                </div>

                {/* Streak */}
                <div className="flex items-center gap-4 p-3 rounded-lg bg-blue-500/5 border border-blue-500/10">
                    <div className="p-2 bg-blue-500/10 rounded-full">
                        <Flame className="h-5 w-5 text-blue-500" />
                    </div>
                    <div>
                        <p className="text-xs font-medium text-muted-foreground uppercase">Longest Win Streak</p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-lg font-bold text-blue-500">{metrics.longestWinStreak} Days</span>
                        </div>
                        <p className="text-xs text-muted-foreground">Consecutive positive returns</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
