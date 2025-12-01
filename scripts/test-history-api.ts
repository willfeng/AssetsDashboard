
async function testHistoryApi() {
    try {
        const response = await fetch('http://localhost:3000/api/history?range=1M', {
            headers: {
                'Cookie': '' // Browser will send cookies automatically
            }
        });

        console.log('Status:', response.status);
        console.log('Headers:', Object.fromEntries(response.headers.entries()));

        const text = await response.text();
        console.log('Raw response:', text);

        try {
            const json = JSON.parse(text);
            console.log('Parsed JSON:', json);
        } catch (e) {
            console.error('Failed to parse JSON:', e);
        }
    } catch (error) {
        console.error('Fetch error:', error);
    }
}

testHistoryApi();
