"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, CheckCircle2, Wallet } from "lucide-react";
import { AddAssetModal } from "@/components/AddAssetModal";

export function OnboardingModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState(1);
    const [showAddAsset, setShowAddAsset] = useState(false);

    useEffect(() => {
        // Check if user has seen onboarding
        const hasSeenOnboarding = localStorage.getItem("hasSeenOnboarding");
        if (!hasSeenOnboarding) {
            // Small delay to ensure smooth entrance
            const timer = setTimeout(() => setOpen(true), 1000);
            return () => clearTimeout(timer);
        }
    }, []);

    const handleComplete = () => {
        localStorage.setItem("hasSeenOnboarding", "true");
        setOpen(false);
    };

    const handleAddFirstAsset = () => {
        setOpen(false);
        setShowAddAsset(true);
        localStorage.setItem("hasSeenOnboarding", "true"); // Mark as seen so it doesn't pop up again
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle className="text-2xl font-bold text-center">Welcome to AssetPanorama</DialogTitle>
                        <DialogDescription className="text-center pt-2">
                            Your personal command center for tracking wealth across banks, stocks, and crypto.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-6 flex flex-col items-center justify-center space-y-6">
                        <div className="bg-primary/10 p-6 rounded-full ring-1 ring-primary/20">
                            <Wallet className="h-12 w-12 text-primary" />
                        </div>

                        <div className="space-y-2 text-center max-w-xs">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Track all your assets in one place</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Real-time market data updates</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <CheckCircle2 className="h-4 w-4 text-green-500" />
                                <span>Visualize your net worth growth</span>
                            </div>
                        </div>
                    </div>

                    <DialogFooter className="flex-col sm:flex-col gap-2">
                        <Button className="w-full gap-2" size="lg" onClick={handleAddFirstAsset}>
                            Add Your First Asset <ArrowRight className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" className="w-full" onClick={handleComplete}>
                            I'll explore on my own
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AddAssetModal
                open={showAddAsset}
                onOpenChange={setShowAddAsset}
                onAssetAdded={() => {
                    // Optional: Show success toast or celebration
                    window.location.reload(); // Simple reload to refresh data
                }}
            />
        </>
    );
}
