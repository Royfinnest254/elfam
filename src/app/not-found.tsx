"use client";

import React from "react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FFFFFF] flex flex-col items-center justify-center p-6 text-center font-sans text-[#202124]">
      <div className="max-w-[480px] space-y-6">
        <h1 className="font-display text-[48px] font-black tracking-tight text-[#202124]">
          Lost.
        </h1>
        
        <p className="text-[15px] leading-relaxed text-[#5F6368] font-semibold max-w-[360px] mx-auto">
          This page doesn't exist on this farm. Try the dashboard, or check the address.
        </p>

        <div className="pt-4">
          <Link
            href="/"
            className="inline-flex h-10 px-4 rounded-[6px] bg-moss text-cream text-[13px] font-medium items-center justify-center hover:bg-moss-2 transition-colors cursor-pointer"
          >
            Go to dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
