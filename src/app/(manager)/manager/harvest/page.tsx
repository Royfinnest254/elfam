"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function ManagerHarvestPage() {
  const fields = useQuery(api.records.listFields);
  const harvests = useQuery(api.records.listAllHarvests);

  if (fields === undefined || harvests === undefined) {
    return (
      <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">
        Loading harvest registers...
      </div>
    );
  }

  // Enrich with field name
  const fieldMap = Object.fromEntries(
    (fields ?? []).map((f: any) => [f._id, f])
  );

  const enriched = (harvests ?? []).map((h: any) => ({
    ...h,
    field: fieldMap[h.fieldId] ?? null,
  }));

  const totalBags = enriched.reduce((sum: number, h: any) => sum + (h.bags ?? 0), 0);

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Land Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Cereal Harvest Register
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Season records for harvested crop fields
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Harvest Events Logged
          </span>
          <strong className="text-2xl font-black uppercase text-[#202124] block mt-2">
            {enriched.length}
          </strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Total Bags Harvested
          </span>
          <strong className="text-2xl font-black uppercase text-primary block mt-2">
            {totalBags.toLocaleString()} <span className="text-xs font-normal">Bags</span>
          </strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Harvested Fields
          </span>
          <strong className="text-2xl font-black uppercase text-[#202124] block mt-2">
            {new Set(enriched.map((h: any) => h.fieldId)).size}
          </strong>
        </div>
      </div>

      {/* Harvest Log Table */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight text-[#202124] border-b border-[#DADCE0] pb-4">
          Harvest Activity Log
        </h3>

        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-[#5F6368] uppercase tracking-wider">
              No harvest records yet
            </p>
            <p className="text-xs text-[#9AA0A6] mt-2">
              Harvest activities logged by workers will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto table-scroll custom-scrollbar">
            <table className="w-full text-left text-xs divide-y divide-[#DADCE0]">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider bg-[#F8F9FA]">
                  <th className="p-4">Field</th>
                  <th className="p-4">Crop</th>
                  <th className="p-4">Bags Yield</th>
                  <th className="p-4">Bag Weight</th>
                  <th className="p-4">Date</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-medium text-[#202124]">
                {enriched.map((h: any) => (
                  <tr
                    key={h._id}
                    className="hover:bg-[#F8F9FA]/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-[#202124]">
                      {h.field?.name ?? "Unknown Field"}
                    </td>
                    <td className="p-4">
                      <span className="status-badge bg-primary-subtle text-primary border border-primary-subtle text-[9px] uppercase px-1.5 py-0.5">
                        {h.crop ?? "—"}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      {h.bags != null ? h.bags.toLocaleString() : "—"}
                    </td>
                    <td className="p-4 text-[#5F6368]">
                      {h.bagWeightKg != null ? `${h.bagWeightKg} kg` : "—"}
                    </td>
                    <td className="p-4 text-[#5F6368]">
                      {new Date(h.date).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4 text-[#5F6368] max-w-[200px] truncate">
                      {h.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
