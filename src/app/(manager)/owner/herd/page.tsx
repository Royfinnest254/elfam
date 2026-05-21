"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, AlertTriangle, Layers } from "lucide-react";
import { getFarmClock, milkYieldByDate } from "@/lib/farmClock";

export default function OwnerHerdPage() {
  const { now, yesterdayDateStr } = getFarmClock();
  const cows = useQuery(api.cows.getHerdDashboard, { now, yesterdayDateStr });
  const calves = useQuery(api.records.listCalves);
  const milkingAudit = useQuery(api.records.getMilkingAudit, { limit: 1000 });

  if (cows === undefined || calves === undefined || milkingAudit === undefined) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading herd registers...
      </div>
    );
  }

  // --- Calculations for Section 1: Herd composition ---
  const milkingCount = cows.filter((c) => c.status === "milking").length;
  const dryCount = cows.filter((c) => c.status === "dry").length;
  const treatmentCount = cows.filter((c) => c.isWithholding).length;
  const calvesCount = calves.length; // From calves registry

  // --- Calculations for Section 2: Top and Bottom Performers ---
  // We sort milking cows by yesterdayYield
  const milkingCowsSorted = [...cows]
    .filter((c) => c.status === "milking")
    .sort((a, b) => (b.yesterdayYield ?? 0) - (a.yesterdayYield ?? 0));

  const topPerformers = milkingCowsSorted.slice(0, 5);
  const bottomPerformers = [...milkingCowsSorted]
    .reverse()
    .filter((c) => (c.yesterdayYield ?? 0) > 0) // exclude dry/zero yield
    .slice(0, 5);

  const totalByDate = milkYieldByDate(milkingAudit);
  const sessionsByDate: Record<string, number> = {};
  milkingAudit.forEach((s) => {
    sessionsByDate[s.date] = (sessionsByDate[s.date] ?? 0) + 1;
  });

  const chartData = Object.entries(totalByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      average:
        Math.round((total / (sessionsByDate[date] || 1)) * 10) / 10,
    }))
    .slice(-60);

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      {/* Page Title & Header */}
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Executive Ledger &gt; Livestock
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Herd
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Current status and performance of the livestock
        </p>
      </header>

      {/* Section 1: Herd composition */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#5F6368]">Herd composition</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Milking</span>
            <div className="text-2xl font-black text-[#202124] font-mono">{milkingCount} <span className="text-xs font-bold text-[#5F6368]">Cows</span></div>
          </div>
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Dry</span>
            <div className="text-2xl font-black text-[#202124] font-mono">{dryCount} <span className="text-xs font-bold text-[#5F6368]">Cows</span></div>
          </div>
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-[#D93025] uppercase tracking-wider block mb-1">Treatment</span>
            <div className="text-2xl font-black text-[#D93025] font-mono">{treatmentCount} <span className="text-xs font-bold text-[#D93025]">Cows</span></div>
          </div>
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px]">
            <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">Calves</span>
            <div className="text-2xl font-black text-[#202124] font-mono">{calvesCount} <span className="text-xs font-bold text-[#5F6368]">Heifers/Bulls</span></div>
          </div>
        </div>
      </section>

      {/* Section 2: Top and bottom performers this week */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Performers */}
        <div className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DADCE0] pb-3">
            <Trophy className="h-5 w-5 text-[#FFAB00]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">
              Top performers this week
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2 text-right">Daily Average Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
                {topPerformers.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 font-mono text-primary">{c.tagNumber}</td>
                    <td className="py-3">{c.name}</td>
                    <td className="py-3 font-mono text-right text-[#1E8E3E]">{c.yesterdayYield.toFixed(1)} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DADCE0] pb-3">
            <AlertTriangle className="h-5 w-5 text-[#D93025]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">
              Bottom performers this week
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Name</th>
                  <th className="pb-2 text-right">Daily Average Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
                {bottomPerformers.map((c) => (
                  <tr key={c._id}>
                    <td className="py-3 font-mono text-primary">{c.tagNumber}</td>
                    <td className="py-3">{c.name}</td>
                    <td className="py-3 font-mono text-right text-[#D93025]">{c.yesterdayYield.toFixed(1)} L</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Average daily yield, 60 days */}
      <section className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-6">
        <div>
          <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">Average daily yield, last 60 days</h3>
          <span className="text-[11px] text-[#5F6368] uppercase tracking-wider font-bold">Calculated as total milk yield / milking cows count</span>
        </div>

        <div className="h-[240px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#5F6368] font-medium">
              No milking sessions logged yet.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#1A56DB" stopOpacity={0.08} />
                  <stop offset="95%" stopColor="#1A56DB" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#7A869A", fontSize: 10, fontFamily: "monospace" }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#7A869A", fontSize: 10, fontFamily: "monospace" }} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #DADCE0",
                  borderRadius: "12px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#202124",
                  fontFamily: "sans-serif"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="average" 
                stroke="#1A56DB" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorAvg)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </section>
    </div>
  );
}
