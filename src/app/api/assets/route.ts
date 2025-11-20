import { NextResponse } from 'next/server';
import { MOCK_ASSETS } from '@/lib/mockData';

export async function GET() {
    // In a real application, this would fetch from a database
    return NextResponse.json(MOCK_ASSETS);
}
