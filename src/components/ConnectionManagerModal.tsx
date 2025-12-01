
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, Trash2, RefreshCw, Wallet, Link as LinkIcon } from "lucide-react";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Integration {
    id: string;
    provider: string;
    name: string | null;
    isActive: boolean;
    lastSync: string | null;
}

interface ConnectionManagerModalProps {
    onChanged: () => void; // Triggered when connections change or sync happens
}

const PROVIDERS = [
    { id: "BINANCE", name: "Binance", type: "EXCHANGE", icon: "B" },
    { id: "OKX", name: "OKX", type: "EXCHANGE", icon: "O" },
    { id: "WALLET_ETH", name: "Ethereum Wallet", type: "WALLET", icon: "Ξ" },
    { id: "WALLET_BTC", name: "Bitcoin Wallet", type: "WALLET", icon: "₿" },
    { id: "WALLET_SOL", name: "Solana Wallet", type: "WALLET", icon: "◎" },
    { id: "WALLET_TRON", name: "Tron Wallet", type: "WALLET", icon: "T" },
];

export function ConnectionManagerModal({ onChanged }: ConnectionManagerModalProps) {
    const [open, setOpen] = useState(false);
    const [activeTab, setActiveTab] = useState("list"); // 'list' | 'add'
    const [integrations, setIntegrations] = useState<Integration[]>([]);
    const [loading, setLoading] = useState(false);

    // Form State
    const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
    const [formData, setFormData] = useState({ name: "", apiKey: "", apiSecret: "", passphrase: "" });
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    // Delete Dialog State
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState(false);

    // Sync State
    const [syncingId, setSyncingId] = useState<string | null>(null);

    // Fetch Integrations
    const fetchIntegrations = async (showLoading = true) => {
        if (showLoading) setLoading(true);
        try {
            const res = await fetch('/api/integrations');
            if (res.ok) {
                const data = await res.json();
                setIntegrations(data);
            }
        } catch (e) {
            console.error("Failed to fetch integrations", e);
        } finally {
            if (showLoading) setLoading(false);
        }
    };

    useEffect(() => {
        if (open) {
            fetchIntegrations();
            setActiveTab("list");
            resetForm();
        }
    }, [open]);

    const resetForm = () => {
        setSelectedProvider(null);
        setFormData({ name: "", apiKey: "", apiSecret: "", passphrase: "" });
        setError("");
        setSubmitting(false);
    };

    const handleConnect = async () => {
        if (!selectedProvider) return;
        if (!formData.apiKey) {
            setError(selectedProvider.includes("WALLET") ? "Address is required" : "API Key is required");
            return;
        }
        if ((selectedProvider === "BINANCE" || selectedProvider === "OKX") && !formData.apiSecret) {
            setError("API Secret is required");
            return;
        }
        if (selectedProvider === "OKX" && !formData.passphrase) {
            setError("Passphrase is required for OKX");
            return;
        }

        // Basic Validation
        if (selectedProvider === "WALLET_ETH") {
            if (!/^0x[a-fA-F0-9]{40}$/.test(formData.apiKey)) {
                setError("Invalid Ethereum address. Must be a 42-character hex string starting with 0x.");
                return;
            }
        }

        if (selectedProvider === "WALLET_BTC") {
            if (formData.apiKey.length < 26 || formData.apiKey.length > 62) {
                setError("Invalid Bitcoin address length.");
                return;
            }
        }

        if (selectedProvider === "WALLET_SOL") {
            // Base58 check is complex without lib, just check length roughly (32-44 chars)
            if (formData.apiKey.length < 32 || formData.apiKey.length > 44) {
                setError("Invalid Solana address length.");
                return;
            }
        }

        if (selectedProvider === "WALLET_TRON") {
            if (!formData.apiKey.startsWith("T") || formData.apiKey.length !== 34) {
                setError("Invalid Tron address. Must start with 'T' and be 34 characters long.");
                return;
            }
        }

        setSubmitting(true);
        setError("");

        try {
            // Prepare extraParams for OKX
            let extraParams = null;
            if (selectedProvider === "OKX") {
                extraParams = JSON.stringify({ passphrase: formData.passphrase });
            }

            const res = await fetch('/api/integrations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    provider: selectedProvider,
                    name: formData.name,
                    apiKey: formData.apiKey,
                    apiSecret: formData.apiSecret || null,
                    extraParams: extraParams,
                }),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to connect");
            }

            // Success - refresh list first so the new item appears
            await fetchIntegrations(false);
            setActiveTab("list");
            resetForm();

            // Trigger immediate sync
            if (data.id) {
                try {
                    await handleSync(data.id);
                } catch (syncError: any) {
                    alert(`Connection saved, but initial sync failed: ${syncError.message}`);
                }
            }

            onChanged(); // Notify parent to refresh assets

        } catch (err: any) {
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await fetch(`/api/integrations?id=${deleteId}`, { method: 'DELETE' });
            await fetchIntegrations(false);
            onChanged();
        } catch (e) {
            console.error("Failed to delete", e);
            alert("Failed to delete integration");
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const handleSync = async (id: string) => {
        setSyncingId(id);
        try {
            const res = await fetch('/api/integrations/sync', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ integrationId: id })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Sync failed");
            }

            await fetchIntegrations(false); // Update lastSync time
            onChanged(); // Refresh dashboard
        } catch (e: any) {
            console.error("Sync failed", e);
            alert(`Sync Failed: ${e.message}`);
            throw e; // Re-throw so handleConnect can catch it if needed
        } finally {
            setSyncingId(null);
        }
    };

    const getProviderInfo = (code: string) => PROVIDERS.find(p => p.id === code);

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                        <LinkIcon className="h-4 w-4" />
                        Manage Connections
                    </Button>
                </DialogTrigger>
                <DialogContent className="w-full sm:max-w-[600px] max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Connection Manager</DialogTitle>
                        <DialogDescription>
                            Manage your exchanges and crypto wallets.
                        </DialogDescription>
                    </DialogHeader>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="list">My Connections</TabsTrigger>
                            <TabsTrigger value="add">Add New</TabsTrigger>
                        </TabsList>

                        {/* LIST TAB */}
                        <TabsContent value="list" className="space-y-4 mt-4">
                            {loading ? (
                                <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>
                            ) : integrations.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    No connections yet. Click "Add New" to get started.
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {integrations.map((item) => {
                                        const info = getProviderInfo(item.provider);
                                        return (
                                            <div key={item.id} className="flex items-center justify-between p-4 border rounded-lg bg-card hover:bg-accent/50 transition-colors">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-lg font-bold">
                                                        {info?.icon || "?"}
                                                    </div>
                                                    <div>
                                                        <h4 className="font-medium">{item.name || info?.name || item.provider}</h4>
                                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                                            <Badge variant="outline" className="text-[10px] h-5">{item.provider}</Badge>
                                                            {item.lastSync ? (
                                                                <span>Synced: {new Date(item.lastSync).toLocaleTimeString()}</span>
                                                            ) : (
                                                                <span>Not synced yet</span>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => handleSync(item.id)}
                                                        title="Sync Now"
                                                        disabled={syncingId === item.id}
                                                    >
                                                        {syncingId === item.id ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <RefreshCw className="h-4 w-4" />
                                                        )}
                                                    </Button>
                                                    <Button variant="ghost" size="icon" onClick={() => setDeleteId(item.id)} className="text-destructive hover:text-destructive" title="Disconnect">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </TabsContent>

                        {/* ADD TAB */}
                        <TabsContent value="add" className="mt-4">
                            {!selectedProvider ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {PROVIDERS.map((p) => (
                                        <Card key={p.id} className="cursor-pointer hover:border-primary transition-all" onClick={() => setSelectedProvider(p.id)}>
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium">
                                                    {p.name}
                                                </CardTitle>
                                                {p.type === "WALLET" ? <Wallet className="h-4 w-4 text-muted-foreground" /> : <RefreshCw className="h-4 w-4 text-muted-foreground" />}
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-2xl font-bold">{p.icon}</div>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {p.type === "WALLET" ? "Track public address" : "Sync via API Key"}
                                                </p>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="space-y-4 border p-4 rounded-lg">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium flex items-center gap-2">
                                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 mr-2" onClick={() => setSelectedProvider(null)}>←</Button>
                                            Connect {getProviderInfo(selectedProvider)?.name}
                                        </h3>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="space-y-1">
                                            <Label>Name (Optional)</Label>
                                            <Input
                                                placeholder="e.g. My Main Wallet"
                                                value={formData.name}
                                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            />
                                        </div>

                                        <div className="space-y-1">
                                            <Label>{selectedProvider.includes("WALLET") ? "Wallet Address" : "API Key"}</Label>
                                            <Input
                                                placeholder={
                                                    selectedProvider === "WALLET_ETH" ? "0x..." :
                                                        selectedProvider === "WALLET_BTC" ? "bc1..." :
                                                            selectedProvider === "WALLET_SOL" ? "Solana Address" :
                                                                selectedProvider === "WALLET_TRON" ? "T..." :
                                                                    "API Key"
                                                }
                                                value={formData.apiKey}
                                                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                                            />
                                            {selectedProvider.includes("WALLET") && (
                                                <p className="text-xs text-muted-foreground text-yellow-600">
                                                    ⚠️ Only enter your PUBLIC address. Never enter your private key.
                                                </p>
                                            )}
                                        </div>

                                        {(selectedProvider === "BINANCE" || selectedProvider === "OKX") && (
                                            <div className="space-y-1">
                                                <Label>API Secret</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="Secret Key"
                                                    value={formData.apiSecret}
                                                    onChange={(e) => setFormData({ ...formData, apiSecret: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {selectedProvider === "OKX" && (
                                            <div className="space-y-1">
                                                <Label>Passphrase</Label>
                                                <Input
                                                    type="password"
                                                    placeholder="API Passphrase"
                                                    value={formData.passphrase}
                                                    onChange={(e) => setFormData({ ...formData, passphrase: e.target.value })}
                                                />
                                            </div>
                                        )}

                                        {error && <p className="text-sm text-destructive">{error}</p>}

                                        <div className="flex justify-end gap-2 mt-4">
                                            <Button variant="ghost" onClick={() => setSelectedProvider(null)}>Cancel</Button>
                                            <Button onClick={handleConnect} disabled={submitting}>
                                                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                                Connect & Sync
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </TabsContent>
                    </Tabs>
                </DialogContent>
            </Dialog>

            <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Disconnect Integration?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This will remove the connection and <strong>delete all associated assets</strong> from your dashboard. This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                confirmDelete();
                            }}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={deleting}
                        >
                            {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Disconnect & Delete"}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
