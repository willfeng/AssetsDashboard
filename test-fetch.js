async function test() {
    const symbol = 'NVDA';
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;

    console.log(`Fetching ${url}...`);
    try {
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        const price = data.chart.result[0].meta.regularMarketPrice;
        console.log("Success!");
        console.log("Price:", price);
    } catch (error) {
        console.error("Error:", error);
    }
}

test();
