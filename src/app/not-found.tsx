"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-6 text-center font-sans text-[#091E42]">
      <div className="max-w-[480px] space-y-6">
        <h1 className="font-display text-[48px] font-black tracking-tight text-[#091E42]">
          Lost.
        </h1>
        
        <p className="text-[15px] leading-relaxed text-[#5E6C84] font-semibold max-w-[360px] mx-auto">
          This page doesn't exist on this farm. Try the dashboard, or check the address.
        </p>

        <div className="pt-4">
          <Link
            href="/dashboard"
            className="inline-flex h-[52px] px-8 rounded-[18px] bg-primary text-white text-[11px] font-black uppercase tracking-[0.15em] items-center justify-center hover:bg-primary-dark active:scale-[0.98] transition-all cursor-pointer"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
