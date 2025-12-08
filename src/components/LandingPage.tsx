"use client";

import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, LayoutDashboard, ShieldCheck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LandingPage() {
    return (
        <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative selection:bg-primary/30">

            {/* Ambient Background Effects */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-500/20 rounded-full blur-[120px] -z-10 animate-pulse" />
            <div className="absolute bottom-0 right-0 w-[800px] h-[600px] bg-purple-500/10 rounded-full blur-[100px] -z-10" />

            <nav className="container mx-auto px-6 py-6 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-lg flex items-center justify-center">
                        <LayoutDashboard className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight">AssetsDashboard</span>
                </div>
                <div className="flex items-center gap-4">
                    <SignInButton mode="modal">
                        <Button variant="ghost" className="text-gray-300 hover:text-white hover:bg-white/10">
                            Sign In
                        </Button>
                    </SignInButton>
                    <SignUpButton mode="modal">
                        <Button className="bg-white text-black hover:bg-gray-200">
                            Sign Up
                        </Button>
                    </SignUpButton>
                </div>
            </nav>

            <main className="container mx-auto px-6 pt-20 pb-32 text-center relative z-10">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm text-indigo-300 mb-8 backdrop-blur-sm">
                    <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
                    </span>
                    New Full-Stack Asset Management Experience
                </div>

                <h1 className="text-5xl md:text-7xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60 pb-2">
                    Master Your <br className="md:hidden" />Digital Wealth
                </h1>

                <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 leading-relaxed">
                    Seamlessly manage your bank accounts, stock investments, and crypto assets in one unified dashboard.<br />
                    Privacy-first, real-time synchronization. Not just bookkeeping, but smart wealth management.
                </p>

                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                    <SignUpButton mode="modal">
                        <Button size="lg" className="h-12 px-8 text-base bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white border-0 shadow-lg shadow-indigo-500/20 transition-all hover:scale-105">
                            Get Started for Free <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </SignUpButton>

                    <SignInButton mode="modal">
                        <Button size="lg" variant="outline" className="h-12 px-8 text-base border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-sm">
                            Already have an account? Log in
                        </Button>
                    </SignInButton>
                </div>

                {/* Feature Grid */}
                <div className="grid md:grid-cols-3 gap-6 mt-32 text-left">
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="h-12 w-12 bg-blue-500/20 rounded-xl flex items-center justify-center mb-4 text-blue-400">
                            <LayoutDashboard className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Panoramic View</h3>
                        <p className="text-gray-400">Consolidate scattered asset information for a God's-eye view of your wealth.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="h-12 w-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-4 text-purple-400">
                            <Wallet className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Multi-Dimensional Assets</h3>
                        <p className="text-gray-400">Native support for Fiat Banks, US/HK Stocks, and major Crypto Wallets.</p>
                    </div>
                    <div className="p-6 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md hover:bg-white/10 transition-colors">
                        <div className="h-12 w-12 bg-green-500/20 rounded-xl flex items-center justify-center mb-4 text-green-400">
                            <ShieldCheck className="h-6 w-6" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">Privacy & Security</h3>
                        <p className="text-gray-400">AES-256 bank-grade encryption. Your data is yours to control, always.</p>
                    </div>
                </div>
            </main>

            <footer className="border-t border-white/5 py-8 text-center text-gray-600 text-sm">
                <p>&copy; {new Date().getFullYear()} AssetsDashboard. All rights reserved.</p>
            </footer>
        </div>
    );
}
