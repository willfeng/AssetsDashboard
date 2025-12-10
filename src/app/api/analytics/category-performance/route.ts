
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { AnalyticsEngine } from '@/lib/analytics-engine'; // We'll rely on the engine

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Parse Range
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1Y';

        // Reuse the powerful engine
        const analysis = await AnalyticsEngine.generatePortfolioAnalysis(user.id, range);

        // Extract category history
        // Data format expected by Chart:
        // dates: string[]
        // categories: { Stocks: number[], Crypto: number[], Cash: number[] }

        const dates = analysis.history.map(h => h.date);
        const stocks = analysis.history.map(h => h.stock || 0); // Need to update interface to allow these
        const crypto = analysis.history.map(h => h.crypto || 0);
        const cash = analysis.history.map(h => h.cash || 0);

        return NextResponse.json({
            dates,
            categories: {
                Stocks: stocks,
                Crypto: crypto,
                Cash: cash
            }
        });
    } catch (error) {
        console.error("Category API Error:", error);
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
