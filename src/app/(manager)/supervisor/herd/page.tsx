"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Trophy, AlertTriangle, Layers, Tractor, ShieldAlert } from "lucide-react";
import { getFarmClock, milkYieldByDate } from "@/lib/farmClock";

export default function SupervisorHerdPage() {
  const { now, yesterdayDateStr } = getFarmClock();
  const livestockData = useQuery(api.livestock.getLivestockDashboard, { now, yesterdayDateStr });
  const offspring = useQuery(api.records.listCalves);
  const productionAudit = useQuery(api.records.getMilkingAudit, { limit: 1000 });

  if (livestockData === undefined || offspring === undefined || productionAudit === undefined) {
    return (
      <div className="font-mono text-xs text-muted uppercase tracking-widest p-8">
        Loading herd registers...
      </div>
    );
  }

  // --- Calculations for Section 1: Herd composition ---
  const milkingCount = livestockData.individual.filter((c: any) => c.status === "milking").length;
  const dryCount = livestockData.individual.filter((c: any) => c.status === "dry").length;
  const treatmentCount = livestockData.individual.filter((c: any) => c.isWithholding).length + 
    livestockData.groups.filter((g: any) => g.isWithholding).length;
  const offspringCount = offspring.length;

  // Species breakdowns
  const cattleCount = livestockData.individual.filter((c: any) => c.species === "cattle").length;
  const goatCount = livestockData.individual.filter((c: any) => c.species === "goat").length;
  const sheepCount = livestockData.individual.filter((c: any) => c.species === "sheep").length;
  const pigCount = livestockData.individual.filter((c: any) => c.species === "pig").length;

  // Flock & hive counts
  const poultryCount = livestockData.groups.filter((g: any) => g.species === "poultry").reduce((sum: number, g: any) => sum + g.count, 0);
  const hiveCount = livestockData.groups.filter((g: any) => g.species === "bees").length;

  // --- Calculations for Section 2: Top and Bottom Performers ---
  const milkingAnimalsSorted = [...livestockData.individual]
    .filter((c: any) => (c.species === "cattle" || c.species === "goat") && c.status === "milking")
    .sort((a: any, b: any) => (b.yesterdayYield ?? 0) - (a.yesterdayYield ?? 0));

  const topPerformers = milkingAnimalsSorted.slice(0, 5);
  const bottomPerformers = [...milkingAnimalsSorted]
    .reverse()
    .filter((c: any) => (c.yesterdayYield ?? 0) > 0) // exclude dry/zero yield
    .slice(0, 5);

  // Recharts Milk Yield Audit
  const mappedSessions = productionAudit
    .filter((s: any) => s.type === "milk")
    .map((s: any) => ({
      date: s.date,
      litres: s.amount,
    }));
  const totalByDate = milkYieldByDate(mappedSessions);
  
  const sessionsByDate: Record<string, number> = {};
  productionAudit.filter((s: any) => s.type === "milk").forEach((s: any) => {
    sessionsByDate[s.date] = (sessionsByDate[s.date] ?? 0) + 1;
  });

  const chartData = Object.entries(totalByDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, total]) => ({
      date: new Date(date + "T12:00:00").toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
      }),
      average: Math.round((total / (sessionsByDate[date] || 1)) * 10) / 10,
    }))
    .slice(-60);

  return (
    <div className="space-y-8 pb-12 font-sans text-ink">
      {/* Page Title & Header */}
      <header className="border-b border-rule pb-6">
        <span className="text-[10px] font-bold uppercase tracking-[0.2em] block mb-2 text-muted">
          Executive Ledger &gt; Livestock
        </span>
        <h1 className="font-display text-3xl font-medium tracking-tight text-ink">
          Agribusiness Herd
        </h1>
        <p className="text-xs text-muted mt-1 uppercase tracking-wider font-medium">
          Current status, species distribution, and yield performance of the farm livestock
        </p>
      </header>

      {/* Section 1: Herd composition */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Herd Status Summary</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-paper border border-rule p-6 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Active Milking</span>
            <div className="text-3xl font-medium text-ink font-display">{milkingCount} <span className="text-xs font-medium text-muted font-sans">Heads</span></div>
          </div>
          <div className="bg-paper border border-rule p-6 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Dry Status</span>
            <div className="text-3xl font-medium text-ink font-display">{dryCount} <span className="text-xs font-medium text-muted font-sans">Heads</span></div>
          </div>
          <div className="bg-paper border border-rule p-6 rounded-none">
            <span className="text-[10px] font-bold text-alert uppercase tracking-wider block mb-1">Medical Isolation</span>
            <div className="text-3xl font-medium text-alert font-display">{treatmentCount} <span className="text-xs font-medium text-alert font-sans">Heads</span></div>
          </div>
          <div className="bg-paper border border-rule p-6 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block mb-1">Young Offspring</span>
            <div className="text-3xl font-medium text-ink font-display">{offspringCount} <span className="text-xs font-medium text-muted font-sans">Weaners</span></div>
          </div>
        </div>
      </section>

      {/* Section: Species Breakdown */}
      <section className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted font-mono">Species Breakdown</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Cattle</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{cattleCount}</span>
          </div>
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Goats</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{goatCount}</span>
          </div>
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Sheep</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{sheepCount}</span>
          </div>
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Pigs</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{pigCount}</span>
          </div>
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Poultry</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{poultryCount} <span className="text-[10px] font-sans font-medium text-muted">birds</span></span>
          </div>
          <div className="bg-paper-2 border border-rule p-4 rounded-none">
            <span className="text-[10px] font-bold text-muted uppercase tracking-wider block">Bee Colonies</span>
            <span className="text-2xl font-mono font-bold text-ink mt-1 block">{hiveCount} <span className="text-[10px] font-sans font-medium text-muted">hives</span></span>
          </div>
        </div>
      </section>

      {/* Section 2: Top and bottom performers this week */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Top Performers */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 rounded-none space-y-4">
          <div className="flex items-center gap-2 border-b border-rule pb-3">
            <Trophy className="h-4 w-4 text-pasture" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Top Yielding Animals (Yesterday)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-muted uppercase tracking-wider border-b border-rule">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Species</th>
                  <th className="pb-2">Breed</th>
                  <th className="pb-2 text-right">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-medium text-ink">
                {topPerformers.map((c: any) => (
                  <tr key={c._id}>
                    <td className="py-3 font-mono text-moss">{c.tagNumber}</td>
                    <td className="py-3 capitalize text-[10px] font-bold text-muted">{c.species}</td>
                    <td className="py-3">{c.breed}</td>
                    <td className="py-3 font-mono text-right text-pasture">{(c.yesterdayYield ?? 0).toFixed(1)} L</td>
                  </tr>
                ))}
                {topPerformers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center italic text-muted">No yield records logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Bottom Performers */}
        <div className="lg:col-span-6 bg-paper border border-rule p-6 rounded-none space-y-4">
          <div className="flex items-center gap-2 border-b border-rule pb-3">
            <AlertTriangle className="h-4 w-4 text-alert" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">
              Low Yielding Animals (Yesterday)
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-bold text-muted uppercase tracking-wider border-b border-rule">
                  <th className="pb-2">Tag</th>
                  <th className="pb-2">Species</th>
                  <th className="pb-2">Breed</th>
                  <th className="pb-2 text-right">Yield</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-rule font-medium text-ink">
                {bottomPerformers.map((c: any) => (
                  <tr key={c._id}>
                    <td className="py-3 font-mono text-moss">{c.tagNumber}</td>
                    <td className="py-3 capitalize text-[10px] font-bold text-muted">{c.species}</td>
                    <td className="py-3">{c.breed}</td>
                    <td className="py-3 font-mono text-right text-alert">{(c.yesterdayYield ?? 0).toFixed(1)} L</td>
                  </tr>
                ))}
                {bottomPerformers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-4 text-center italic text-muted">No low yield records logged.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Section 3: Average daily yield, 60 days */}
      <section className="bg-paper border border-rule p-6 rounded-none space-y-6">
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-ink font-mono">Average Daily Yield Trends (Last 60 Days)</h3>
          <span className="text-[10px] text-muted uppercase tracking-wider font-bold">Calculated from total milk yields across active milking heads</span>
        </div>

        <div className="h-[240px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted font-medium font-mono">
              No milking sessions logged in audit history.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorAvg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1f3a2e" stopOpacity={0.12} />
                    <stop offset="95%" stopColor="#1f3a2e" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "#5F6368", fontSize: 9, fontFamily: "monospace" }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "#5F6368", fontSize: 9, fontFamily: "monospace" }} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "#f5f2e3",
                    border: "1px solid #d8d6c9",
                    borderRadius: "0px",
                    fontSize: "11px",
                    fontWeight: "bold",
                    color: "#0f1411",
                    fontFamily: "monospace"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="average" 
                  stroke="#1f3a2e" 
                  strokeWidth={1.5} 
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
