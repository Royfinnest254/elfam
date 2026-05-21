"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ClipboardList, Layers, Tractor, ShieldAlert, FileText } from "lucide-react";
import { getFarmClock, milkYieldByDate, yieldChartSeries } from "@/lib/farmClock";

export default function OwnerDashboardPage() {
  const { now, yesterdayDateStr, yesterday } = getFarmClock();
  const cows = useQuery(api.cows.getHerdDashboard, { now, yesterdayDateStr });
  const fields = useQuery(api.records.listFields);
  const contracts = useQuery(api.records.listContracts);
  const deliveries = useQuery(api.records.listAllDeliveries);
  const calvings = useQuery(api.records.listCalvings);
  const treatments = useQuery(api.records.listAllTreatments);
  const milkingAudit = useQuery(api.records.getMilkingAudit, { limit: 1000 });
  const rainfallLogs = useQuery(api.records.listRainfall);

  // Tab range for the chart
  const [chartRange, setChartRange] = useState<7 | 30 | 60>(60);

  if (
    cows === undefined ||
    fields === undefined ||
    contracts === undefined ||
    deliveries === undefined ||
    calvings === undefined ||
    treatments === undefined ||
    milkingAudit === undefined ||
    rainfallLogs === undefined
  ) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading executive dashboard...
      </div>
    );
  }

  // --- Calculations for Rainfall ---
  const latestRain = rainfallLogs && rainfallLogs.length > 0 ? rainfallLogs[0] : null;

  // --- Calculations for Section 1: Yesterday at a glance ---
  const yesterdayYield = cows.reduce((sum, c) => sum + (c.yesterdayYield ?? 0), 0);
  const cowsMilking = cows.filter((c) => c.status === "milking").length;
  const underTreatment = cows.filter((c) => c.isWithholding).length;

  // Barley deliveries this season
  const activeContract = contracts.find((c) => c.crop === "barley" && c.status === "active");
  const contractDeliveries = activeContract
    ? deliveries.filter((d) => d.contractId === activeContract._id)
    : [];
  const barleyDelivered = contractDeliveries.reduce((sum, d) => sum + d.bags, 0);

  // --- Dynamic WoW Calculations ---
  const yesterdayDate = yesterday;
  const sevenDaysAgoDate = new Date(yesterdayDate);
  sevenDaysAgoDate.setDate(sevenDaysAgoDate.getDate() - 7);
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split("T")[0]; // "2026-05-11"

  const sevenDaysAgoYield = milkingAudit
    .filter((s) => s.date === sevenDaysAgoStr)
    .reduce((sum, s) => sum + s.litres, 0);
  const yieldWoW = yesterdayYield - sevenDaysAgoYield;

  const milkingYesterdayCount = new Set(
    milkingAudit.filter((s) => s.date === yesterdayDateStr).map((s) => s.cowId)
  ).size;
  const milkingSevenDaysAgoCount = new Set(
    milkingAudit.filter((s) => s.date === sevenDaysAgoStr).map((s) => s.cowId)
  ).size;
  const cowsMilkingWoW = milkingYesterdayCount - milkingSevenDaysAgoCount;

  const activeYesterdayTreatments = treatments.filter(
    (t) => t.date <= yesterdayDate.getTime() && t.withholdingUntil > yesterdayDate.getTime()
  ).length;
  const activeSevenDaysAgoTreatments = treatments.filter(
    (t) => t.date <= sevenDaysAgoDate.getTime() && t.withholdingUntil > sevenDaysAgoDate.getTime()
  ).length;
  const treatmentWoW = activeYesterdayTreatments - activeSevenDaysAgoTreatments;

  const last7DaysDeliveries = deliveries
    .filter((d) => d.date >= sevenDaysAgoDate.getTime() && d.date <= yesterdayDate.getTime())
    .reduce((sum, d) => sum + d.bags, 0);
  const previous7DaysDeliveries = deliveries
    .filter((d) => d.date >= sevenDaysAgoDate.getTime() - 7 * 24 * 60 * 60 * 1000 && d.date < sevenDaysAgoDate.getTime())
    .reduce((sum, d) => sum + d.bags, 0);
  const deliveriesWoW = last7DaysDeliveries - previous7DaysDeliveries;

  const formatWoW = (val: number, unit: string = "") => {
    const icon = val >= 0 ? "▲" : "▼";
    const absVal = Math.abs(val);
    const color = val >= 0 ? "text-[#1E8E3E]" : "text-[#D93025]";
    return { icon, text: `${absVal.toFixed(val % 1 === 0 ? 0 : 1)} ${unit} WoW`, color };
  };

  const formatTreatmentWoW = (val: number) => {
    const icon = val >= 0 ? "▲" : "▼";
    const absVal = Math.abs(val);
    const color = val <= 0 ? "text-[#1E8E3E]" : "text-[#D93025]"; // Less treatment is good
    return { icon, text: `${absVal} WoW`, color };
  };

  const yieldByDateMap = milkYieldByDate(milkingAudit);
  const chartData = yieldChartSeries(yieldByDateMap, chartRange);

  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;

  const timelineEvents: { id: string; type: string; date: number; title: string; desc: string }[] = [];

  // Calvings in the past 7 days
  calvings
    .filter((c) => c.date >= oneWeekAgo)
    .forEach((c) => {
      const cowName = cows.find((cw) => cw._id === c.cowId)?.name ?? "Cow";
      timelineEvents.push({
        id: `calving-${c._id}`,
        type: "calving",
        date: c.date,
        title: `Calving Registered`,
        desc: `${cowName} delivered a ${c.calfSex === "M" ? "Bull" : "Heifer"} calf. Sire: ${c.sireInfo}.`,
      });
    });

  // Treatments in the past 7 days
  treatments
    .filter((t) => t.date >= oneWeekAgo)
    .forEach((t) => {
      const cowName = cows.find((cw) => cw._id === t.cowId)?.name ?? "Cow";
      timelineEvents.push({
        id: `treatment-${t._id}`,
        type: "treatment",
        date: t.date,
        title: `Treatment Started`,
        desc: `${cowName} adminstered ${t.drugAdministered} for ${t.condition}. Withholding: ${t.withholdingDays} days.`,
      });
    });

  // Withholding cleared in the past 7 days
  treatments
    .filter((t) => t.withholdingUntil >= oneWeekAgo && t.withholdingUntil <= now)
    .forEach((t) => {
      const cowName = cows.find((cw) => cw._id === t.cowId)?.name ?? "Cow";
      timelineEvents.push({
        id: `clear-${t._id}`,
        type: "clear",
        date: t.withholdingUntil,
        title: `Withholding Cleared`,
        desc: `${cowName}'s withholding lock has expired. Milk cleared for dispatch.`,
      });
    });

  // Deliveries in the past 7 days
  deliveries
    .filter((d) => d.date >= oneWeekAgo)
    .forEach((d) => {
      timelineEvents.push({
        id: `delivery-${d._id}`,
        type: "delivery",
        date: d.date,
        title: `Barley Delivered`,
        desc: `Dispatched ${d.bags} bags via vehicle ${d.vehicleRef}.`,
      });
    });

  // Sort events newest first
  const sortedEvents = timelineEvents.sort((a, b) => b.date - a.date);

  // --- Section 4: Operations Summary metrics ---
  const totalAcreage = fields.reduce((sum, f) => sum + f.acres, 0);
  const activeContractsCount = contracts.filter((c) => c.status === "active").length;
  const contractValue = contracts.reduce((sum, c) => sum + c.contractedBags * c.pricePerBag, 0);
  const averageYieldPerCow = cowsMilking > 0 ? yesterdayYield / cowsMilking : 0;

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      {/* Page Title & Header */}
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Executive Command Portal
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Overview
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          This week at Elfam, as of {new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Section 1: Yesterday at a glance */}
      <section className="space-y-4">
        <h3 className="text-xs font-black uppercase tracking-wider text-[#5F6368]">Yesterday at a glance</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-6">
          {/* Card 1: Yesterday's Yield */}
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-2">
            <span className="text-[11px] font-black text-[#5F6368] uppercase tracking-wider block">Yesterday's Yield</span>
            <div className="text-3xl font-black text-[#202124] font-mono">
              {yesterdayYield.toFixed(1)} <span className="text-xs font-bold text-[#5F6368]">L</span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(yieldWoW, "L").color}`}>
              <span className="text-xs">{formatWoW(yieldWoW, "L").icon}</span> {formatWoW(yieldWoW, "L").text}
            </div>
          </div>

          {/* Card 2: Cows Milking */}
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-2">
            <span className="text-[11px] font-black text-[#5F6368] uppercase tracking-wider block">Cows Milking</span>
            <div className="text-3xl font-black text-[#202124] font-mono">
              {cowsMilking}
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(cowsMilkingWoW).color}`}>
              <span className="text-xs">{formatWoW(cowsMilkingWoW).icon}</span> {formatWoW(cowsMilkingWoW).text}
            </div>
          </div>

          {/* Card 3: Under Treatment */}
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-2">
            <span className="text-[11px] font-black text-[#D93025] uppercase tracking-wider block">Under Treatment</span>
            <div className="text-3xl font-black text-[#D93025] font-mono">
              {underTreatment}
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatTreatmentWoW(treatmentWoW).color}`}>
              <span className="text-xs">{formatTreatmentWoW(treatmentWoW).icon}</span> {formatTreatmentWoW(treatmentWoW).text}
            </div>
          </div>

          {/* Card 4: Barley Delivered */}
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-2">
            <span className="text-[11px] font-black text-[#5F6368] uppercase tracking-wider block">Barley Delivered</span>
            <div className="text-3xl font-black text-[#202124] font-mono">
              {barleyDelivered} <span className="text-xs font-bold text-[#5F6368]">Bags</span>
            </div>
            <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(deliveriesWoW, "Bags").color}`}>
              <span className="text-xs">{formatWoW(deliveriesWoW, "Bags").icon}</span> {formatWoW(deliveriesWoW, "Bags").text}
            </div>
          </div>

          {/* Card 5: Rainfall */}
          <div className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-2">
            <span className="text-[11px] font-black text-[#5F6368] uppercase tracking-wider block">Rainfall (Latest)</span>
            <div className="text-3xl font-black text-primary font-mono">
              {latestRain ? latestRain.amountMm.toFixed(1) : "0.0"} <span className="text-xs font-bold text-[#5F6368]">mm</span>
            </div>
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#5F6368] uppercase tracking-wider">
              {latestRain ? `Date: ${latestRain.date}` : "No logs recorded"}
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: This week yield chart */}
      <section className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-[#DADCE0] pb-4">
          <div>
            <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">Daily yield, last {chartRange} days</h3>
            <span className="text-[11px] text-[#5F6368] uppercase tracking-wider font-bold">Consolidated milking tank logs</span>
          </div>
          <div className="flex border border-[#DADCE0] rounded-xl overflow-hidden bg-[#F8F9FA]">
            {([7, 30, 60] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`px-4 py-2 text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${
                  chartRange === range ? "bg-primary text-white" : "text-[#5F6368] hover:text-[#202124] hover:bg-[#E3E6EC]"
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#5F6368] font-medium">
              No milking sessions logged yet for this period.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="colorLitres" x1="0" y1="0" x2="0" y2="1">
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
                dataKey="litres" 
                stroke="#1A56DB" 
                strokeWidth={2} 
                fillOpacity={1} 
                fill="url(#colorLitres)" 
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Grid for Section 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 3: What changed this week */}
        <section className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
            What changed this week
          </h3>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedEvents.length === 0 ? (
              <p className="text-xs text-[#5F6368] italic font-semibold py-4 text-center">
                No events recorded this week.
              </p>
            ) : (
              sortedEvents.map((evt) => (
                <div key={evt.id} className="flex gap-4 items-start text-xs font-semibold">
                  <div className={`p-2 rounded-xl mt-0.5 shrink-0 ${
                    evt.type === "calving" ? "bg-[#E3FCEF] text-[#1E8E3E]" :
                    evt.type === "treatment" ? "bg-[#FFEBE6] text-[#D93025]" :
                    evt.type === "clear" ? "bg-[#E3FCEF] text-[#1E8E3E]" :
                    "bg-primary-subtle text-primary"
                  }`}>
                    {evt.type === "calving" && <Layers className="h-4.5 w-4.5" />}
                    {evt.type === "treatment" && <ShieldAlert className="h-4.5 w-4.5" />}
                    {evt.type === "clear" && <Layers className="h-4.5 w-4.5" />}
                    {evt.type === "delivery" && <Tractor className="h-4.5 w-4.5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#202124]">{evt.title}</span>
                      <span className="text-[10px] text-[#7A869A] font-mono">
                        {new Date(evt.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-[#5F6368] font-medium leading-relaxed">
                      {evt.desc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 4: Operations summary */}
        <section className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
            Operations summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* Dairy Card */}
            <div className="bg-[#F8F9FA] border border-[#DADCE0] p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">Dairy</span>
              <div className="space-y-1 text-xs font-semibold text-[#202124]">
                <div className="flex justify-between">
                  <span>Milking</span>
                  <span className="font-bold">{cowsMilking}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Yield</span>
                  <span className="font-bold font-mono">{averageYieldPerCow.toFixed(1)} L</span>
                </div>
              </div>
            </div>

            {/* Cereals Card */}
            <div className="bg-[#F8F9FA] border border-[#DADCE0] p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">Cereals</span>
              <div className="space-y-1 text-xs font-semibold text-[#202124]">
                <div className="flex justify-between">
                  <span>Contracts</span>
                  <span className="font-bold">{activeContractsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress</span>
                  <span className="font-bold font-mono">{barleyDelivered} Bags</span>
                </div>
              </div>
            </div>

            {/* Land Card */}
            <div className="bg-[#F8F9FA] border border-[#DADCE0] p-4 rounded-xl space-y-2">
              <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">Land</span>
              <div className="space-y-1 text-xs font-semibold text-[#202124]">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold font-mono">{totalAcreage} Ac</span>
                </div>
                <div className="flex justify-between">
                  <span>Contracts Value</span>
                  <span className="font-bold font-mono text-primary">KES {(contractValue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-[#DADCE0] flex justify-between items-center text-xs">
            <span className="font-bold text-[#5F6368]">Full operational details</span>
            <Link 
              href="/owner/reports" 
              className="text-primary hover:underline font-black uppercase tracking-wider text-[10px] flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Print Audit Report</span>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
