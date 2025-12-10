

async function testYahoo() {
    const YahooFinance = (await import('yahoo-finance2')).default;
    // @ts-ignore
    const yahooFinance = new YahooFinance();


    const symbol = 'AAPL'; // Test with a known liquid stock
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30); // Last 30 days

    console.log(`Testing Yahoo Finance for ${symbol}...`);
    console.log(`Range: ${startDate.toISOString()} -> ${endDate.toISOString()}`);

    try {
        // Method 1: quote (Current Price)
        console.log("\n1. Testing 'quote' (Current Price)...");
        const quote = await yahooFinance.quote(symbol);
        console.log("Success! Price:", quote.regularMarketPrice);

        // Method 2: historical (History)
        console.log("\n2. Testing 'historical' (History Candles)...");
        const queryOptions = {
            period1: startDate, // Date object or string
            period2: endDate,
            interval: '1d' as const
        };

        const history = await yahooFinance.historical(symbol, queryOptions);
        console.log(`Success! Retrieved ${history.length} candles.`);
        if (history.length > 0) {
            console.log("First candle:", history[0]);
            console.log("Last candle:", history[history.length - 1]);
        }

    } catch (error: any) {
        console.error("\n❌ Yahoo Finance Error:");
        console.error(error.message);
        if (error.result) console.error("Partial Result:", error.result);
    }
}

testYahoo();
