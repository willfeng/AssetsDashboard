
async function testImport() {
    console.log("Testing TronWeb import...");
    try {
        // @ts-ignore
        const imported = await import('tronweb');
        console.log("Import keys:", Object.keys(imported));
        console.log("Import default keys:", imported.default ? Object.keys(imported.default) : "No default");

        const TronWeb = imported.TronWeb || imported.default?.TronWeb || imported.default;
        console.log("Resolved TronWeb type:", typeof TronWeb);

        if (typeof TronWeb === 'function') {
            try {
                const instance = new TronWeb({ fullHost: 'https://api.trongrid.io' });
                console.log("Success! Created instance.");
            } catch (e) {
                console.error("Instantiation failed:", e);
            }
        } else {
            console.log("TronWeb is not a function/class");
        }

    } catch (e) {
        console.error("Import failed:", e);
    }
}

testImport();
