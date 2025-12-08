"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, ArrowRight, ShieldCheck, Zap } from "lucide-react";

interface WelcomeOverlayProps {
    onComplete: () => void;
}

export function WelcomeOverlay({ onComplete }: WelcomeOverlayProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [step, setStep] = useState(0);

    // Animation sequences
    useEffect(() => {
        // Step 0: Initial clean state
        // Step 1: Text fade in (0.5s)
        // Step 2: Features fade in (1.5s)
        const t1 = setTimeout(() => setStep(1), 500);
        const t2 = setTimeout(() => setStep(2), 1500);
        return () => { clearTimeout(t1); clearTimeout(t2); };
    }, []);

    const handleStart = async () => {
        setIsVisible(false);
        // Wait for exit animation
        setTimeout(() => {
            onComplete();
        }, 800);
    };

    if (!isVisible) return null;

    return (
        <div
            className={cn(
                "fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background/95 backdrop-blur-xl transition-opacity duration-700 ease-in-out",
                !isVisible && "opacity-0 pointer-events-none"
            )}
        >
            <div className="relative max-w-2xl w-full px-6 text-center space-y-12">

                {/* 1. Header Section */}
                <div
                    className={cn(
                        "space-y-6 transition-all duration-1000 ease-out transform",
                        step >= 1 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                >
                    <div className="inline-flex items-center justify-center p-3 rounded-full bg-primary/10 mb-4 animate-pulse">
                        <Sparkles className="w-8 h-8 text-primary" />
                    </div>
                    <h1 className="text-4xl md:text-6xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text text-transparent">
                        Welcome to Command Center
                    </h1>
                    <p className="text-xl text-muted-foreground max-w-lg mx-auto">
                        Your personal financial universe, unified.
                        <br className="hidden md:block" />
                        Let's align your assets in seconds.
                    </p>
                </div>

                {/* 2. Features Grid */}
                <div
                    className={cn(
                        "grid grid-cols-1 md:grid-cols-3 gap-6 transition-all duration-1000 delay-300 ease-out transform",
                        step >= 2 ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"
                    )}
                >
                    {[
                        { icon: ShieldCheck, title: "Bank Grade", desc: "Secure encryption" },
                        { icon: Zap, title: "Real-time", desc: "Live market data" },
                        { icon: Sparkles, title: "Smart Insights", desc: "Auto-analytics" }
                    ].map((feature, i) => (
                        <div key={i} className="flex flex-col items-center space-y-2 p-4 rounded-xl bg-muted/30 border border-white/5">
                            <feature.icon className="w-6 h-6 text-primary/80" />
                            <h3 className="font-semibold">{feature.title}</h3>
                            <p className="text-xs text-muted-foreground">{feature.desc}</p>
                        </div>
                    ))}
                </div>

                {/* 3. Action Button */}
                <div
                    className={cn(
                        "pt-8 transition-all duration-1000 delay-500 ease-out transform",
                        step >= 2 ? "opacity-100 scale-100" : "opacity-0 scale-95"
                    )}
                >
                    <Button
                        size="lg"
                        onClick={handleStart}
                        className="h-14 px-8 text-lg rounded-full shadow-2xl shadow-primary/20 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                    >
                        Start Configuration <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                </div>
            </div>

            {/* Background Ambience */}
            <div className="absolute inset-0 -z-10 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/20 rounded-full blur-[120px] opacity-20 animate-pulse" />
            </div>
        </div>
    );
}
