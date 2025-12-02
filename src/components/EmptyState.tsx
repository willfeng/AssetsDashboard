import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
    icon: LucideIcon;
    title: string;
    description: string;
    actionLabel?: string;
    onAction?: () => void;
    className?: string;
}

export function EmptyState({
    icon: Icon,
    title,
    description,
    actionLabel,
    onAction,
    className
}: EmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-8 text-center h-full min-h-[200px] animate-in fade-in zoom-in duration-500 ${className}`}>
            <div className="bg-muted/30 p-6 rounded-full mb-4 ring-1 ring-border/50">
                <Icon className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-semibold tracking-tight">{title}</h3>
            <p className="text-sm text-muted-foreground mt-2 max-w-xs mb-6 leading-relaxed">
                {description}
            </p>
            {actionLabel && onAction && (
                <Button onClick={onAction} variant="outline" className="gap-2">
                    {actionLabel}
                </Button>
            )}
        </div>
    );
}
