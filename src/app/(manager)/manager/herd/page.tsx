"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ManagerHerdPage() {
  const { now, yesterdayDateStr } = getFarmClock();
  const cows = useQuery(api.cows.getHerdDashboard, { now, yesterdayDateStr });
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  if (cows === undefined) {
    return <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">Loading herd registers...</div>;
  }

  const filteredCows = cows.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.tagNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Herd Registry
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Dairy Herd Directory
        </h1>
      </header>

      {/* Filter Options */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-[#DADCE0] pb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-[#7A869A] pointer-events-none" />
          <input
            type="text"
            placeholder="Search by tag number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] pl-11 pr-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[18px] transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-[#F8F9FA] border border-[#DADCE0] rounded-[20px]">
          {["all", "milking", "dry", "treatment", "calf", "sold", "deceased"].map((status) => (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              className={`px-3 py-1.5 text-[9px] font-black uppercase tracking-wider rounded-[14px] transition-all cursor-pointer ${
                statusFilter === status
                  ? "bg-[#202124] text-white"
                  : "text-[#5F6368] hover:bg-primary-subtle hover:text-primary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Cow Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCows.map((cow: any) => (
          <Link
            key={cow._id}
            href={`/manager/herd/${cow.tagNumber}`}
            className="group block system-card p-6 hover:border-primary transition-all cursor-pointer relative"
          >
            <div className="flex justify-between items-start mb-4">
              <div>
                <span className="text-[10px] font-black uppercase text-primary block group-hover:underline">
                  {cow.tagNumber}
                </span>
                <h3 className="text-base font-black uppercase text-[#202124] mt-1">{cow.name}</h3>
              </div>
              <span className={`status-badge ${
                cow.status === "milking" ? "status-ok" :
                cow.status === "treatment" ? "status-out" :
                "bg-[#DADCE0] text-[#5F6368] border border-[#DADCE0]"
              }`}>
                {cow.status}
              </span>
            </div>

            <div className="border-t border-[#DADCE0] pt-4 space-y-2 text-xs font-semibold text-[#5F6368]">
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Breed</span>
                <span className="text-[#202124] font-bold">{cow.breed}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Lactation No.</span>
                <span className="text-[#202124] font-bold">#{cow.currentLactationNumber}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[10px] font-black text-[#7A869A] uppercase tracking-wider">Yield yesterday</span>
                <span className="text-primary font-bold">{cow.yesterdayYield > 0 ? `${cow.yesterdayYield.toFixed(1)} L` : "0.0 L"}</span>
              </div>
            </div>

            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all text-primary">
              <ChevronRight className="h-5 w-5" />
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}

