import { JSONFilePreset } from 'lowdb/node'
import { Asset, HistoricalDataPoint } from '@/types'

// Define the schema of our database
interface Data {
    assets: Asset[]
    history: HistoricalDataPoint[]
}

// Initialize the database with default data
const defaultData: Data = { assets: [], history: [] }

// Create a singleton instance
// We use a function to ensure we get the db instance, 
// as lowdb is async in some versions/presets, but JSONFilePreset is convenient.
// However, for Next.js API routes, we need to ensure we don't re-initialize it constantly if possible,
// or just use it directly since it's lightweight.

export const getDb = async () => {
    const db = await JSONFilePreset<Data>('db.json', defaultData)
    if (!db.data.history) {
        db.data.history = []
        await db.write()
    }
    return db
}
