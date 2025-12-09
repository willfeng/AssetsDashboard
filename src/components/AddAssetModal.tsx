import { useState, useRef, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Home, Gem, Landmark, LineChart, Bitcoin } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { Asset } from "@/types"

// Schemas
const bankSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    balance: z.coerce.number().min(0, "Balance must be positive"),
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"]),
    apy: z.coerce.number().optional(),
})

const stockSchema = z.object({
    name: z.string().min(1, "Name is required"),
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    quantity: z.coerce.number().min(0.000001, "Quantity must be positive"),
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"]),
    averageBuyPrice: z.coerce.number().optional(),
})

const cryptoSchema = z.object({
    name: z.string().min(1, "Name is required"),
    symbol: z.string().min(1, "Symbol is required").toUpperCase(),
    quantity: z.coerce.number().min(0.000001, "Quantity must be positive"),
    averageBuyPrice: z.coerce.number().optional(),
})

const realEstateSchema = z.object({
    name: z.string().min(2, "Address or Name is required"),
    balance: z.coerce.number().min(0, "Current Value must be positive"), // Current Value
    averageBuyPrice: z.coerce.number().min(0, "Purchase Price is required"), // Purchase Price
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"]),
})

const customSchema = z.object({
    name: z.string().min(2, "Item Name is required"),
    balance: z.coerce.number().min(0, "Current Value must be positive"),
    averageBuyPrice: z.coerce.number().min(0, "Purchase Price is required"),
    currency: z.enum(["USD", "HKD", "CNY", "EUR", "GBP", "JPY", "AUD", "CAD", "SGD"]),
})

type AssetType = 'BANK' | 'STOCK' | 'CRYPTO' | 'REAL_ESTATE' | 'CUSTOM'

interface AssetModalProps {
    onAssetAdded: () => void
    initialData?: Asset
    trigger?: React.ReactNode
    open?: boolean
    onOpenChange?: (open: boolean) => void
    defaultType?: AssetType
}

export function AddAssetModal({ onAssetAdded, initialData, trigger, open: controlledOpen, onOpenChange, defaultType }: AssetModalProps) {
    const [internalOpen, setInternalOpen] = useState(false)
    const isControlled = controlledOpen !== undefined
    const open = isControlled ? controlledOpen : internalOpen
    const setOpen = isControlled ? onOpenChange! : setInternalOpen

    const [activeTab, setActiveTab] = useState<AssetType>(initialData?.type || defaultType || "BANK")
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Form setup
    const form = useForm({
        resolver: zodResolver(
            activeTab === "BANK" ? bankSchema :
                activeTab === "STOCK" ? stockSchema :
                    activeTab === "CRYPTO" ? cryptoSchema :
                        activeTab === "REAL_ESTATE" ? realEstateSchema : customSchema
        ),
        defaultValues: initialData ? {
            name: initialData.name,
            balance: (initialData.type === 'BANK' || initialData.type === 'REAL_ESTATE' || initialData.type === 'CUSTOM') ? initialData.balance : 0,
            currency: (initialData.currency || "USD") as "USD" | "HKD" | "CNY" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "SGD",
            symbol: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO') ? initialData.symbol : "",
            quantity: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO') ? initialData.quantity : 0,
            averageBuyPrice: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO' || initialData.type === 'REAL_ESTATE' || initialData.type === 'CUSTOM') ? (initialData.averageBuyPrice || 0) : 0,
            apy: initialData.type === 'BANK' ? (initialData.apy || 0) : 0
        } : {
            name: "",
            balance: 0,
            currency: "USD" as "USD" | "HKD" | "CNY" | "EUR" | "GBP" | "JPY" | "AUD" | "CAD" | "SGD",
            symbol: "",
            quantity: 0,
            averageBuyPrice: 0,
            apy: 0
        }
    })

    const watchedCurrency = form.watch("currency")

    // Reset form when initialData changes or modal opens
    useEffect(() => {
        if (open) {
            if (initialData) {
                setActiveTab(initialData.type)
                form.reset({
                    name: initialData.name,
                    balance: initialData.type === 'BANK' ? initialData.balance : 0,
                    currency: initialData.type === 'BANK' ? initialData.currency : "USD",
                    symbol: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO') ? initialData.symbol : "",
                    quantity: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO') ? initialData.quantity : 0,
                    averageBuyPrice: (initialData.type === 'STOCK' || initialData.type === 'CRYPTO') ? (initialData.averageBuyPrice || 0) : 0,
                    apy: initialData.type === 'BANK' ? initialData.apy : 0
                })
            } else {
                if (defaultType) {
                    setActiveTab(defaultType);
                }
            }
        }
    }, [open, initialData, form, defaultType])

    const onSubmit = async (data: any) => {
        console.log("Submitting form data:", data)
        setIsSubmitting(true)
        try {
            const payload = { ...data, type: activeTab }

            let url = '/api/assets'
            let method = 'POST'

            if (initialData) {
                url = '/api/assets' // Same endpoint, different method
                method = 'PUT'
                payload.id = initialData.id
            }

            const res = await fetch(url, {
                method: method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            let result;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                result = await res.json();
            } else {
                const text = await res.text();
                console.error("Non-JSON response:", text);
                throw new Error(`Server error: ${res.status} ${res.statusText}`);
            }

            if (!res.ok) {
                throw new Error(result.error || 'Failed to save asset')
            }

            console.log("Asset saved successfully, closing modal...")
            setOpen(false) // Close first

            // Reset form if adding new
            if (!initialData) {
                form.reset()
            }

            // Notify parent to refresh
            onAssetAdded()

        } catch (error: any) {
            console.error("Error in onSubmit:", error)
            alert(`Error: ${error.message}`)
        } finally {
            setIsSubmitting(false)
        }
    }

    const onInvalid = (errors: any) => {
        console.error("Validation errors:", errors)
        const errorMessages = Object.values(errors).map((e: any) => e.message).join("\n")
        alert(`Validation failed:\n${errorMessages}`)
    }

    const onTabChange = (value: string) => {
        const newType = value as AssetType
        setActiveTab(newType)
        if (!initialData) {
            form.reset({
                name: "",
                balance: 0,
                currency: "USD",
                symbol: "",
                quantity: 0,
                averageBuyPrice: 0,
                apy: 0
            })
        }
    }

    // Animation logic (same as before)
    const [tabStyle, setTabStyle] = useState({ left: 0, width: 0 })
    const tabsRef = useRef<(HTMLButtonElement | null)[]>([])

    useEffect(() => {
        const timer = setTimeout(() => {
            const currentIndex = ["BANK", "STOCK", "CRYPTO", "REAL_ESTATE", "CUSTOM"].indexOf(activeTab)
            const currentTab = tabsRef.current[currentIndex]
            if (currentTab) {
                setTabStyle({
                    left: currentTab.offsetLeft,
                    width: currentTab.offsetWidth
                })
            }
        }, 100)
        return () => clearTimeout(timer)
    }, [activeTab, open])

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            {trigger ? (
                <DialogTrigger asChild>
                    {trigger}
                </DialogTrigger>
            ) : (
                !isControlled && (
                    <DialogTrigger asChild>
                        <Button>Add Asset</Button>
                    </DialogTrigger>
                )
            )}
            <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                    <DialogTitle>{initialData ? "Edit Asset" : "Add New Asset"}</DialogTitle>
                    <DialogDescription>
                        {initialData ? "Update the details of your asset." : "Enter the details of your asset."} Click save when you're done.
                    </DialogDescription>
                </DialogHeader>

                <Tabs value={activeTab} className="w-full">
                    {!initialData && (
                        <div className="relative flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full mb-4">
                            <div
                                className="absolute top-1 bottom-1 rounded-sm bg-white border border-black shadow-sm transition-all duration-300 ease-out"
                                style={{
                                    left: tabStyle.left,
                                    width: tabStyle.width,
                                }}
                            />
                            {["BANK", "STOCK", "CRYPTO", "REAL_ESTATE", "CUSTOM"].map((type, index) => (
                                <button
                                    key={type}
                                    ref={(el) => { tabsRef.current[index] = el }}
                                    type="button"
                                    onClick={() => onTabChange(type)}
                                    className={cn(
                                        "z-10 inline-flex items-center justify-center whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1",
                                        activeTab === type ? "text-foreground" : "text-muted-foreground hover:text-foreground/70"
                                    )}
                                >
                                    {type === "BANK" && <span className="flex items-center gap-1"><Landmark className="w-3 h-3" /> Bank</span>}
                                    {type === "STOCK" && <span className="flex items-center gap-1"><LineChart className="w-3 h-3" /> Stock</span>}
                                    {type === "CRYPTO" && <span className="flex items-center gap-1"><Bitcoin className="w-3 h-3" /> Crypto</span>}
                                    {type === "REAL_ESTATE" && <span className="flex items-center gap-1"><Home className="w-3 h-3" /> Property</span>}
                                    {type === "CUSTOM" && <span className="flex items-center gap-1"><Gem className="w-3 h-3" /> Custom</span>}
                                </button>
                            ))}
                        </div>
                    )}

                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-4">
                            <div className="min-h-[460px] space-y-4">
                                {activeTab === "BANK" && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Bank Name</FormLabel>
                                                    <FormControl><Input placeholder="e.g. Chase Checking" {...field} value={(field.value as any) ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="balance"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Balance</FormLabel>
                                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="currency"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Currency</FormLabel>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="USD">USD</SelectItem>
                                                            <SelectItem value="HKD">HKD</SelectItem>
                                                            <SelectItem value="CNY">CNY</SelectItem>
                                                            <SelectItem value="EUR">EUR</SelectItem>
                                                            <SelectItem value="GBP">GBP</SelectItem>
                                                            <SelectItem value="JPY">JPY</SelectItem>
                                                            <SelectItem value="AUD">AUD</SelectItem>
                                                            <SelectItem value="CAD">CAD</SelectItem>
                                                            <SelectItem value="SGD">SGD</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="apy"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Interest Rate (APY %)</FormLabel>
                                                    <FormControl><Input type="number" placeholder="e.g. 4.5" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                {(activeTab === "STOCK" || activeTab === "CRYPTO") && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Name</FormLabel>
                                                    <FormControl><Input placeholder={activeTab === "STOCK" ? "e.g. Apple" : "e.g. Bitcoin"} {...field} value={(field.value as any) ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="symbol"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Symbol</FormLabel>
                                                    <FormControl><Input placeholder={activeTab === "STOCK" ? "e.g. AAPL" : "e.g. BTC"} {...field} value={(field.value as any) ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        {activeTab === "STOCK" && (
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="USD">USD</SelectItem>
                                                                <SelectItem value="HKD">HKD</SelectItem>
                                                                <SelectItem value="CNY">CNY</SelectItem>
                                                                <SelectItem value="EUR">EUR</SelectItem>
                                                                <SelectItem value="GBP">GBP</SelectItem>
                                                                <SelectItem value="JPY">JPY</SelectItem>
                                                                <SelectItem value="AUD">AUD</SelectItem>
                                                                <SelectItem value="CAD">CAD</SelectItem>
                                                                <SelectItem value="SGD">SGD</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        )}
                                        <FormField
                                            control={form.control}
                                            name="averageBuyPrice"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Average Buy Price ({watchedCurrency || "USD"}) <span className="text-xs text-muted-foreground font-normal">(Optional)</span></FormLabel>
                                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <FormField
                                            control={form.control}
                                            name="quantity"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Quantity</FormLabel>
                                                    <FormControl><Input type="number" step="any" placeholder="0.00" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}

                                {(activeTab === "REAL_ESTATE" || activeTab === "CUSTOM") && (
                                    <>
                                        <FormField
                                            control={form.control}
                                            name="name"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{activeTab === "REAL_ESTATE" ? "Property Name / Address" : "Item Name"}</FormLabel>
                                                    <FormControl><Input placeholder={activeTab === "REAL_ESTATE" ? "e.g. 123 Main St, New York" : "e.g. Rolex Submariner"} {...field} value={(field.value as any) ?? ''} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                        <div className="grid grid-cols-2 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="currency"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Currency</FormLabel>
                                                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                            <FormControl><SelectTrigger><SelectValue placeholder="Select currency" /></SelectTrigger></FormControl>
                                                            <SelectContent>
                                                                <SelectItem value="USD">USD</SelectItem>
                                                                <SelectItem value="HKD">HKD</SelectItem>
                                                                <SelectItem value="CNY">CNY</SelectItem>
                                                                <SelectItem value="EUR">EUR</SelectItem>
                                                                <SelectItem value="GBP">GBP</SelectItem>
                                                                <SelectItem value="JPY">JPY</SelectItem>
                                                                <SelectItem value="AUD">AUD</SelectItem>
                                                                <SelectItem value="CAD">CAD</SelectItem>
                                                                <SelectItem value="SGD">SGD</SelectItem>
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                            <FormField
                                                control={form.control}
                                                name="averageBuyPrice"
                                                render={({ field }) => (
                                                    <FormItem>
                                                        <FormLabel>Purchase Price (Cost)</FormLabel>
                                                        <FormControl><Input type="number" placeholder="0.00" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <FormField
                                            control={form.control}
                                            name="balance"
                                            render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>Current Estimated Value</FormLabel>
                                                    <FormControl><Input type="number" placeholder="0.00" {...field} value={(field.value as any) ?? ''} onChange={(e) => field.onChange(e.target.valueAsNumber)} /></FormControl>
                                                    <FormMessage />
                                                </FormItem>
                                            )}
                                        />
                                    </>
                                )}
                            </div>

                            <div className="flex justify-end pt-4">
                                <Button type="submit" disabled={isSubmitting}>
                                    {isSubmitting ? "Saving..." : "Save Asset"}
                                </Button>
                            </div>
                        </form>
                    </Form>
                </Tabs>
            </DialogContent>
        </Dialog >
    )
}
