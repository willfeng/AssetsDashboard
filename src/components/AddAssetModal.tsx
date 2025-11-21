"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AssetType } from "@/types"

// Schema definitions
const baseSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    note: z.string().optional(),
})

const bankSchema = baseSchema.extend({
    type: z.literal("BANK"),
    balance: z.coerce.number().min(0, "Balance must be positive"),
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP"]),
})

const stockSchema = baseSchema.extend({
    type: z.literal("STOCK"),
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    quantity: z.coerce.number().min(0.000001, "Quantity must be positive"),
    costBasis: z.coerce.number().optional(),
})

const cryptoSchema = baseSchema.extend({
    type: z.literal("CRYPTO"),
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    quantity: z.coerce.number().min(0.00000001, "Quantity must be positive"),
    costBasis: z.coerce.number().optional(),
})

// Union schema for form
const formSchema = z.discriminatedUnion("type", [
    bankSchema,
    stockSchema,
    cryptoSchema,
])

type FormValues = z.infer<typeof formSchema>

interface AddAssetModalProps {
    onAssetAdded: () => void
}

export function AddAssetModal({ onAssetAdded }: AddAssetModalProps) {
    const [open, setOpen] = useState(false)
    const [activeTab, setActiveTab] = useState<AssetType>("BANK")
    const [loading, setLoading] = useState(false)

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema) as any,
        defaultValues: {
            type: "BANK",
            name: "",
            balance: 0,
            currency: "USD",
            note: "",
        },
    })

    // Reset form when tab changes
    const onTabChange = (value: string) => {
        console.log("Tab changed to:", value);
        const type = value as AssetType
        setActiveTab(type)
        form.reset({
            type: type,
            name: "",
            note: "",
            ...(type === "BANK"
                ? { balance: 0, currency: "USD" }
                : { symbol: "", quantity: 0, costBasis: 0 }),
        })
    }

    const onSubmit = async (data: FormValues) => {
        setLoading(true)
        try {
            const response = await fetch("/api/assets", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data),
            })

            if (!response.ok) {
                throw new Error("Failed to add asset")
            }

            onAssetAdded()
            setOpen(false)
            form.reset()
        } catch (error) {
            console.error("Error adding asset:", error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Asset
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Add New Asset</DialogTitle>
                    <DialogDescription>
                        Enter the details of your asset. Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} className="w-full">
                    <TabsList className="grid w-full grid-cols-3">
                        <TabsTrigger value="BANK" onClick={() => onTabChange("BANK")}>Bank</TabsTrigger>
                        <TabsTrigger value="STOCK" onClick={() => onTabChange("STOCK")}>Stock</TabsTrigger>
                        <TabsTrigger value="CRYPTO" onClick={() => onTabChange("CRYPTO")}>Crypto</TabsTrigger>
                    </TabsList>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-4">

                            {/* Common Field: Name */}
                            <FormField
                                control={form.control}
                                name="name"
                                render={({ field }: { field: any }) => (
                                    <FormItem>
                                        <FormLabel>Name</FormLabel>
                                        <FormControl>
                                            <Input placeholder="e.g. Chase Checking / Apple" {...field} />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            {/* Bank Specific Fields */}
                            {activeTab === "BANK" && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="balance"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Balance</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="currency"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Currency</FormLabel>
                                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                    <FormControl>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Select currency" />
                                                        </SelectTrigger>
                                                    </FormControl>
                                                    <SelectContent>
                                                        <SelectItem value="USD">USD</SelectItem>
                                                        <SelectItem value="HKD">HKD</SelectItem>
                                                        <SelectItem value="CNY">CNY</SelectItem>
                                                        <SelectItem value="EUR">EUR</SelectItem>
                                                        <SelectItem value="GBP">GBP</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            {/* Investment Specific Fields (Stock/Crypto) */}
                            {(activeTab === "STOCK" || activeTab === "CRYPTO") && (
                                <>
                                    <FormField
                                        control={form.control}
                                        name="symbol"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Symbol</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. AAPL / BTC" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="quantity"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Quantity</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="costBasis"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Cost Basis (Optional)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="any" placeholder="Total cost" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </>
                            )}

                            <DialogFooter>
                                <Button type="submit" disabled={loading}>
                                    {loading ? "Saving..." : "Save Asset"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </Form>
                </Tabs>
            </DialogContent>
        </Dialog>
    )
}
