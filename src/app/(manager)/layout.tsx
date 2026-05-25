"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.viewer);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/signin");
    } else if (user) {
      if (!user.profileSetupComplete) {
        router.push("/onboarding");
      } else if (user.role !== "manager" && user.role !== "supervisor") {
        // Redirect workers to their portal
        router.push("/worker");
      }
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-muted">
        <span className="body-small">Loading operational console...</span>
      </div>
    );
  }

  if (user === null || !user.profileSetupComplete || (user.role !== "manager" && user.role !== "supervisor")) {
    return null;
  }

  return (
    <div
      className="flex flex-col md:flex-row md:h-screen md:w-screen md:overflow-hidden bg-paper text-ink"
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main content viewport */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8 bg-paper">
        <div className="max-w-[1180px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
