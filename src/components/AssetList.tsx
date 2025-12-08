import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Landmark, TrendingUp, Bitcoin, CloudDownload, UserCog, Home, Gem } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import { Asset } from "@/types";
import { EmptyState } from "@/components/EmptyState";

import { CurrencyService } from "@/lib/currency";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface AssetListProps {
    assets: Asset[];
    onEdit: (asset: Asset) => void;
    onDelete: (id: string) => void;
    onReorder?: (assets: Asset[]) => void;
}

function SortableAssetItem({ asset, children }: { asset: Asset, children: React.ReactNode }) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: asset.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        zIndex: isDragging ? 10 : 1,
        opacity: isDragging ? 0.5 : 1,
        position: 'relative' as 'relative', // Explicitly cast to match CSSProperties
    };

    return (
        <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
            {children}
        </div>
    );
}

export function AssetList({ assets, onEdit, onDelete, onReorder }: AssetListProps) {
    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id && onReorder) {
            const oldIndex = assets.findIndex((item) => item.id === active.id);
            const newIndex = assets.findIndex((item) => item.id === over?.id);

            if (oldIndex !== -1 && newIndex !== -1) {
                const newAssets = arrayMove(assets, oldIndex, newIndex);
                // Update order field locally for the moved item and affected items?
                // Actually, the backend reorder API expects a list of {id, order}.
                // We should update the 'order' property of all items in the new list to reflect their new index.
                const reorderedAssets = newAssets.map((asset, index) => ({ ...asset, order: index }));
                onReorder(reorderedAssets);
            }
        }
    };
    const AssetActions = ({ asset }: { asset: Asset }) => (
        <div className="flex items-center gap-1 ml-2">
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/50 hover:text-primary"
                onClick={() => onEdit(asset)}
                disabled={!!asset.integrationId}
                title={asset.integrationId ? "Synced assets cannot be edited manually" : "Edit asset"}
            >
                <Pencil className="h-3.5 w-3.5" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-muted-foreground/50 hover:text-destructive"
                onClick={() => onDelete(asset.id!)}
            >
                <Trash2 className="h-3.5 w-3.5" />
            </Button>
        </div>
    );

    const bankAssets = assets.filter((a) => a.type === "BANK");
    const stockAssets = assets.filter((a) => a.type === "STOCK");
    const cryptoAssets = assets.filter((a) => a.type === "CRYPTO");
    const realEstateAssets = assets.filter((a) => a.type === "REAL_ESTATE");
    const customAssets = assets.filter((a) => a.type === "CUSTOM");

    return (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" id="assets">
            {/* Bank Accounts */}
            <Card className="flex flex-col min-w-0">
                <CardHeader>
                    <CardTitle>Bank Accounts</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {bankAssets.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={bankAssets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-5">
                                    {bankAssets.map((asset) => (
                                        <SortableAssetItem key={asset.id} asset={asset}>
                                            <div className="group flex items-center justify-between gap-4 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                {/* ... existing item render ... */}
                                                <div className="space-y-1">
                                                    <p className="text-sm font-medium leading-none">{asset.name}</p>
                                                    <p className="text-xs text-muted-foreground">{asset.currency}</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {CurrencyService.format(asset.balance || 0, asset.currency || "USD")}
                                                        </div>
                                                        {asset.currency && asset.currency !== "USD" && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ≈ {CurrencyService.format(CurrencyService.convertToUSD(asset.balance || 0, asset.currency), "USD")}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AssetActions asset={asset} />
                                                </div>
                                            </div>
                                        </SortableAssetItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <EmptyState
                            icon={Landmark}
                            title="No Bank Accounts"
                            description="Add your savings or checking accounts."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Stocks */}
            <Card className="flex flex-col min-w-0">
                <CardHeader>
                    <CardTitle>Stocks</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {stockAssets.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={stockAssets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-5">
                                    {stockAssets.map((asset) => (
                                        <SortableAssetItem key={asset.id} asset={asset}>
                                            <div className="group flex items-center justify-between gap-4 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                {/* ... existing item render ... */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-sm font-medium leading-none">{asset.symbol}</p>
                                                        <Badge variant="secondary" className={cn("text-[10px] px-1 py-0 h-5 font-normal", (asset.change24h || 0) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50")}>
                                                            {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{asset.quantity} shares</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {CurrencyService.format(asset.totalValue || 0, asset.currency || "USD")}
                                                        </div>
                                                        {asset.currency && asset.currency !== "USD" && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ≈ {CurrencyService.format(CurrencyService.convertToUSD(asset.totalValue || 0, asset.currency), "USD")}
                                                            </div>
                                                        )}
                                                        {asset.averageBuyPrice && asset.averageBuyPrice > 0 && asset.quantity > 0 && (
                                                            <div className="text-[10px] mt-0.5 flex justify-end gap-1">
                                                                <span className="text-muted-foreground">Ret:</span>
                                                                <span className={cn(
                                                                    (asset.currentPrice - asset.averageBuyPrice) >= 0 ? "text-green-500" : "text-red-500"
                                                                )}>
                                                                    {((asset.currentPrice - asset.averageBuyPrice) >= 0 ? "+" : "")}
                                                                    {((asset.currentPrice - asset.averageBuyPrice) / asset.averageBuyPrice * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AssetActions asset={asset} />
                                                </div>
                                            </div>
                                        </SortableAssetItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <EmptyState
                            icon={TrendingUp}
                            title="No Stocks"
                            description="Track your stock portfolio performance."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Crypto */}
            <Card className="flex flex-col min-w-0">
                <CardHeader>
                    <CardTitle>Crypto</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {cryptoAssets.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={cryptoAssets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-5">
                                    {cryptoAssets.map((asset) => (
                                        <SortableAssetItem key={asset.id} asset={asset}>
                                            <div className="group flex items-center justify-between gap-4 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                {/* ... existing item render ... */}
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <TooltipProvider>
                                                            <Tooltip>
                                                                <TooltipTrigger asChild>
                                                                    {asset.integrationId ? (
                                                                        <CloudDownload className="h-3 w-3 text-blue-500" />
                                                                    ) : (
                                                                        <UserCog className="h-3 w-3 text-muted-foreground/50" />
                                                                    )}
                                                                </TooltipTrigger>
                                                                <TooltipContent>
                                                                    <p>{asset.integrationId ? "Synced from Exchange/Wallet" : "Manually Added"}</p>
                                                                </TooltipContent>
                                                            </Tooltip>
                                                        </TooltipProvider>
                                                        <p className="text-sm font-medium leading-none">{asset.name}</p>
                                                        <Badge variant="secondary" className={cn("text-[10px] px-1 py-0 h-5 font-normal", (asset.change24h || 0) >= 0 ? "text-green-600 bg-green-50" : "text-red-600 bg-red-50")}>
                                                            {(asset.change24h || 0) > 0 ? "+" : ""}{Number(asset.change24h || 0).toFixed(2)}%
                                                        </Badge>
                                                    </div>
                                                    <p className="text-xs text-muted-foreground">{asset.quantity} coins</p>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right">
                                                        <div className="font-medium">${asset.totalValue?.toLocaleString()}</div>
                                                        {asset.averageBuyPrice && asset.averageBuyPrice > 0 && asset.quantity > 0 && (
                                                            <div className="text-[10px] mt-0.5 flex justify-end gap-1">
                                                                <span className="text-muted-foreground">Ret:</span>
                                                                <span className={cn(
                                                                    (asset.currentPrice - asset.averageBuyPrice) >= 0 ? "text-green-500" : "text-red-500"
                                                                )}>
                                                                    {((asset.currentPrice - asset.averageBuyPrice) >= 0 ? "+" : "")}
                                                                    {((asset.currentPrice - asset.averageBuyPrice) / asset.averageBuyPrice * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AssetActions asset={asset} />
                                                </div>
                                            </div>
                                        </SortableAssetItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <EmptyState
                            icon={Bitcoin}
                            title="No Crypto"
                            description="Connect wallets or exchanges."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card >


            {/* Real Estate */}
            <Card className="flex flex-col min-w-0">
                <CardHeader>
                    <CardTitle>Real Estate</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {realEstateAssets.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={realEstateAssets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-5">
                                    {realEstateAssets.map((asset) => (
                                        <SortableAssetItem key={asset.id} asset={asset}>
                                            <div className="group flex items-center justify-between gap-4 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Home className="h-3 w-3 text-muted-foreground/70" />
                                                        <p className="text-sm font-medium leading-none">{asset.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {CurrencyService.format(asset.balance || 0, asset.currency || "USD")}
                                                        </div>
                                                        {asset.currency && asset.currency !== "USD" && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ≈ {CurrencyService.format(CurrencyService.convertToUSD(asset.balance || 0, asset.currency), "USD")}
                                                            </div>
                                                        )}
                                                        {asset.averageBuyPrice && asset.averageBuyPrice > 0 && (
                                                            <div className="text-[10px] mt-0.5 flex justify-end gap-1">
                                                                <span className="text-muted-foreground">Ret:</span>
                                                                <span className={cn(
                                                                    ((asset.balance || 0) - asset.averageBuyPrice) >= 0 ? "text-green-500" : "text-red-500"
                                                                )}>
                                                                    {(((asset.balance || 0) - asset.averageBuyPrice) >= 0 ? "+" : "")}
                                                                    {(((asset.balance || 0) - asset.averageBuyPrice) / asset.averageBuyPrice * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AssetActions asset={asset} />
                                                </div>
                                            </div>
                                        </SortableAssetItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <EmptyState
                            icon={Home}
                            title="No Properties"
                            description="Track real estate assets."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>

            {/* Custom Assets */}
            <Card className="flex flex-col min-w-0">
                <CardHeader>
                    <CardTitle>Custom Assets</CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                    {customAssets.length > 0 ? (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            <SortableContext items={customAssets.map(a => a.id)} strategy={verticalListSortingStrategy}>
                                <div className="space-y-5">
                                    {customAssets.map((asset) => (
                                        <SortableAssetItem key={asset.id} asset={asset}>
                                            <div className="group flex items-center justify-between gap-4 py-2 px-2 hover:bg-muted/50 rounded-lg transition-colors">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <Gem className="h-3 w-3 text-muted-foreground/70" />
                                                        <p className="text-sm font-medium leading-none">{asset.name}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center">
                                                    <div className="text-right">
                                                        <div className="font-medium">
                                                            {CurrencyService.format(asset.balance || 0, asset.currency || "USD")}
                                                        </div>
                                                        {asset.currency && asset.currency !== "USD" && (
                                                            <div className="text-xs text-muted-foreground">
                                                                ≈ {CurrencyService.format(CurrencyService.convertToUSD(asset.balance || 0, asset.currency), "USD")}
                                                            </div>
                                                        )}
                                                        {asset.averageBuyPrice && asset.averageBuyPrice > 0 && (
                                                            <div className="text-[10px] mt-0.5 flex justify-end gap-1">
                                                                <span className="text-muted-foreground">Ret:</span>
                                                                <span className={cn(
                                                                    ((asset.balance || 0) - asset.averageBuyPrice) >= 0 ? "text-green-500" : "text-red-500"
                                                                )}>
                                                                    {(((asset.balance || 0) - asset.averageBuyPrice) >= 0 ? "+" : "")}
                                                                    {(((asset.balance || 0) - asset.averageBuyPrice) / asset.averageBuyPrice * 100).toFixed(1)}%
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                    <AssetActions asset={asset} />
                                                </div>
                                            </div>
                                        </SortableAssetItem>
                                    ))}
                                </div>
                            </SortableContext>
                        </DndContext>
                    ) : (
                        <EmptyState
                            icon={Gem}
                            title="No Custom Assets"
                            description="Track watches, jewelry, art, etc."
                            className="min-h-[150px] p-4"
                        />
                    )}
                </CardContent>
            </Card>
        </div >
    );
}
