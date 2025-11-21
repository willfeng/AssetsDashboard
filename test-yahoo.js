const pkg = require('yahoo-finance2');
console.log("Keys:", Object.keys(pkg));
if (pkg.default) console.log("Default keys:", Object.keys(pkg.default));
console.log("pkg.default type:", typeof pkg.default);
console.log("pkg type:", typeof pkg);

try {
    const yf = pkg.default || pkg;
    console.log("Trying to quote...");
    yf.quote('NVDA').then(res => console.log(res)).catch(err => console.error(err));
} catch (e) {
    console.error("Sync error:", e);
}
