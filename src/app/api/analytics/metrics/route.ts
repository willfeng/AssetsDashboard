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
        });
    } catch (error) {
        console.error("Error calculating metrics:", error);
        return NextResponse.json(
            { error: "Failed to calculate metrics" },
            { status: 500 }
        );
    }
}
