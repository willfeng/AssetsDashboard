
import { NextResponse } from 'next/server';

import { getAuthenticatedUser } from '@/lib/auth-helper';
import { AnalyticsEngine } from '@/lib/analytics-engine';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getAuthenticatedUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // For Monthly PL, we typically want a 1 Year view or All Time. 
        // Let's default to '1Y' to get the last 12 months.
        const analysis = await AnalyticsEngine.generatePortfolioAnalysis(user.id, '1Y');

        return NextResponse.json(analysis.monthlyPnL || []);
    } catch (error) {
        return NextResponse.json({ error: 'Error' }, { status: 500 });
    }
}
