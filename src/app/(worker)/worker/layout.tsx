"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

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
    } else if (user && (user.role || "worker") !== "worker") {
      if (user.role === "supervisor") {
        router.push("/owner");
      } else {
        router.push("/manager");
      }
    }
  }, [user, router]);


  if (user === undefined) {
    return (
      <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">
        Loading mobile tasks interface...
      </div>
    );
  }

  if (user === null || (user.role || "worker") !== "worker") {
    return null;
  }


  return <>{children}</>;
}
