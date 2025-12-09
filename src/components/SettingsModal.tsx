
"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Settings, Trash2, AlertTriangle, RefreshCw } from "lucide-react";
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

interface SettingsModalProps {
    onHistoryReset: () => void;
}

export function SettingsModal({ onHistoryReset }: SettingsModalProps) {
    const [open, setOpen] = useState(false);
    const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    const handleReset = async () => {
        setIsResetting(true);
        try {
            const res = await fetch('/api/history/reset', { method: 'DELETE' });
            if (res.ok) {
                onHistoryReset();
                setOpen(false); // Close settings modal
            }
        } catch (error) {
            console.error("Failed to reset history:", error);
        } finally {
            setIsResetting(false);
            setResetConfirmOpen(false);
        }
    };

    return (
        <>
            <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                        <Settings className="h-5 w-5" />
                    </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>Settings</DialogTitle>
                        <DialogDescription>
                            Global preferences and data management.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                            <div className="space-y-0.5">
                                <h4 className="text-sm font-medium flex items-center gap-2">
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                    Clear History Data
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                    Delete all historical curve data. Assets will remain.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => setResetConfirmOpen(true)}
                            >
                                Reset History
                            </Button>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Close</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AlertDialog open={resetConfirmOpen} onOpenChange={setResetConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            This action cannot be undone. This will permanently delete your entire portfolio history tracking.
                            <br /><br />
                            Your current assets will <strong>NOT</strong> be deleted. A new history record will be created based on your current total.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleReset}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            disabled={isResetting}
                        >
                            {isResetting ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Resetting...
                                </>
                            ) : (
                                "Yes, Clear History"
                            )}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    );
}
