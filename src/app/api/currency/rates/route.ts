import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Fallback rates in case API fails and DB is empty
const FALLBACK_RATES: Record<string, number> = {
    "USD": 1,
    "HKD": 7.82,
    "CNY": 7.15,
    "EUR": 0.92,
    "GBP": 0.79,
    "JPY": 150.5,
    "AUD": 1.53,
    "CAD": 1.36,
    "SGD": 1.34,
};

export async function GET() {
    try {
        // 1. Check Database for existing rates
        const dbRates = await prisma.exchangeRate.findMany();

        const ratesMap: Record<string, number> = {};
        let needsUpdate = false;
        const now = new Date();

        // Check if we have rates and if they are fresh (< 24 hours)
        if (dbRates.length > 0) {
            let allFresh = true;
            for (const rate of dbRates) {
                ratesMap[rate.currency] = rate.rate;
                const diffHours = (now.getTime() - new Date(rate.updatedAt).getTime()) / (1000 * 60 * 60);
                if (diffHours > 24) {
                    allFresh = false;
                }
            }

            // If we have data and it's fresh, return it
            if (allFresh && Object.keys(ratesMap).length >= Object.keys(FALLBACK_RATES).length - 1) { // -1 for USD
                console.log("Returning cached exchange rates from DB");
                return NextResponse.json(ratesMap);
            }
            needsUpdate = true;
        } else {
            needsUpdate = true;
        }

        // 2. Fetch from External API if needed
        if (needsUpdate) {
            console.log("Fetching fresh exchange rates from API...");
            try {
                const res = await fetch('https://api.exchangerate-api.com/v4/latest/USD');
                if (res.ok) {
                    const data = await res.json();
                    const apiRates = data.rates;

                    // Update DB
                    for (const [currency, rate] of Object.entries(apiRates)) {
                        // Only store currencies we care about to save space, or store all?
                        // Let's store the ones we support + major ones
                        if (FALLBACK_RATES[currency] || ["CHF", "NZD"].includes(currency)) {
                            await prisma.exchangeRate.upsert({
                                where: { currency },
                                update: { rate: Number(rate) },
                                create: { currency, rate: Number(rate) }
                            });
                            ratesMap[currency] = Number(rate);
                        }
                    }
                    console.log("Exchange rates updated in DB");
                } else {
                    console.error("Failed to fetch rates from API, using fallback/cache");
                    // If API fails, use fallback if cache is empty, otherwise keep using cache (even if stale)
                    if (Object.keys(ratesMap).length === 0) {
                        Object.assign(ratesMap, FALLBACK_RATES);
                    }
                }
            } catch (error) {
                console.error("Error fetching rates:", error);
                if (Object.keys(ratesMap).length === 0) {
                    Object.assign(ratesMap, FALLBACK_RATES);
                }
            }
        }

        // Ensure USD is always 1
        ratesMap["USD"] = 1;

        return NextResponse.json(ratesMap);

    } catch (error) {
        console.error("Error in rates API:", error);
        return NextResponse.json(FALLBACK_RATES, { status: 500 });
    }
}
