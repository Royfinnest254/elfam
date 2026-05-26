"use client";

import React, { useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import { useRouter } from "next/navigation";

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
    } else if (user && user.role !== "manager") {
      if (user.role === "supervisor") {
        router.push("/owner");
      } else {
        router.push("/worker");
      }
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <div className="text-small text-muted italic p-8 font-sans">
        Loading operational interface...
      </div>
    );
  }

  if (user === null || user.role !== "manager") {
    return null;
  }

  return <>{children}</>;
}
