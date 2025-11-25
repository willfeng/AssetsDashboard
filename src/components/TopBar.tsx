"use client";

import { UserCircle } from "lucide-react";
import { SignInButton, SignUpButton, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";

export function TopBar() {
    return (
        <div className="flex items-center p-4 border-b bg-background">
            <div className="ml-auto flex items-center gap-x-4">
                <SignedOut>
                    <div className="flex gap-2">
                        <SignInButton mode="redirect">
                            <Button variant="ghost" size="sm">Sign In</Button>
                        </SignInButton>
                        <SignUpButton mode="redirect">
                            <Button size="sm">Sign Up</Button>
                        </SignUpButton>
                    </div>
                </SignedOut>
                <SignedIn>
                    <div className="flex items-center gap-x-2 text-sm font-medium">
                        <span>Welcome</span>
                        <UserButton afterSignOutUrl="/" />
                    </div>
                </SignedIn>
            </div>
        </div>
    );
}
