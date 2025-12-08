"use client";

import { SignedIn, SignedOut } from "@clerk/nextjs";
import { LandingPage } from "@/components/LandingPage";
import { DashboardContent } from "@/components/DashboardContent";

export default function Dashboard() {
  return (
    <>
      <SignedOut>
        <LandingPage />
      </SignedOut>

      <SignedIn>
        <DashboardContent />
      </SignedIn>
    </>
  );
}
