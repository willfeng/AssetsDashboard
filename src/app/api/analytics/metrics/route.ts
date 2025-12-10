
import { NextResponse } from 'next/server';
import { getAuthenticatedUser } from '@/lib/auth-helper';
import { AnalyticsEngine } from '@/lib/analytics-engine';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1Y';
        const includeBenchmark = searchParams.get('benchmark') === 'true';

        console.log(`[Analytics API] Generating report for user ${user.id} (Range: ${range}, Benchmark: ${includeBenchmark})`);

        const metrics = await AnalyticsEngine.generatePortfolioAnalysis(user.id, range);

        return NextResponse.json(metrics);

    } catch (error: any) {
        console.error("Analytics API Error:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
