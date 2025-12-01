
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1M';

        // Calculate start date based on range
        const now = new Date();
        let startDate = new Date();
        switch (range) {
            case '1W': startDate.setDate(now.getDate() - 7); break;
            case '1M': startDate.setMonth(now.getMonth() - 1); break;
            case '3M': startDate.setMonth(now.getMonth() - 3); break;
            case '1Y': startDate.setFullYear(now.getFullYear() - 1); break;
            case 'ALL': startDate = new Date(0); break;
            default: startDate.setMonth(now.getMonth() - 1);
        }
        const startDateStr = startDate.toISOString().split('T')[0];

        // Fetch snapshots for all user assets
        const assets = await prisma.asset.findMany({
            where: { userId: user.id },
            include: {
                snapshots: {
                    where: { date: { gte: startDateStr } },
                    orderBy: { date: 'asc' }
                }
            }
        });

        // Aggregate daily values
        const dailyTotals: Record<string, number> = {};
        assets.forEach(asset => {
            asset.snapshots.forEach(snapshot => {
                dailyTotals[snapshot.date] = (dailyTotals[snapshot.date] || 0) + snapshot.value;
            });
        });

        // Convert to array and calculate P&L
        const history = Object.entries(dailyTotals)
            .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
            .map(([date, value]) => ({ date, value }));

        // Calculate P&L (Change from start)
        let totalPnL = 0;
        let totalPnLPct = 0;

        if (history.length > 0) {
            const startValue = history[0].value;
            const endValue = history[history.length - 1].value;
            totalPnL = endValue - startValue;
            totalPnLPct = startValue > 0 ? (totalPnL / startValue) * 100 : 0;
        }

        return NextResponse.json({
            history,
            totalPnL,
            totalPnLPct
        });

    } catch (error: any) {
        console.error("Error fetching P&L:", error);
        return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
    }
}
