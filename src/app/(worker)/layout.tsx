"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

export default function WorkerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = useQuery(api.users.viewer);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.push("/signin");
    } else if (user && user.role !== "worker") {
      if (user.role === "owner") {
        router.push("/owner");
      } else if (user.role === "manager") {
        router.push("/manager");
      }
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-[#F8F9FA] flex items-center justify-center font-sans text-muted">
        <span className="text-xs text-[#5F6368] uppercase font-black tracking-widest font-sans">
          Loading operational console...
        </span>
      </div>
    );
  }

  if (user === null || user.role !== "worker") {
    return null;
  }

  return (
    <div
      className="flex flex-col md:flex-row md:h-screen md:w-screen md:overflow-hidden"
      style={{ backgroundColor: "#F8F9FA" }}
    >
      {/* Sidebar */}
      <Sidebar />

      {/* Main content viewport */}
      <main className="flex-1 min-h-0 overflow-y-auto p-4 md:p-8 pb-20 md:pb-8">
        <div className="max-w-[1280px] mx-auto w-full">
          {children}
        </div>
      </main>
    </div>
  );
}
