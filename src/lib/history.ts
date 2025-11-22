import { getDb } from "./db";
import { Asset } from "@/types";

export async function recordDailyHistory() {
    const db = await getDb();
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD

    // Calculate total net worth
    const totalValue = db.data.assets.reduce((sum: number, asset: Asset) => {
        if (asset.type === 'BANK') {
            return sum + asset.balance;
        }
        return sum + (asset.totalValue || 0);
    }, 0);

    // Check if entry exists for today
    const existingIndex = db.data.history.findIndex(h => h.date === today);

    if (existingIndex >= 0) {
        // Update existing entry
        db.data.history[existingIndex].value = totalValue;
    } else {
        // Add new entry
        db.data.history.push({
            date: today,
            value: totalValue
        });
    }

    // Sort history by date
    db.data.history.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    await db.write();
    console.log(`Recorded history for ${today}: $${totalValue}`);
}

export async function getHistory(range: string = '1M') {
    const db = await getDb();
    const history = db.data.history;

    // Filter based on range (simplified logic)
    const now = new Date();
    let startDate = new Date();

    switch (range) {
        case '1W':
            startDate.setDate(now.getDate() - 7);
            break;
        case '1M':
            startDate.setMonth(now.getMonth() - 1);
            break;
        case '3M':
            startDate.setMonth(now.getMonth() - 3);
            break;
        case '1Y':
            startDate.setFullYear(now.getFullYear() - 1);
            break;
        case 'ALL':
            startDate = new Date(0); // Beginning of time
            break;
        default:
            startDate.setMonth(now.getMonth() - 1);
    }

    return history.filter(h => new Date(h.date) >= startDate);
}
