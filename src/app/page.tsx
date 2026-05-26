"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

export default function RootPage() {
  const user = useQuery(api.users.viewer);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      router.replace("/signin");
    } else if (user) {
      if (!user.profileSetupComplete) {
        router.replace("/onboarding");
      } else if (user.role === "supervisor") {
        router.replace("/owner");
      } else if (user.role === "manager") {
        router.replace("/manager");
      } else {
        router.replace("/worker");
      }
    }
  }, [user, router]);

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center font-sans text-muted">
      <div className="text-center space-y-2">
        <span className="body-small block">Establishing session link...</span>
      </div>
    </div>
  );
}
