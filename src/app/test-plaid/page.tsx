"use client";

import { PlaidLinkButton } from "@/components/PlaidLinkButton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { SignedIn, SignedOut, SignInButton } from "@clerk/nextjs";

export default function TestPlaidPage() {
    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 p-8">
            <Card className="w-full max-w-md">
                <CardHeader>
                    <CardTitle>Plaid Isolation Test</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                    <SignedIn>
                        <p className="text-sm text-muted-foreground">
                            Authenticated. Ready to test Plaid Link.
                        </p>
                        <div className="p-8 border rounded-lg bg-white flex justify-center">
                            <PlaidLinkButton onLinked={() => alert("Success! Bank Linked.")} />
                        </div>
                    </SignedIn>
                    <SignedOut>
                        <div className="text-center">
                            <p className="text-red-500 mb-4">You are not signed in.</p>
                            <SignInButton mode="modal">
                                <button className="bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 rounded-md">
                                    Sign In to Test
                                </button>
                            </SignInButton>
                        </div>
                    </SignedOut>
                </CardContent>
            </Card>
        </div>
    );
}
