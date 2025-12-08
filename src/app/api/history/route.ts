import { NextResponse } from 'next/server';
import { getHistory, recordDailyHistoryWithTotal } from '@/lib/history';
import { getAuthenticatedUser } from '@/lib/auth-helper';

export async function GET(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1M';



        const historyData = await getHistory(user.id, range);

        // Calculate return (simple implementation)
        let returnPct = 0;
        let returnVal = 0;

        if (historyData.length > 0) {
            const firstValue = historyData[0].value;
            const lastValue = historyData[historyData.length - 1].value;

            if (firstValue !== 0) {
                returnVal = lastValue - firstValue;
                returnPct = (returnVal / firstValue) * 100;
            }
        }

        return NextResponse.json({
            historyData,
            returnPct: parseFloat(returnPct.toFixed(2)),
            returnVal: parseFloat(returnVal.toFixed(2))
        });
    } catch (error) {
        console.error("Failed to fetch history:", error);
        return NextResponse.json({ error: "Failed to fetch history" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getAuthenticatedUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { value } = body;

        if (typeof value !== 'number') {
            return NextResponse.json({ error: 'Invalid value' }, { status: 400 });
        }

        const today = new Date().toISOString().split('T')[0];

        // Import prisma dynamically or assume it's available in scope if imported at top
        // Checking imports: used getHistory from @/lib/history which uses prisma.
        // Needs prisma import here or use recordDailyHistoryWithTotal approach?
        // Better to use prisma directly here for simplicity if I import it.
        // Wait, current file does NOT import prisma. It imports helper functions.
        // I should add prisma import to top as well.

        const { prisma } = await import('@/lib/prisma');

        await prisma.history.upsert({
            where: {
                userId_date: {
                    userId: user.id,
                    date: today
                }
            },
            update: { value },
            create: {
                userId: user.id,
                date: today,
                value
            }
        });

        return NextResponse.json({ success: true, value });

    } catch (error) {
        console.error("Failed to update history:", error);
        return NextResponse.json({ error: "Failed to update history" }, { status: 500 });
    }
}
