
import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { DollarSign, Loader2, PlusCircle, MinusCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import { Asset } from "@/types"
import { useToast } from "@/hooks/use-toast"

interface AddTransactionModalProps {
    asset: Asset
    open: boolean
    onOpenChange: (open: boolean) => void
    onTransactionAdded: () => void
}

export function AddTransactionModal({ asset, open, onOpenChange, onTransactionAdded }: AddTransactionModalProps) {
    const { toast } = useToast()
    const [type, setType] = useState<"BUY" | "SELL">("BUY")
    const [quantity, setQuantity] = useState("")
    const [price, setPrice] = useState("")
    const [fee, setFee] = useState("")
    // Default to current time, formatted for datetime-local input (YYYY-MM-DDTHH:mm)
    const [date, setDate] = useState(new Date().toISOString().slice(0, 16))
    const [notes, setNotes] = useState("")
    const [loading, setLoading] = useState(false)

    // Helper to extract symbol and price safely across union types
    const assetSymbol = 'symbol' in asset ? asset.symbol : asset.currency;
    const currentPrice = 'currentPrice' in asset ? asset.currentPrice : 0;

    // Prefill price from asset if available
    useEffect(() => {
        if (open && currentPrice) {
            setPrice(currentPrice.toString())
        }
    }, [open, currentPrice])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!date || !quantity || !price) return

        setLoading(true)
        try {
            const res = await fetch('/api/transactions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    assetId: asset.id,
                    type,
                    quantity: parseFloat(quantity),
                    pricePerUnit: parseFloat(price),
                    fee: fee ? parseFloat(fee) : 0,
                    date: new Date(date).toISOString(),
                    notes
                })
            })

            if (!res.ok) throw new Error("Failed to save transaction")

            onOpenChange(false)
            onTransactionAdded()

            // Success Toast
            toast({
                title: "Transaction Recorded",
                description: `Successfully recorded ${type.toLowerCase()} of ${assetSymbol}`,
            })

            // Reset form
            setQuantity("")
            setFee("")
            setNotes("")
        } catch (error) {
            console.error("Failed to add transaction:", error)
            toast({
                title: "Error",
                description: "Failed to save transaction. Please try again.",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        {type === 'BUY' ? <PlusCircle className="text-green-500" /> : <MinusCircle className="text-red-500" />}
                        Add Transaction
                    </DialogTitle>
                    <DialogDescription>
                        Record a {type === 'BUY' ? 'purchase' : 'sale'} for {asset.name} ({assetSymbol})
                    </DialogDescription>
                </DialogHeader>

                <div className="flex gap-2 p-1 bg-muted rounded-lg mb-4">
                    <button
                        type="button"
                        onClick={() => setType("BUY")}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            type === "BUY" ? "bg-background shadow-sm text-green-600" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Buy (In)
                    </button>
                    <button
                        type="button"
                        onClick={() => setType("SELL")}
                        className={cn(
                            "flex-1 py-1.5 text-sm font-medium rounded-md transition-all",
                            type === "SELL" ? "bg-background shadow-sm text-red-600" : "text-muted-foreground hover:text-foreground"
                        )}
                    >
                        Sell (Out)
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Quantity</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={quantity}
                                onChange={e => setQuantity(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Price per Unit</Label>
                            <div className="relative">
                                <DollarSign className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="number"
                                    step="any"
                                    className="pl-8"
                                    placeholder="0.00"
                                    value={price}
                                    onChange={e => setPrice(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <Input
                                type="datetime-local"
                                value={date}
                                onChange={e => setDate(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Fee (Optional)</Label>
                            <Input
                                type="number"
                                step="any"
                                placeholder="0.00"
                                value={fee}
                                onChange={e => setFee(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>Notes</Label>
                        <textarea
                            className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                            placeholder="e.g. Bought on weakness"
                            value={notes}
                            onChange={e => setNotes(e.target.value)}
                        />
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button type="submit" disabled={loading} className={type === 'BUY' ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {type === 'BUY' ? 'Record Buy' : 'Record Sell'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    )
}
