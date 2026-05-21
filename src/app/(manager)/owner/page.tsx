"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ClipboardList, Layers, Tractor, ShieldAlert, FileText } from "lucide-react";
import { getFarmClock, milkYieldByDate, yieldChartSeries } from "@/lib/farmClock";

const LeafLogo = () => (
  <svg className="w-5 h-5 text-[#1A56DB] shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a15 15 0 0 0-9 13 15 15 0 0 0 18 0 15 15 0 0 0-9-13Z" />
    <path d="M12 2v20" />
  </svg>
);

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
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block uppercase tracking-wider font-semibold">Loading executive dashboard...</span>
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
        desc: `${cowName} administered ${t.drugAdministered} for ${t.condition}. Withholding: ${t.withholdingDays} days.`,
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
    <div className="space-y-8 pb-12 bg-white text-[#4B5563]">
      {/* Page Title & Header */}
      <header className="border-b border-gray-200 pb-6">
        <span className="text-xs font-bold uppercase tracking-wider block mb-2 text-[#4B5563]">
          Executive Command Portal
        </span>
        <h1 className="text-3xl font-bold text-black tracking-tight flex items-center gap-2.5">
          <LeafLogo />
          Overview
        </h1>
        <p className="text-xs text-[#4B5563] mt-1 uppercase tracking-wider font-semibold">
          This week at Elfam, as of {new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>

      {/* Section 1: Yesterday at a glance */}
      <section className="space-y-4">
        <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
          <LeafLogo />
          Yesterday at a glance
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-l border-gray-200">
          {/* Card 1: Yesterday's Yield */}
          <div className="p-6 bg-white border-r border-b border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">Yesterday's Yield¹</span>
            <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">
              {yesterdayYield.toFixed(1)} <span className="text-sm font-normal text-[#4B5563]">L</span>
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(yieldWoW, "L").color}`}>
              <span className="text-xs">{formatWoW(yieldWoW, "L").icon}</span> {formatWoW(yieldWoW, "L").text}
            </span>
          </div>

          {/* Card 2: Cows Milking */}
          <div className="p-6 bg-white border-r border-b border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">Cows Milking²</span>
            <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">
              {cowsMilking}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(cowsMilkingWoW).color}`}>
              <span className="text-xs">{formatWoW(cowsMilkingWoW).icon}</span> {formatWoW(cowsMilkingWoW).text}
            </span>
          </div>

          {/* Card 3: Under Treatment */}
          <div className="p-6 bg-white border-r border-b border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">Under Treatment³</span>
            <span className={`text-3xl font-bold mt-2 block tracking-tight font-sans ${underTreatment > 0 ? "text-[#D93025]" : "text-black"}`}>
              {underTreatment}
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatTreatmentWoW(treatmentWoW).color}`}>
              <span className="text-xs">{formatTreatmentWoW(treatmentWoW).icon}</span> {formatTreatmentWoW(treatmentWoW).text}
            </span>
          </div>

          {/* Card 4: Barley Delivered */}
          <div className="p-6 bg-white border-r border-b border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">Barley Delivered⁴</span>
            <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">
              {barleyDelivered} <span className="text-sm font-normal text-[#4B5563]">Bags</span>
            </span>
            <span className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider ${formatWoW(deliveriesWoW, "Bags").color}`}>
              <span className="text-xs">{formatWoW(deliveriesWoW, "Bags").icon}</span> {formatWoW(deliveriesWoW, "Bags").text}
            </span>
          </div>

          {/* Card 5: Rainfall */}
          <div className="p-6 bg-white border-r border-b border-gray-200 flex flex-col justify-between">
            <span className="text-xs font-bold text-black uppercase tracking-wider block">Rainfall⁵</span>
            <span className="text-3xl font-bold text-black mt-2 block tracking-tight font-sans">
              {latestRain ? latestRain.amountMm.toFixed(1) : "0.0"} <span className="text-sm font-normal text-[#4B5563]">mm</span>
            </span>
            <span className="text-[11px] font-bold text-[#4B5563] uppercase tracking-wider">
              {latestRain ? `Date: ${latestRain.date}` : "No logs recorded"}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: This week yield chart */}
      <section className="border border-gray-200 p-6 bg-white space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gray-200 pb-4">
          <div>
            <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2">
              <LeafLogo />
              Daily yield, last {chartRange} days
            </h3>
            <span className="text-xs text-[#4B5563] uppercase tracking-wider font-semibold">Consolidated milking tank logs</span>
          </div>
          <div className="flex border border-gray-200 bg-white">
            {([7, 30, 60] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer border-r last:border-r-0 border-gray-200 ${
                  chartRange === range ? "bg-black text-white" : "text-[#4B5563] hover:text-black hover:bg-gray-50"
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px] w-full">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-[#4B5563] font-medium">
              No milking sessions logged yet for this period.
            </div>
          ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <XAxis 
                dataKey="date" 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#4B5563", fontSize: 10, fontFamily: "var(--font-sans), Inter, sans-serif" }} 
              />
              <YAxis 
                tickLine={false} 
                axisLine={false} 
                tick={{ fill: "#4B5563", fontSize: 10, fontFamily: "var(--font-sans), Inter, sans-serif" }} 
              />
              <Tooltip 
                contentStyle={{
                  backgroundColor: "#FFFFFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "0px",
                  fontSize: "11px",
                  fontWeight: "bold",
                  color: "#000000",
                  fontFamily: "var(--font-sans), Inter, sans-serif"
                }}
              />
              <Area 
                type="monotone" 
                dataKey="litres" 
                stroke="#1A56DB" 
                strokeWidth={1.5} 
                fillOpacity={0.05} 
                fill="#1A56DB" 
              />
            </AreaChart>
          </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Grid for Section 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 3: What changed this week */}
        <section className="lg:col-span-6 bg-white border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2 border-b border-gray-200 pb-3">
            <LeafLogo />
            What changed this week
          </h3>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedEvents.length === 0 ? (
              <p className="text-xs text-[#4B5563] italic font-semibold py-4 text-center">
                No events recorded this week.
              </p>
            ) : (
              sortedEvents.map((evt) => (
                <div key={evt.id} className="flex gap-4 items-start text-xs font-semibold">
                  <div className={`p-2 border mt-0.5 shrink-0 rounded-none ${
                    evt.type === "calving" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#A8D5B5]" :
                    evt.type === "treatment" ? "bg-[#FCE8E6] text-[#D93025] border-[#F5C6C3]" :
                    evt.type === "clear" ? "bg-[#E6F4EA] text-[#1E8E3E] border-[#A8D5B5]" :
                    "bg-[#E8F0FE] text-[#1A56DB] border-[#1A56DB]/20"
                  }`}>
                    {evt.type === "calving" && <Layers className="h-4.5 w-4.5" />}
                    {evt.type === "treatment" && <ShieldAlert className="h-4.5 w-4.5" />}
                    {evt.type === "clear" && <Layers className="h-4.5 w-4.5" />}
                    {evt.type === "delivery" && <Tractor className="h-4.5 w-4.5" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-black">{evt.title}</span>
                      <span className="text-[10px] text-[#4B5563] font-sans">
                        {new Date(evt.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-[#4B5563] font-medium leading-relaxed">
                      {evt.desc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 4: Operations summary */}
        <section className="lg:col-span-6 bg-white border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-bold text-black tracking-tight flex items-center gap-2 border-b border-gray-200 pb-3">
            <LeafLogo />
            Operations summary
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-gray-200">
            {/* Dairy Card */}
            <div className="p-4 bg-white border-r border-b border-gray-200 space-y-2">
              <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider block">Dairy</span>
              <div className="space-y-1 text-xs text-[#4B5563]">
                <div className="flex justify-between">
                  <span>Milking</span>
                  <span className="font-bold text-black">{cowsMilking}</span>
                </div>
                <div className="flex justify-between">
                  <span>Avg Yield</span>
                  <span className="font-bold text-black font-sans">{averageYieldPerCow.toFixed(1)} L</span>
                </div>
              </div>
            </div>

            {/* Cereals Card */}
            <div className="p-4 bg-white border-r border-b border-gray-200 space-y-2">
              <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider block">Cereals</span>
              <div className="space-y-1 text-xs text-[#4B5563]">
                <div className="flex justify-between">
                  <span>Contracts</span>
                  <span className="font-bold text-black">{activeContractsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Progress</span>
                  <span className="font-bold text-black font-sans">{barleyDelivered} Bags</span>
                </div>
              </div>
            </div>

            {/* Land Card */}
            <div className="p-4 bg-white border-r border-b border-gray-200 space-y-2">
              <span className="text-[10px] font-black text-[#4B5563] uppercase tracking-wider block">Land</span>
              <div className="space-y-1 text-xs text-[#4B5563]">
                <div className="flex justify-between">
                  <span>Total</span>
                  <span className="font-bold text-black font-sans">{totalAcreage} Ac</span>
                </div>
                <div className="flex justify-between">
                  <span>Valuation</span>
                  <span className="font-bold text-black font-sans">KES {(contractValue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-gray-200 flex justify-between items-center text-xs">
            <span className="font-bold text-[#4B5563]">Full operational details</span>
            <Link 
              href="/owner/reports" 
              className="text-[#1A56DB] hover:underline font-black uppercase tracking-wider text-[10px] flex items-center gap-1"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Print Audit Report</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Footnotes */}
      <footer className="mt-8 pt-4 border-t border-gray-100 text-[11px] text-[#4B5563] space-y-1">
        <div>¹ Total litres of milk yield recorded yesterday from active herd milking sessions.</div>
        <div>² Active milking cow count from yesterday's recorded milkings.</div>
        <div>³ Cows currently under active medical withholding restrictions (milk discarded).</div>
        <div>⁴ Accumulated bags of barley dispatched this season under active contract.</div>
        <div>⁵ Most recent rainfall depth measured on the farm weather station.</div>
      </footer>
    </div>
  );
}
