import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Sidebar } from "@/components/Sidebar";
import { MobileNav } from "@/components/MobileNav";
import { TopBar } from "@/components/TopBar";
import { ClerkProvider } from '@clerk/nextjs'
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Asset Panorama Dashboard",
  description: "Track your wealth across banks, stocks, and crypto.",
};

import { auth } from "@clerk/nextjs/server";
import { cn } from "@/lib/utils";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { userId } = await auth();
  const isSignedIn = !!userId;

  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body className={inter.className} suppressHydrationWarning>
          <div className="h-full relative">
            {isSignedIn && (
              <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900">
                <Sidebar />
              </div>
            )}
            <main className={cn("pb-20 md:pb-10", isSignedIn ? "md:pl-72" : "")}>
              {isSignedIn && <TopBar />}
              {children}
            </main>
            {isSignedIn && <MobileNav />}
            <Toaster />
          </div>
        </body>
      </html>
    </ClerkProvider>
  );
}
