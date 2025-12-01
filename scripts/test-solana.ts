
import { Connection, PublicKey, LAMPORTS_PER_SOL } from "@solana/web3.js";

const ENDPOINTS = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-api.projectserum.com",
    "https://rpc.ankr.com/solana",
];

async function main() {
    const address = "GH9xi3L15J6udZBdsGt74i6kGzrJKn9BACKJD7oTV1Y4";
    console.log(`Testing Solana endpoints for address: ${address}`);

    for (const endpoint of ENDPOINTS) {
        console.log(`\n--- Testing ${endpoint} ---`);
        try {
            const connection = new Connection(endpoint, "confirmed");
            const publicKey = new PublicKey(address);
            const balance = await connection.getBalance(publicKey);
            console.log(`Success! Balance: ${balance / LAMPORTS_PER_SOL} SOL`);
        } catch (error: any) {
            console.error(`Failed: ${error.message}`);
        }
    }
}

main();
