import { NextResponse } from 'next/server';
import { MOCK_HISTORY } from '@/lib/mockData';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get('range') || '1Y';

    let historyData: { date: string; value: number }[] = [];
    let returnPct = "+12.5%";
    let returnVal = "+$156,250.00";

    // Logic moved from frontend to backend
    switch (range) {
        case "1W":
            const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
            historyData = days.map((d, i) => ({
                date: d,
                value: 1250000 + Math.random() * 50000 - 25000 + (i * 5000)
            }));
            returnPct = "+1.2%";
            returnVal = "+$15,000.00";
            break;
        case "1M":
            for (let i = 1; i <= 30; i += 2) {
                historyData.push({
                    date: `Nov ${i}`,
                    value: 1200000 + Math.random() * 100000 + (i * 2000)
                });
            }
            returnPct = "+4.5%";
            returnVal = "+$56,250.00";
            break;
        case "1Y":
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            historyData = months.map((m, i) => ({
                date: m,
                value: 1100000 + (i * 15000) + Math.random() * 20000
            }));
            returnPct = "+12.5%";
            returnVal = "+$156,250.00";
            break;
        case "3Y":
            const quarters = ["2021", "2022", "2023"];
            historyData = quarters.map((y, i) => ({
                date: y,
                value: 900000 + (i * 150000) + Math.random() * 50000
            }));
            returnPct = "+35.8%";
            returnVal = "+$450,000.00";
            break;
        case "5Y":
            const years = ["2019", "2020", "2021", "2022", "2023"];
            historyData = years.map((y, i) => ({
                date: y,
                value: 600000 + (i * 150000) + Math.random() * 50000
            }));
            returnPct = "+68.2%";
            returnVal = "+$850,000.00";
            break;
        default:
            historyData = MOCK_HISTORY;
    }

    return NextResponse.json({ historyData, returnPct, returnVal });
}
