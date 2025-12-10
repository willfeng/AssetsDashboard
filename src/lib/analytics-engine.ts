
import { prisma } from "@/lib/prisma";
import { MarketDataService } from "@/lib/market-data";
import { Asset, Transaction } from "@prisma/client";
import { differenceInDays, subDays, isBefore, isAfter, startOfDay, endOfDay, format, startOfYear } from "date-fns";

export interface TimeSeriesPoint {
    date: string;
    value: number;
    cost: number;
    liquidValue?: number;
    liquidCost?: number;
    stock?: number;
    crypto?: number;
    cash?: number;
}


export interface AnalyticsMetrics {
    totalReturn: { value: number; absolute: number };
    maxDrawdown: { value: number; date: Date | null };
    sharpeRatio: number;
    volatility: number;
    bestDay: { date: string; value: number; percent: number };
    worstDay: { date: string; value: number; percent: number };
    bestAsset?: { symbol: string | null; name: string; percent: number; value: number } | null;
    worstAsset?: { symbol: string | null; name: string; percent: number; value: number } | null;
    longestWinStreak: number;
    longestLossStreak: number;
    sparkline: { value: number }[];
    history: TimeSeriesPoint[];
    monthlyPnL?: { month: string; pnl: number }[];
}

export class AnalyticsEngine {

    static async generatePortfolioAnalysis(userId: string, range: string): Promise<AnalyticsMetrics> {
        // 1. Determine Date Range
        const endDate = new Date();
        let startDate = subDays(endDate, 30); // Default 1M
        let days = 30;

        if (range === '24H') { startDate = subDays(endDate, 1); days = 1; }
        else if (range === '7D' || range === '1W') { startDate = subDays(endDate, 7); days = 7; }
        else if (range === '30D' || range === '1M') { startDate = subDays(endDate, 30); days = 30; }
        else if (range === '3M') { startDate = subDays(endDate, 90); days = 90; }
        else if (range === 'YTD') { startDate = startOfYear(endDate); days = differenceInDays(endDate, startDate); }
        else if (range === '1Y') { startDate = subDays(endDate, 365); days = 365; }
        else if (range === 'ALL') { startDate = subDays(endDate, 365 * 2); days = 730; } // Limit ALL to 2 years

        // 2. Fetch Data
        const assets = await prisma.asset.findMany({ where: { userId } });
        console.log(`[Debug] Fetched ${assets.length} assets.`);
        assets.forEach(a => console.log(`[Debug] Asset: ${a.name} | Type: ${a.type} | Balance: ${a.balance} | Qty: ${a.quantity} | AvgBuy: ${a.averageBuyPrice}`));

        const transactions = await prisma.transaction.findMany({
            where: { asset: { userId } },
            orderBy: { date: 'asc' }
        });

        // 3. Prepare Historical Price Map & Exchange Rates
        const [priceMap, rates] = await Promise.all([
            (async () => {
                const map = new Map<string, Map<string, number>>();
                const investableAssets = assets.filter(a => a.type === 'STOCK' || a.type === 'CRYPTO');
                await Promise.all(investableAssets.map(async (asset) => {
                    if (!asset.symbol) return;
                    const history = await MarketDataService.getHistoricalPrices(
                        asset.symbol,
                        asset.type as 'STOCK' | 'CRYPTO',
                        subDays(startDate, 7), // Increased buffer to 7 days for holidays
                        endDate
                    );
                    const assetPriceMap = new Map<string, number>();
                    history.forEach(p => assetPriceMap.set(p.date, p.price));
                    map.set(asset.id, assetPriceMap);
                }));
                return map;
            })(),
            prisma.exchangeRate.findMany()
        ]);

        const rateMap = new Map<string, number>();
        rates.forEach(r => rateMap.set(r.currency, r.rate));
        // Default USD => 1
        rateMap.set('USD', 1);

        // 4b. Pre-calculate Initial States (Legacy/Manual Definitions)
        const assetInitialStates = new Map<string, { qty: number, cost: number }>();

        assets.forEach(asset => {
            const assetTx = transactions.filter(t => t.assetId === asset.id);
            let simQty = 0;
            let simCost = 0;

            assetTx.forEach(t => {
                if (t.type === 'BUY' || t.type === 'TRANSFER_IN') {
                    simCost += t.quantity * t.pricePerUnit;
                    simQty += t.quantity;
                } else if (t.type === 'SELL' || t.type === 'TRANSFER_OUT') {
                    if (simQty > 0) {
                        const unitCost = simCost / simQty;
                        simCost -= t.quantity * unitCost;
                    } else {
                        simCost -= t.quantity * (asset.averageBuyPrice || 0);
                    }
                    simQty -= t.quantity;
                }
            });

            let realQty = asset.quantity || 0;
            let realTotalCost = (asset.quantity || 0) * (asset.averageBuyPrice || 0);

            // For non-investable, quantity IS balance (implicitly)
            if (asset.type === 'BANK' || asset.type === 'REAL_ESTATE' || asset.type === 'CUSTOM') {
                realQty = asset.balance || 0;

                if (asset.type === 'REAL_ESTATE' || asset.type === 'CUSTOM') {
                    // For Property, averageBuyPrice is the TOTAL Purchase Price.
                    // So we do NOT multiply by quantity (balance).
                    // Logic: Cost = Purchase Price (if exists) OR Current Value (if no cost data)
                    realTotalCost = asset.averageBuyPrice || asset.balance || 0;
                } else {
                    // For Bank, cost is 1:1 (Cash is Cash)
                    realTotalCost = asset.balance || 0;
                }
            }

            let legacyQty = realQty - simQty;
            let legacyCost = realTotalCost - simCost;

            if (Math.abs(legacyQty) < 0.0001) legacyQty = 0;
            if (legacyQty > 0 && legacyCost < 0) {
                legacyCost = legacyQty * (asset.averageBuyPrice || 0);
            }

            assetInitialStates.set(asset.id, { qty: legacyQty, cost: legacyCost });
        });

        const getHoldingsOnDate = (date: Date) => {
            const holdings = new Map<string, { qty: number, cost: number }>();
            assets.forEach(a => {
                const init = assetInitialStates.get(a.id) || { qty: 0, cost: 0 };
                holdings.set(a.id, { ...init });
            });

            transactions.filter(t => isBefore(new Date(t.date), endOfDay(date))).forEach(t => {
                const current = holdings.get(t.assetId) || { qty: 0, cost: 0 };
                if (t.type === 'BUY' || t.type === 'TRANSFER_IN') {
                    const totalCost = (current.qty * current.cost) + (t.quantity * t.pricePerUnit);
                    current.qty += t.quantity;
                    if (current.qty > 0) current.cost = totalCost / current.qty;
                } else if (t.type === 'SELL' || t.type === 'TRANSFER_OUT') {
                    const unitCost = current.qty > 0 ? (current.cost / current.qty) : 0;
                    current.qty -= t.quantity;
                    current.cost -= t.quantity * unitCost;
                }
                holdings.set(t.assetId, current);
            });
            return holdings;
        };

        const history: TimeSeriesPoint[] = [];
        let previousValue = 0;
        const dailyReturns: number[] = [];
        const lastKnownPrices = new Map<string, number>(); // State for carry-forward
        const monthlyMap = new Map<string, { start: number, end: number }>();

        for (let i = 0; i <= days; i++) {
            const currentDate = subDays(endDate, days - i);
            const dateStr = currentDate.toISOString().split('T')[0];
            const holdings = getHoldingsOnDate(currentDate);

            let dailyValue = 0;
            let dailyCost = 0;
            let dailyLiquidValue = 0;
            let dailyLiquidCost = 0;
            let dailyStockValue = 0;
            let dailyCryptoValue = 0;
            let dailyCashValue = 0;

            assets.forEach(asset => {
                const h = holdings.get(asset.id);
                if (!h || h.qty === 0) return;

                let price = 0;
                if (asset.type === 'BANK' || asset.type === 'REAL_ESTATE' || asset.type === 'CUSTOM') {
                    price = 1;
                } else {
                    const assetPrices = priceMap.get(asset.id);
                    // Standard Carry-Forward Logic:
                    // 1. Try to find exact price for this date
                    // 2. If not found (Weekend/Holiday), try to use the last valid price we saw in this loop
                    // 3. If still not found (Start of chart), try Cost Basis
                    // 4. Last resort: Current Price (only if relatively recent?) - Actually better to use 0 or Cost to avoid sawtooth

                    if (assetPrices?.has(dateStr)) {
                        price = assetPrices.get(dateStr)!;
                        lastKnownPrices.set(asset.id, price);
                    } else {
                        // Use last known price from previous iterations
                        price = lastKnownPrices.get(asset.id) || 0;

                        // If we are at the very start and have no last known price yet:
                        // Try to find ANY price before this date? Or just use Cost Basis?
                        // Using Current Price (lastPrice) here causes the "Sawtooth" if historical value << current value.
                        if (price === 0) {
                            // Fallback to Cost Basis for pre-history period. 
                            // This is "Book Value" approx. Better than "Future Value" (Current Price).
                            price = asset.averageBuyPrice || 0;

                            // If even cost is 0, then maybe we default to Current Price ONLY if we are close to today?
                            // But generally 0 or Cost is safer for history.
                            if (price === 0 && days - i < 7) {
                                // If within last 7 days, acceptable to use current price
                                price = asset.lastPrice || 0;
                            }
                        }
                    }
                }

                // Currency Conversion
                const rate = rateMap.get(asset.currency || 'USD') || 1;
                const valueInUSD = (h.qty * price) / rate;
                const costInUSD = h.cost / rate; // Assuming Cost is also tracked in native currency? 
                // Transaction PricePerUnit is input by user. If user inputs in Native, then YES.
                // If user inputs in USD, then NO.
                // Convention: All input fields follow Asset Currency. So yes, convert.

                dailyValue += valueInUSD;
                dailyCost += costInUSD;

                if (asset.type === 'STOCK') {
                    dailyStockValue += valueInUSD;
                } else if (asset.type === 'CRYPTO') {
                    dailyCryptoValue += valueInUSD;
                } else if (asset.type === 'BANK' || asset.type === 'REAL_ESTATE') {
                    dailyCashValue += valueInUSD;
                }

                if (asset.type === 'STOCK' || asset.type === 'CRYPTO' || asset.type === 'BANK') {
                    dailyLiquidValue += valueInUSD;
                    dailyLiquidCost += costInUSD;
                }
            });

            // Monthly Tracking
            const monthKey = dateStr.substring(0, 7); // YYYY-MM
            if (!monthlyMap.has(monthKey)) {
                monthlyMap.set(monthKey, { start: dailyValue, end: dailyValue });
            } else {
                const m = monthlyMap.get(monthKey)!;
                m.end = dailyValue;
                monthlyMap.set(monthKey, m);
            }

            history.push({
                date: dateStr,
                value: dailyValue,
                cost: dailyCost,
                liquidValue: dailyLiquidValue,
                liquidCost: dailyLiquidCost,
                stock: dailyStockValue,
                crypto: dailyCryptoValue,
                cash: dailyCashValue
            });

            if (previousValue > 0) {
                dailyReturns.push((dailyValue - previousValue) / previousValue);
            }
            previousValue = dailyValue;
        }

        // 5. Calculate Metrics
        const currentVal = history[history.length - 1]?.value || 0;
        const currentCost = history[history.length - 1]?.cost || 0;
        const totalReturnAbs = currentVal - currentCost;
        const totalReturnPct = currentCost > 0 ? (totalReturnAbs / currentCost) * 100 : 0;

        let peak = -Infinity;
        let maxDd = 0;
        let maxDdDate = null;

        history.forEach(p => {
            if (p.value > peak) peak = p.value;

            let dd = 0;
            if (peak > 0) {
                dd = (peak - p.value) / peak;
            }

            if (dd > maxDd) {
                maxDd = dd;
                maxDdDate = new Date(p.date as string);
            }
        });

        // Simplified Sharpe
        const meanReturn = dailyReturns.reduce((a, b) => a + b, 0) / dailyReturns.length || 0;
        const variance = dailyReturns.reduce((a, b) => a + Math.pow(b - meanReturn, 2), 0) / dailyReturns.length || 0;
        const stdDev = Math.sqrt(variance);
        const dailySharpe = stdDev > 0 ? meanReturn / stdDev : 0;
        const annualizedSharpe = dailySharpe * Math.sqrt(252);

        // Best/Worst Days
        let bestDay = { date: '', value: 0, percent: 0 };
        let worstDay = { date: '', value: 0, percent: 0 };

        if (dailyReturns.length > 0) {
            bestDay = { date: '', value: 0, percent: -Infinity };
            worstDay = { date: '', value: 0, percent: Infinity };

            dailyReturns.forEach((ret, idx) => {
                if (ret > bestDay.percent) bestDay = { date: history[idx + 1].date, value: 0, percent: ret * 100 };
                if (ret < worstDay.percent) worstDay = { date: history[idx + 1].date, value: 0, percent: ret * 100 };
            });

            // Fallback if still Infinity (e.g. no valid comparisons happened)
            if (bestDay.percent === -Infinity) bestDay.percent = 0;
            if (worstDay.percent === Infinity) worstDay.percent = 0;
        }

        // 6. Calculate Best/Worst Assets (Price Performance over Range)
        // Filter liquid assets that have price history
        const assetPerformances = assets
            .filter(a => (a.type === 'STOCK' || a.type === 'CRYPTO') && a.symbol)
            .map(asset => {
                const prices = priceMap.get(asset.id);
                if (!prices) return null;

                // Get start and end prices for the period
                // Note: priceMap keys are ISO dates YYYY-MM-DD
                const endPrice = prices.get(endDate.toISOString().split('T')[0]) || asset.lastPrice || 0;
                // Find first available price in range
                let startPrice = 0;

                // 1. Try to find price within the exact window moving backwards from start date
                for (let i = days; i >= 0; i--) {
                    const d = subDays(endDate, i).toISOString().split('T')[0];
                    if (prices.has(d)) {
                        startPrice = prices.get(d) || 0;
                        break;
                    }
                }

                // 2. Fallback: If no price found in theoretical window (rare, but possible with gaps),
                // take the earliest available price in the entire fetched map
                if (startPrice === 0 && prices.size > 0) {
                    const dates = Array.from(prices.keys()).sort();

                    if (dates.length > 0) {
                        startPrice = prices.get(dates[0]) || 0;
                    }
                }

                if (startPrice === 0) {
                    return null;
                }

                const change = endPrice - startPrice;
                const percent = (change / startPrice) * 100;

                // console.log(`[Debug] ${ asset.symbol } Perf: ${ percent.toFixed(2) }% (Start: ${ startPrice }, End: ${ endPrice })`);

                return {
                    symbol: asset.symbol,
                    name: asset.name,
                    percent,
                    value: change
                };
            })
            .filter((p): p is NonNullable<typeof p> => p !== null)
            .sort((a, b) => b.percent - a.percent);

        const bestAsset = assetPerformances.length > 0 ? assetPerformances[0] : null;
        const worstAsset = assetPerformances.length > 0 ? assetPerformances[assetPerformances.length - 1] : null;

        // Monthly PnL Format
        // Since transaction history is likely missing for manual users, 
        // PnL is purely "EndValue - StartValue" (Unrealized + Realized mixed).
        // This is correct for "Portfolio Growth".
        const monthlyPnL = Array.from(monthlyMap.entries()).map(([month, data]) => ({
            month,
            pnl: data.end - data.start
        })).sort((a, b) => a.month.localeCompare(b.month));

        return {
            totalReturn: { value: parseFloat(totalReturnPct.toFixed(2)), absolute: totalReturnAbs },
            maxDrawdown: { value: parseFloat((maxDd * 100).toFixed(2)), date: maxDdDate as any },
            sharpeRatio: parseFloat(annualizedSharpe.toFixed(2)),
            volatility: parseFloat((stdDev * Math.sqrt(252) * 100).toFixed(2)),
            bestDay,
            worstDay,
            bestAsset,
            worstAsset,
            longestWinStreak: 0,
            longestLossStreak: 0,
            sparkline: history.map(h => ({ value: h.value })),
            history,
            monthlyPnL // Exposed for API
        };
    }
}
