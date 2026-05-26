"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, TrendingDown, ClipboardList, Layers, Tractor, ShieldAlert, FileText, CheckCircle2 } from "lucide-react";
import { getFarmClock, milkYieldByDate, yieldChartSeries } from "@/lib/farmClock";

const LeafLogo = () => (
  <svg className="w-5 h-5 text-moss shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2a15 15 0 0 0-9 13 15 15 0 0 0 18 0 15 15 0 0 0-9-13Z" />
    <path d="M12 2v20" />
  </svg>
);

export default function SupervisorDashboardPage() {
  const { now, yesterdayDateStr, yesterday } = getFarmClock();
  const livestockData = useQuery(api.livestock.getLivestockDashboard, { now, yesterdayDateStr });
  const fields = useQuery(api.records.listFields);
  const contracts = useQuery(api.records.listContracts);
  const deliveries = useQuery(api.records.listAllDeliveries);
  const calvings = useQuery(api.records.listCalvings);
  const treatments = useQuery(api.records.listAllTreatments);
  const productionAudit = useQuery(api.records.getMilkingAudit, { limit: 1000 });
  const rainfallLogs = useQuery(api.records.listRainfall);

  // Tab range for the chart
  const [chartRange, setChartRange] = useState<7 | 30 | 60>(60);

  if (
    livestockData === undefined ||
    fields === undefined ||
    contracts === undefined ||
    deliveries === undefined ||
    calvings === undefined ||
    treatments === undefined ||
    productionAudit === undefined ||
    rainfallLogs === undefined
  ) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-paper text-muted">
        <span className="text-xs font-mono uppercase tracking-widest font-semibold animate-pulse">
          Loading supervisor dashboard...
        </span>
      </div>
    );
  }

  // Map production records for compatibility with farmClock chart/WoW helpers
  const mappedMilkingAudit = productionAudit
    .filter((s) => s.type === "milk")
    .map((s) => ({
      ...s,
      litres: s.amount,
      cowId: s.livestockId ?? "",
    }));

  // --- Calculations for Rainfall ---
  const latestRain = rainfallLogs && rainfallLogs.length > 0 ? rainfallLogs[0] : null;

  // --- Calculations for Section 1: Yesterday at a glance ---
  // Sum yesterday's milk yield from dairy individual livestock (cattle and goats)
  const yesterdayYield = livestockData.individual
    .filter((c) => c.species === "cattle" || c.species === "goat")
    .reduce((sum, c) => sum + (c.yesterdayYield ?? 0), 0);

  const milkingAnimalsCount = livestockData.individual.filter((c) => c.status === "milking").length;
  
  // Total count under medical treatment/withholding
  const underTreatment = livestockData.individual.filter((c) => c.isWithholding).length +
    livestockData.groups.filter((g) => g.isWithholding).length;

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
  const sevenDaysAgoStr = sevenDaysAgoDate.toISOString().split("T")[0];

  const sevenDaysAgoYield = mappedMilkingAudit
    .filter((s) => s.date === sevenDaysAgoStr)
    .reduce((sum, s) => sum + s.litres, 0);
  const yieldWoW = yesterdayYield - sevenDaysAgoYield;

  const milkingYesterdayCount = new Set(
    mappedMilkingAudit.filter((s) => s.date === yesterdayDateStr).map((s) => s.cowId)
  ).size;
  const milkingSevenDaysAgoCount = new Set(
    mappedMilkingAudit.filter((s) => s.date === sevenDaysAgoStr).map((s) => s.cowId)
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
    const color = val >= 0 ? "text-[#6b8e5a]" : "text-[#a8341f]";
    return { icon, text: `${absVal.toFixed(val % 1 === 0 ? 0 : 1)} ${unit} WoW`, color };
  };

  const formatTreatmentWoW = (val: number) => {
    const icon = val >= 0 ? "▲" : "▼";
    const absVal = Math.abs(val);
    const color = val <= 0 ? "text-[#6b8e5a]" : "text-[#a8341f]"; // Less treatment is good
    return { icon, text: `${absVal} WoW`, color };
  };

  const yieldByDateMap = milkYieldByDate(mappedMilkingAudit);
  const chartData = yieldChartSeries(yieldByDateMap, chartRange);

  const oneWeekAgo = now - 7 * 24 * 60 * 60 * 1000;
  const timelineEvents: { id: string; type: string; date: number; title: string; desc: string }[] = [];

  // Birth events in the past 7 days
  calvings
    .filter((c) => c.date >= oneWeekAgo)
    .forEach((c) => {
      const parentName = livestockData.individual.find((cw) => cw._id === c.cowId)?.name ?? "Animal";
      timelineEvents.push({
        id: `calving-${c._id}`,
        type: "calving",
        date: c.date,
        title: `Offspring Born`,
        desc: `${parentName} delivered an offspring (Sex: ${c.calfSex}). Complications: ${c.complications || "None"}.`,
      });
    });

  // Treatments in the past 7 days
  treatments
    .filter((t) => t.date >= oneWeekAgo)
    .forEach((t) => {
      const subjectName = t.livestockId
        ? (livestockData.individual.find((cw) => cw._id === t.livestockId)?.name ?? "Animal")
        : (livestockData.groups.find((g) => g._id === t.groupId)?.name ?? "Group");
      timelineEvents.push({
        id: `treatment-${t._id}`,
        type: "treatment",
        date: t.date,
        title: `Treatment Registered`,
        desc: `${subjectName} administered ${t.drugAdministered} for ${t.condition}. Withholding: ${t.withholdingDays} days.`,
      });
    });

  // Withholding cleared in the past 7 days
  treatments
    .filter((t) => t.withholdingUntil >= oneWeekAgo && t.withholdingUntil <= now)
    .forEach((t) => {
      const subjectName = t.livestockId
        ? (livestockData.individual.find((cw) => cw._id === t.livestockId)?.name ?? "Animal")
        : (livestockData.groups.find((g) => g._id === t.groupId)?.name ?? "Group");
      timelineEvents.push({
        id: `clear-${t._id}`,
        type: "clear",
        date: t.withholdingUntil,
        title: `Withholding Cleared`,
        desc: `${subjectName}'s milk/product withholding restriction has expired.`,
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
        title: `Barley Delivery Dispatched`,
        desc: `Shipped ${d.bags} bags under malt barley contract. Vehicle: ${d.vehicleRef}.`,
      });
    });

  // Sort events newest first
  const sortedEvents = timelineEvents.sort((a, b) => b.date - a.date);

  // --- Section 4: Operations Summary metrics ---
  const totalAcreage = fields.reduce((sum, f) => sum + f.acres, 0);
  const activeContractsCount = contracts.filter((c) => c.status === "active").length;
  const contractValue = contracts.reduce((sum, c) => sum + c.contractedBags * c.pricePerBag, 0);
  const averageYieldPerAnimal = milkingAnimalsCount > 0 ? yesterdayYield / milkingAnimalsCount : 0;

  // Species counter
  const cattleCount = livestockData.individual.filter(c => c.species === "cattle").length;
  const goatsCount = livestockData.individual.filter(c => c.species === "goat").length;
  const sheepCount = livestockData.individual.filter(c => c.species === "sheep").length;
  const pigsCount = livestockData.individual.filter(c => c.species === "pig").length;

  const totalPoultry = livestockData.groups
    .filter(g => g.species === "poultry" && g.status === "active")
    .reduce((sum, g) => sum + g.count, 0);

  return (
    <div className="space-y-8 pb-12 bg-paper text-ink">
      {/* Page Title & Header */}
      <header className="border-b border-rule pb-6">
        <span className="font-mono text-xs-label block mb-1">
          Executive Command Portal
        </span>
        <h1 className="font-display text-display text-moss tracking-tight flex items-center gap-2.5">
          <LeafLogo />
          Supervisor Overview
        </h1>
        <p className="font-mono text-[10px] text-muted mt-1 uppercase tracking-wider">
          As of {new Date(now).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })} • Highland Green & Cream Heritage System
        </p>
      </header>

      {/* Section 1: Yesterday at a glance */}
      <section className="space-y-4">
        <h3 className="font-display text-h2 text-moss flex items-center gap-2">
          Yesterday's Logs
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 border-t border-l border-rule">
          {/* Card 1: Yesterday's Yield */}
          <div className="p-6 bg-paper border-r border-b border-rule flex flex-col justify-between rounded-none">
            <span className="font-mono text-xs-label block">Yesterday's Milk Yield¹</span>
            <span className="font-display text-h1 text-moss mt-2 block tracking-tight">
              {yesterdayYield.toFixed(1)} <span className="font-sans text-xs text-muted">Litres</span>
            </span>
            <span className={`flex items-center gap-1 font-mono text-[10px] uppercase mt-2 ${formatWoW(yieldWoW, "L").color}`}>
              <span className="text-[8px]">{formatWoW(yieldWoW, "L").icon}</span> {formatWoW(yieldWoW, "L").text}
            </span>
          </div>

          {/* Card 2: Active Milking Stock */}
          <div className="p-6 bg-paper border-r border-b border-rule flex flex-col justify-between rounded-none">
            <span className="font-mono text-xs-label block">Milking Stock²</span>
            <span className="font-display text-h1 text-moss mt-2 block tracking-tight">
              {milkingAnimalsCount} <span className="font-sans text-xs text-muted">Heads</span>
            </span>
            <span className={`flex items-center gap-1 font-mono text-[10px] uppercase mt-2 ${formatWoW(cowsMilkingWoW).color}`}>
              <span className="text-[8px]">{formatWoW(cowsMilkingWoW).icon}</span> {formatWoW(cowsMilkingWoW).text}
            </span>
          </div>

          {/* Card 3: Under Treatment */}
          <div className="p-6 bg-paper border-r border-b border-rule flex flex-col justify-between rounded-none">
            <span className="font-mono text-xs-label block">Medical Isolation³</span>
            <span className={`font-display text-h1 mt-2 block tracking-tight ${underTreatment > 0 ? "text-alert" : "text-moss"}`}>
              {underTreatment} <span className="font-sans text-xs text-muted">Stock</span>
            </span>
            <span className={`flex items-center gap-1 font-mono text-[10px] uppercase mt-2 ${formatTreatmentWoW(treatmentWoW).color}`}>
              <span className="text-[8px]">{formatTreatmentWoW(treatmentWoW).icon}</span> {formatTreatmentWoW(treatmentWoW).text}
            </span>
          </div>

          {/* Card 4: Barley Delivered */}
          <div className="p-6 bg-paper border-r border-b border-rule flex flex-col justify-between rounded-none">
            <span className="font-mono text-xs-label block">Barley Shipped⁴</span>
            <span className="font-display text-h1 text-moss mt-2 block tracking-tight">
              {barleyDelivered} <span className="font-sans text-xs text-muted">Bags</span>
            </span>
            <span className={`flex items-center gap-1 font-mono text-[10px] uppercase mt-2 ${formatWoW(deliveriesWoW, "Bags").color}`}>
              <span className="text-[8px]">{formatWoW(deliveriesWoW, "Bags").icon}</span> {formatWoW(deliveriesWoW, "Bags").text}
            </span>
          </div>

          {/* Card 5: Rainfall */}
          <div className="p-6 bg-paper border-r border-b border-rule flex flex-col justify-between rounded-none">
            <span className="font-mono text-xs-label block">Precipitation⁵</span>
            <span className="font-display text-h1 text-moss mt-2 block tracking-tight">
              {latestRain ? latestRain.amountMm.toFixed(1) : "0.0"} <span className="font-sans text-xs text-muted">mm</span>
            </span>
            <span className="font-mono text-[9px] text-muted mt-2 block">
              {latestRain ? `Logged: ${latestRain.date}` : "No recent precipitation"}
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: This week yield chart */}
      <section className="border border-rule p-6 bg-paper space-y-6 rounded-none">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-rule pb-4">
          <div>
            <h3 className="font-display text-h2 text-moss flex items-center gap-2">
              Consolidated Milk Output (Last {chartRange} Days)
            </h3>
            <span className="font-mono text-xs-label block mt-0.5">Bulk tank logs (Cattle & Goats)</span>
          </div>
          <div className="flex border border-rule bg-paper">
            {([7, 30, 60] as const).map((range) => (
              <button
                key={range}
                type="button"
                onClick={() => setChartRange(range)}
                className={`px-4 py-1.5 font-mono text-[10px] uppercase tracking-wider transition-all cursor-pointer border-r last:border-r-0 border-rule ${
                  chartRange === range ? "bg-moss text-cream" : "text-moss hover:bg-paper-2"
                }`}
              >
                {range} days
              </button>
            ))}
          </div>
        </div>

        <div className="h-[240px] w-full font-mono text-[10px]">
          {chartData.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-muted font-medium italic">
              No milking yields logged for this duration.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis 
                  dataKey="date" 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), monospace" }} 
                />
                <YAxis 
                  tickLine={false} 
                  axisLine={false} 
                  tick={{ fill: "var(--muted)", fontSize: 10, fontFamily: "var(--font-mono), monospace" }} 
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: "var(--cream)",
                    border: "1px solid var(--border)",
                    borderRadius: "0px",
                    fontSize: "11px",
                    color: "var(--moss)",
                    fontFamily: "var(--font-mono), monospace"
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="litres" 
                  stroke="var(--moss)" 
                  strokeWidth={1.5} 
                  fillOpacity={0.08} 
                  fill="var(--moss)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </section>

      {/* Grid for Section 3 & 4 */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Section 3: What changed this week */}
        <section className="lg:col-span-6 bg-paper border border-rule p-6 space-y-4 rounded-none">
          <h3 className="font-display text-h2 text-moss border-b border-rule pb-3">
            Recent Farm Events
          </h3>
          <div className="space-y-4 max-h-[360px] overflow-y-auto pr-2 custom-scrollbar">
            {sortedEvents.length === 0 ? (
              <p className="text-xs text-muted italic py-4 text-center">
                No events recorded in the last 7 days.
              </p>
            ) : (
              sortedEvents.map((evt) => (
                <div key={evt.id} className="flex gap-4 items-start text-xs border-b border-rule/30 pb-3 last:border-b-0">
                  <div className={`p-1.5 border mt-0.5 shrink-0 rounded-none ${
                    evt.type === "calving" ? "bg-cream text-moss border-moss/20" :
                    evt.type === "treatment" ? "bg-paper-2 text-alert border-alert/20" :
                    evt.type === "clear" ? "bg-paper-2 text-pasture border-pasture/20" :
                    "bg-paper text-moss border-rule"
                  }`}>
                    {evt.type === "calving" && <Layers className="h-4 w-4" />}
                    {evt.type === "treatment" && <ShieldAlert className="h-4 w-4" />}
                    {evt.type === "clear" && <CheckCircle2 className="h-4 w-4" />}
                    {evt.type === "delivery" && <Tractor className="h-4 w-4" />}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-ink font-sans text-xs">{evt.title}</span>
                      <span className="font-mono text-[9px] text-muted">
                        {new Date(evt.date).toLocaleDateString("en-GB", { day: "2-digit", month: "short" })}
                      </span>
                    </div>
                    <p className="text-xs text-muted leading-relaxed font-sans font-medium">
                      {evt.desc}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Section 4: Operations summary */}
        <section className="lg:col-span-6 bg-paper border border-rule p-6 space-y-4 rounded-none">
          <h3 className="font-display text-h2 text-moss border-b border-rule pb-3">
            Operations & Stock Ledger
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 border-t border-l border-rule">
            {/* Livestock Breakdown */}
            <div className="p-4 bg-paper border-r border-b border-rule space-y-2">
              <span className="font-mono text-[9px] text-muted uppercase tracking-wider block font-bold">Livestock Assets</span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Cattle</span>
                  <span className="font-bold text-moss">{cattleCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Goats</span>
                  <span className="font-bold text-moss">{goatsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Sheep</span>
                  <span className="font-bold text-moss">{sheepCount}</span>
                </div>
                {pigsCount > 0 && (
                  <div className="flex justify-between">
                    <span>Pigs</span>
                    <span className="font-bold text-moss">{pigsCount}</span>
                  </div>
                )}
                {totalPoultry > 0 && (
                  <div className="flex justify-between">
                    <span>Poultry</span>
                    <span className="font-bold text-moss">{totalPoultry}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Cereals & Harvest Contracts */}
            <div className="p-4 bg-paper border-r border-b border-rule space-y-2">
              <span className="font-mono text-[9px] text-muted uppercase tracking-wider block font-bold">Agronomic Contracts</span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Contracts</span>
                  <span className="font-bold text-moss">{activeContractsCount}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivered</span>
                  <span className="font-bold text-moss">{barleyDelivered} Bags</span>
                </div>
              </div>
            </div>

            {/* Land Assets */}
            <div className="p-4 bg-paper border-r border-b border-rule space-y-2">
              <span className="font-mono text-[9px] text-muted uppercase tracking-wider block font-bold">Land Acreage</span>
              <div className="space-y-1 text-xs font-mono">
                <div className="flex justify-between">
                  <span>Total Size</span>
                  <span className="font-bold text-moss">{totalAcreage} Ac</span>
                </div>
                <div className="flex justify-between">
                  <span>Valuation</span>
                  <span className="font-bold text-moss">KES {(contractValue / 1000000).toFixed(1)}M</span>
                </div>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-rule flex justify-between items-center text-xs">
            <span className="font-semibold text-muted">Full operational audits</span>
            <Link 
              href="/owner/reports" 
              className="text-moss hover:underline font-mono text-[10px] uppercase font-bold flex items-center gap-1 border border-moss px-2.5 py-1 bg-cream hover:bg-paper-2"
            >
              <FileText className="h-3.5 w-3.5" />
              <span>Print Audit Report</span>
            </Link>
          </div>
        </section>
      </div>

      {/* Footnotes */}
      <footer className="mt-8 pt-4 border-t border-rule/50 text-[10px] text-muted space-y-1 font-mono">
        <div>¹ Total litres of milk yield recorded yesterday from active cattle and goat milking sessions.</div>
        <div>² Total individual heads registered in active milking status yesterday.</div>
        <div>³ Heads & groups currently under active medical withholding restrictions (yield must be discarded).</div>
        <div>⁴ Accumulated bags of malting barley dispatched this season under active EABL contracts.</div>
        <div>⁵ Most recent rainfall depth measured on the farm weather station.</div>
      </footer>
    </div>
  );
}

