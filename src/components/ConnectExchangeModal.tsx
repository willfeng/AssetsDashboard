"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";

interface ConnectExchangeModalProps {
    onConnected: () => void;
}

export default function ConnectExchangeModal({ onConnected }: ConnectExchangeModalProps) {
    const [open, setOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [apiKey, setApiKey] = useState("");
    const [apiSecret, setApiSecret] = useState("");

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            // 1. Save Integration
            const saveRes = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: 'BINANCE',
                    apiKey,
                    apiSecret
                })
            });

            if (!saveRes.ok) {
                const errorData = await saveRes.json();
                throw new Error(errorData.error || "Failed to save keys");
            }

            // 2. Trigger Sync
            const syncRes = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ provider: 'BINANCE' })
            });

            if (!syncRes.ok) throw new Error("Failed to sync assets");

            const data = await syncRes.json();
            alert(`Successfully synced ${data.syncedCount} assets!`);

            setOpen(false);
            setApiKey("");
            setApiSecret("");
            onConnected();

        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" className="gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-link"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" /><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" /></svg>
                    Connect Binance
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Connect Binance Exchange</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="grid gap-4 py-4">
                    <div className="grid gap-2">
                        <Label htmlFor="apiKey">API Key</Label>
                        <Input
                            id="apiKey"
                            value={apiKey}
                            onChange={(e) => setApiKey(e.target.value)}
                            placeholder="Enter your Binance API Key"
                            required
                        />
                    </div>
                    <div className="grid gap-2">
                        <Label htmlFor="apiSecret">API Secret</Label>
                        <Input
                            id="apiSecret"
                            type="password"
                            value={apiSecret}
                            onChange={(e) => setApiSecret(e.target.value)}
                            placeholder="Enter your Binance API Secret"
                            required
                        />
                    </div>
                    <div className="text-xs text-muted-foreground">
                        Note: We only require <strong>Read-Only</strong> permissions. Please do not enable trading or withdrawal permissions on your API key.
                    </div>
                    <Button type="submit" disabled={isLoading}>
                        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isLoading ? "Syncing..." : "Connect & Sync"}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
}
