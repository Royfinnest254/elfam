"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { Search } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function HerdDashboardPage() {
  const { now, yesterdayDateStr } = getFarmClock();

  const cows = useQuery(api.cows.getHerdDashboard, {
    now,
    yesterdayDateStr,
  });

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("milking");

  if (cows === undefined) {
    return (
      <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">
        Loading herd records...
      </div>
    );
  }

  // Filter and Search logic
  const filteredCows = cows.filter((cow) => {
    const matchesStatus = statusFilter === "all" || cow.status === statusFilter;
    const matchesSearch =
      cow.name.toLowerCase().includes(search.toLowerCase()) ||
      cow.tagNumber.toLowerCase().includes(search.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Production Units
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Dairy Herd Directory
        </h1>
      </header>

      {/* Filters and Search Bar */}
      <div className="flex flex-col gap-4 border-b border-[#DADCE0] pb-6">
        {/* Search */}
        <div className="relative w-full max-w-md">
          <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#5F6368] pointer-events-none" />
          <input
            type="text"
            id="search-cows"
            placeholder="Search by tag number or name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] pl-10 pr-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
          />
        </div>

        {/* Status Filters */}
        <div className="flex flex-wrap gap-2">
          {["milking", "dry", "treatment", "calf", "sold", "deceased", "all"].map((status) => (
            <button
              key={status}
              type="button"
              id={`filter-${status}`}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-colors border cursor-pointer ${
                statusFilter === status
                  ? "bg-primary text-white border-primary"
                  : "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0] hover:bg-primary-subtle hover:text-primary"
              }`}
            >
              {status}
            </button>
          ))}
        </div>
      </div>

      {/* Grid Layout */}
      {filteredCows.length === 0 ? (
        <div className="py-12 text-center">
          <p className="text-xs text-[#5F6368] italic font-semibold">No matching cows found in the registry.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCows.map((cow) => {
            const formattedCalving = cow.lastCalvingDate
              ? new Date(cow.lastCalvingDate).toLocaleDateString("en-GB", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "None recorded";

            return (
              <Link
                key={cow._id}
                href={`/herd/${cow.tagNumber}`}
                id={`cow-card-${cow.tagNumber}`}
                className="group block system-card p-6 hover:border-primary transition-all cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <span className="font-mono text-xs font-black text-primary block mb-1 group-hover:underline">
                      {cow.tagNumber}
                    </span>
                    <h3 className="font-sans text-lg font-black text-[#202124] uppercase tracking-tight">
                      {cow.name}
                    </h3>
                  </div>

                  {/* Withholding alert badge */}
                  {cow.isWithholding ? (
                    <span className="status-badge bg-[#FFEBE6] text-[#D93025] border border-[#FFBDAD] text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                      WITHHOLDING
                    </span>
                  ) : cow.status === "milking" ? (
                    <span className="status-badge bg-[#E3FCEF] text-[#1E8E3E] border border-[#ABF5D1] text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                      MILKING
                    </span>
                  ) : (
                    <span className="status-badge bg-[#F8F9FA] text-[#5F6368] border border-[#DADCE0] text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                      {cow.status}
                    </span>
                  )}
                </div>

                <div className="border-t border-[#DADCE0] pt-4 space-y-2 text-xs font-semibold text-[#5F6368]">
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-[#7A869A]">Breed</span>
                    <span className="text-[#202124]">{cow.breed}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-[#7A869A]">Lactation No.</span>
                    <span className="font-mono text-[#202124]">#{cow.currentLactationNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-[10px] font-black uppercase text-[#7A869A]">Last Calving</span>
                    <span className="text-[#202124]">{formattedCalving}</span>
                  </div>
                  <div className="flex justify-between pt-1">
                    <span className="text-[10px] font-black uppercase text-[#7A869A]">Yesterday Yield</span>
                    <span className="font-mono text-primary font-bold">
                      {cow.yesterdayYield > 0 ? `${cow.yesterdayYield.toFixed(1)} L` : "0.0 L"}
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

