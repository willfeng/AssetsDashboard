import { NextResponse } from 'next/server';
import { currentUser } from '@clerk/nextjs/server';
import { plaidClient } from '@/lib/plaid';
import { CountryCode, Products } from 'plaid';

export async function POST() {
    try {
        const user = await currentUser();
        if (!user) {
            return new NextResponse('Unauthorized', { status: 401 });
        }

        const clientUserId = user.id;

        // Use Balance/Auth product for "Balance Only" mode (Cheapest)
        // Transactions product is intentionally omitted
        const request = {
            user: {
                client_user_id: clientUserId,
            },
            client_name: 'Assets Dashboard',
            products: [Products.Auth], // 'auth' usually includes basic balance info
            country_codes: [CountryCode.Us],
            language: 'en',
        };

        const createTokenResponse = await plaidClient.linkTokenCreate(request);

        return NextResponse.json(createTokenResponse.data);
    } catch (error: any) {
        console.error('Error creating link token:', error.response?.data || error);
        return NextResponse.json(
            { error: error.message || 'Internal Server Error', details: error.response?.data },
            { status: 500 }
        );
    }
}
