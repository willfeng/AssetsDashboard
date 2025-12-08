"use client";

import { useCallback, useEffect, useState } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { Button } from '@/components/ui/button';
import { Loader2, Landmark } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface PlaidLinkButtonProps {
    onLinked?: () => void;
    onOpen?: () => void;
    onExit?: () => void;
}

export function PlaidLinkButton({ onLinked, onOpen, onExit }: PlaidLinkButtonProps) {
    const [token, setToken] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const { toast } = useToast();

    // 1. Fetch Link Token on mount
    useEffect(() => {
        const createLinkToken = async () => {
            try {
                console.log("Fetching Plaid Link Token...");
                const response = await fetch('/api/plaid/create_link_token', { method: 'POST' });
                if (!response.ok) {
                    const errorData = await response.json().catch(() => ({}));
                    throw new Error(errorData.error || `Failed to create link token: ${response.statusText}`);
                }
                const data = await response.json();
                console.log("Link Token obtained:", data.link_token ? "Yes" : "No");
                setToken(data.link_token);
            } catch (error: any) {
                console.error('Error creating Plaid link token:', error);
                setError(error.message);
                toast({
                    title: "Connection Error",
                    description: "Could not initialize Plaid. check console.",
                    variant: "destructive"
                });
            }
        };
        createLinkToken();
    }, [toast]);

    const onSuccess = useCallback(async (public_token: string, metadata: any) => {
        setIsLoading(true);
        console.log("Plaid Success, exchanging token...");
        try {
            // 2. Exchange Public Token
            const response = await fetch('/api/plaid/exchange_public_token', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ public_token, metadata }),
            });

            if (!response.ok) {
                throw new Error('Failed to exchange token');
            }

            toast({
                title: "Bank Connected",
                description: `Successfully linked ${metadata.institution?.name || 'institution'}.`,
            });

            if (onLinked) {
                onLinked();
            }
        } catch (error) {
            console.error('Plaid exchange error:', error);
            toast({
                title: "Connection Failed",
                description: "Failed to link bank account. Please try again.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
            // Delay exit to allow Plaid iframe to close fully before restoring Radix modal
            setTimeout(() => {
                if (onExit) onExit();
            }, 500);
        }
    }, [onLinked, toast, onExit]);

    const onExitCallback = useCallback(() => {
        // Also delay on cancellation
        setTimeout(() => {
            if (onExit) onExit();
        }, 500);
    }, [onExit]);

    const config = {
        token,
        onSuccess,
        onExit: onExitCallback,
    };

    const { open, ready } = usePlaidLink(config);

    const handleOpen = () => {
        if (onOpen) onOpen();
        open();
    };

    if (error) {
        return <div className="text-sm text-red-500 p-2 border border-red-200 rounded">Error: {error}</div>;
    }

    if (!token) {
        return (
            <Button variant="outline" disabled className="w-full gap-2 opacity-50">
                <Loader2 className="h-4 w-4 animate-spin" />
                Initializing Plaid...
            </Button>
        );
    }

    return (
        <Button
            variant="outline"
            onClick={handleOpen}
            disabled={!ready || isLoading}
            className="w-full gap-2"
        >
            {isLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
                <Landmark className="h-4 w-4" />
            )}
            {isLoading ? 'Connecting...' : 'Connect Bank (Plaid)'}
        </Button>
    );
}
