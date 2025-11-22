import { NextResponse } from 'next/server';
import { getHistory } from '@/lib/history';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const range = searchParams.get('range') || '1M';

        const historyData = await getHistory(range);

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
