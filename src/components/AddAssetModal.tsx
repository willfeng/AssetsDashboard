"use client"

import { useState, useRef, useEffect } from "react"
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
import { Tabs } from "@/components/ui/tabs"
import { AssetType } from "@/types"
import { cn } from "@/lib/utils"

// Schema definitions
const baseSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    note: z.string().optional(),
})

const bankSchema = baseSchema.extend({
    type: z.literal("BANK"),
    balance: z.coerce.number().min(0, "Balance must be positive"),
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP"]),
    apy: z.coerce.number().optional(),
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

    // Animation state
    const [tabStyle, setTabStyle] = useState({ left: 0, width: 0 })
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

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

    // Update animation when active tab changes
    useEffect(() => {
        if (open) {
            const timer = setTimeout(() => {
                const tabs = ["BANK", "STOCK", "CRYPTO"]
                const activeIndex = tabs.indexOf(activeTab)
                const activeElement = tabsRef.current[activeIndex]

                if (activeElement) {
                    setTabStyle({
                        left: activeElement.offsetLeft,
                        width: activeElement.offsetWidth,
                    })
                }
            }, 100)
            return () => clearTimeout(timer)
        }
    }, [activeTab, open])

    // Reset form when tab changes
    const onTabChange = (value: string) => {
        const type = value as AssetType
        setActiveTab(type)
        form.reset({
            type: type,
            name: "",
            note: "",
            ...(type === "BANK"
                ? { balance: 0, currency: "USD" }
                : { symbol: "", quantity: 0, costBasis: 0 }),
        } as any)
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
                    {/* Custom Sliding Tabs List */}
                    <div className="relative flex h-10 items-center justify-center rounded-md bg-zinc-100 p-1 text-zinc-500 w-full mb-4">
                        {/* The Sliding Pill */}
                        <div
                            className="absolute top-1 bottom-1 rounded-sm bg-white border border-black shadow-sm transition-all duration-300 ease-out"
                            style={{
                                left: tabStyle.left,
                                width: tabStyle.width,
                            }}
                        />

                        {/* Tab Buttons */}
                        {["BANK", "STOCK", "CRYPTO"].map((type, index) => (
                            <button
                                key={type}
                                ref={(el) => { tabsRef.current[index] = el }}
                                type="button"
                                onClick={() => onTabChange(type as AssetType)}
                                className={cn(
                                    "z-10 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1",
                                    activeTab === type ? "text-black" : "text-zinc-500 hover:text-zinc-700"
                                )}
                            >
                                {type === "BANK" ? "Bank" : type === "STOCK" ? "Stock" : "Crypto"}
                            </button>
                        ))}
                    </div>

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">

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
                                    <FormField
                                        control={form.control}
                                        name="apy"
                                        render={({ field }: { field: any }) => (
                                            <FormItem>
                                                <FormLabel>Interest Rate (APY %)</FormLabel>
                                                <FormControl>
                                                    <Input type="number" step="0.01" placeholder="e.g. 0.01" {...field} />
                                                </FormControl>
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
