import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Get time range from query params
        const { searchParams } = new URL(req.url);
        const range = searchParams.get("range") || "1Y";

        // Self-Healing: Check for Ghost Data (No assets but history exists)
        const assetCount = await prisma.asset.count({
            where: { userId: user.id }
        });

        if (assetCount === 0) {
            // Check latest history
            const latestHistory = await prisma.history.findFirst({
                where: { userId: user.id },
                orderBy: { date: 'desc' }
            });

            if (latestHistory && latestHistory.value > 0) {
                console.log(`[Metrics] Ghost data detected for ${user.id}. Assets: 0, History: ${latestHistory.value}. Triggering repair...`);
                // Update history to 0
                await prisma.history.create({
                    data: {
                        userId: user.id,
                        date: new Date().toISOString().split('T')[0],
                        value: 0
                    }
                }).catch(async () => {
                    // If duplicate date (upsert needed), update
                    const today = new Date().toISOString().split('T')[0];
                    await prisma.history.update({
                        where: { userId_date: { userId: user.id, date: today } },
                        data: { value: 0 }
                    });
                });

                // Return empty metrics immediately
                return NextResponse.json({
                    totalReturn: { value: 0, absolute: 0 },
                    maxDrawdown: { value: 0, date: null },
                    sharpeRatio: 0,
                    volatility: 0,
                    bestDay: { date: null, value: 0, percent: 0 },
                    worstDay: { date: null, value: 0, percent: 0 },
                    longestStreak: { wins: 0, losses: 0 },
                    dashboard: { monthHigh: 0, monthLow: 0, ytd: 0, today: { value: 0, percent: 0 } },
                    sparkline: []
                });
            } else if (!latestHistory) {
                // Truly new user
                return NextResponse.json({
                    totalReturn: { value: 0, absolute: 0 },
                    maxDrawdown: { value: 0, date: null },
                    sharpeRatio: 0,
                    volatility: 0,
                    bestDay: { date: null, value: 0, percent: 0 },
                    worstDay: { date: null, value: 0, percent: 0 },
                    longestStreak: { wins: 0, losses: 0 },
                    dashboard: { monthHigh: 0, monthLow: 0, ytd: 0, today: { value: 0, percent: 0 } },
                    sparkline: []
                });
            }
        }

        // Calculate date range
        const endDate = new Date();
        const startDate = new Date();
        switch (range) {
            case "1W":
                startDate.setDate(endDate.getDate() - 7);
                break;
            case "1M":
                startDate.setMonth(endDate.getMonth() - 1);
                break;
            case "3M":
                startDate.setMonth(endDate.getMonth() - 3);
                break;
            case "1Y":
                startDate.setFullYear(endDate.getFullYear() - 1);
                break;
            case "3Y":
                startDate.setFullYear(endDate.getFullYear() - 3);
                break;
            case "5Y":
                startDate.setFullYear(endDate.getFullYear() - 5);
                break;
            case "ALL":
                startDate.setFullYear(2000, 0, 1);
                break;
            default:
                startDate.setFullYear(endDate.getFullYear() - 1);
        }

        // Fetch historical data using History model (not historicalData)
        const history = await prisma.history.findMany({
            where: {
                userId: user.id,
                date: {
                    gte: startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD
                    lte: endDate.toISOString().split('T')[0],
                },
            },
            orderBy: { date: "asc" },
        });

        if (history.length < 2) {
            return NextResponse.json({
                totalReturn: { value: 0, absolute: 0 },
                maxDrawdown: { value: 0, date: null },
                sharpeRatio: 0,
                volatility: 0,
                bestDay: { date: null, value: 0, percent: 0 },
                worstDay: { date: null, value: 0, percent: 0 },
                longestStreak: { wins: 0, losses: 0 },
            });
        }

        // Calculate daily changes
        const dailyChanges = [];
        const dailyReturns = [];

        for (let i = 1; i < history.length; i++) {
            const current = history[i];
            const previous = history[i - 1];
            const change = current.value - previous.value; // Use 'value' field
            const returnPct = previous.value !== 0
                ? (change / previous.value) * 100
                : 0;

            dailyChanges.push({
                date: current.date,
                value: change,
                percent: returnPct,
            });
            dailyReturns.push(returnPct / 100); // Convert to decimal for calculations
        }

        // 1. Total Return
        const initialValue = history[0].value; // Use 'value' field
        const finalValue = history[history.length - 1].value; // Use 'value' field
        const totalReturnValue = ((finalValue - initialValue) / initialValue) * 100;
        const totalReturnAbsolute = finalValue - initialValue;

        // 2. Max Drawdown
        let maxDrawdown = 0;
        let maxDrawdownDate = null;
        let peak = history[0].value; // Use 'value' field

        for (let i = 1; i < history.length; i++) {
            const current = history[i].value; // Use 'value' field
            if (current > peak) {
                peak = current;
            }
            const drawdown = ((current - peak) / peak) * 100;
            if (drawdown < maxDrawdown) {
                maxDrawdown = drawdown;
                maxDrawdownDate = history[i].date;
            }
        }

        // 3. Volatility (Annualized Standard Deviation)
        const meanReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
        const variance = dailyReturns.reduce((sum, r) => sum + Math.pow(r - meanReturn, 2), 0) / dailyReturns.length;
        const dailyVolatility = Math.sqrt(variance);
        const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; // 252 trading days

        // 4. Sharpe Ratio (assuming risk-free rate = 2%)
        const riskFreeRate = 0.02;
        const excessReturn = (totalReturnValue / 100) - riskFreeRate;
        const sharpeRatio = annualizedVolatility !== 0
            ? excessReturn / (annualizedVolatility / 100)
            : 0;

        // 5. Best Day
        const bestDay = dailyChanges.reduce((best, current) =>
            current.value > best.value ? current : best
            , dailyChanges[0]);

        // 6. Worst Day
        const worstDay = dailyChanges.reduce((worst, current) =>
            current.value < worst.value ? current : worst
            , dailyChanges[0]);

        // 7. Longest Streaks
        let currentWinStreak = 0;
        let currentLossStreak = 0;
        let maxWinStreak = 0;
        let maxLossStreak = 0;

        for (const change of dailyChanges) {
            if (change.value > 0) {
                currentWinStreak++;
                currentLossStreak = 0;
                maxWinStreak = Math.max(maxWinStreak, currentWinStreak);
            } else if (change.value < 0) {
                currentLossStreak++;
                currentWinStreak = 0;
                maxLossStreak = Math.max(maxLossStreak, currentLossStreak);
            } else {
                currentWinStreak = 0;
                currentLossStreak = 0;
            }
        }

        // 8. Derived Dashboard Metrics (from history array to ensure consistency)

        // Month High/Low (Last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const thirtyDaysStr = thirtyDaysAgo.toISOString().split('T')[0];
        const monthHistory = history.filter(h => h.date >= thirtyDaysStr);

        const monthHigh = monthHistory.length > 0 ? Math.max(...monthHistory.map(h => h.value)) : 0;
        const monthLow = monthHistory.length > 0 ? Math.min(...monthHistory.map(h => h.value)) : 0;

        // Today's Change
        let todayMetric = { value: 0, percent: 0 };
        if (history.length >= 2) {
            const last = history[history.length - 1];
            const prev = history[history.length - 2];
            const change = last.value - prev.value;
            const pct = prev.value !== 0 ? (change / prev.value) * 100 : 0;
            todayMetric = { value: change, percent: pct };
        } else if (history.length === 1 && history[0].value > 0) {
            // New user, single record = 100% gain? Or treated as 0 change?
            // Usually treated as 0 change from "nothing".
            todayMetric = { value: 0, percent: 0 };
        }

        // YTD
        const currentYear = new Date().getFullYear();
        const startOfYear = `${currentYear}-01-01`;
        // Since main history query might be filtered by range, we need to ensure we have YTD data.
        // If range is 1M, we don't have Jan 1. 
        // So we DO need a separate query for YTD Start if it's not in 'history'.
        // BUT to avoid inconsistency, we should trust the 'Total Return' logic for long ranges, 
        // or just fetch YTD start separately but ensure it's not "future".

        // Re-fetching ONLY YTD Start to be safe, but calculating logic consistently.
        const ytdStartRecord = await prisma.history.findFirst({
            where: { userId: user.id, date: { gte: startOfYear } },
            orderBy: { date: 'asc' }
        });

        let ytd = 0;
        const currentVal = history[history.length - 1].value;
        if (ytdStartRecord && ytdStartRecord.value > 0) {
            ytd = ((currentVal - ytdStartRecord.value) / ytdStartRecord.value) * 100;
        }

        return NextResponse.json({
            totalReturn: {
                value: parseFloat(totalReturnValue.toFixed(2)),
                absolute: parseFloat(totalReturnAbsolute.toFixed(2)),
            },
            maxDrawdown: {
                value: parseFloat(maxDrawdown.toFixed(2)),
                date: maxDrawdownDate,
            },
            sharpeRatio: parseFloat(sharpeRatio.toFixed(2)),
            volatility: parseFloat(annualizedVolatility.toFixed(2)),
            bestDay: {
                date: bestDay.date,
                value: parseFloat(bestDay.value.toFixed(2)),
                percent: parseFloat(bestDay.percent.toFixed(2)),
            },
            worstDay: {
                date: worstDay.date,
                value: parseFloat(worstDay.value.toFixed(2)),
                percent: parseFloat(worstDay.percent.toFixed(2)),
            },
            longestStreak: {
                wins: maxWinStreak,
                losses: maxLossStreak,
            },
            dashboard: {
                monthHigh,
                monthLow,
                ytd,
                today: todayMetric,
            },
            sparkline: history.slice(-30).map(h => ({ value: h.value })),
        });
    } catch (error) {
        console.error("Error calculating metrics:", error);
        return NextResponse.json(
            { error: "Failed to calculate metrics" },
            { status: 500 }
        );
    }
}
