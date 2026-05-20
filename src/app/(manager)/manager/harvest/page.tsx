"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function ManagerHarvestPage() {
  const cropBlocks = useQuery(api.records.listCropBlocks);
  const cropActivities = useQuery(api.records.listCropActivities, {});

  if (cropBlocks === undefined || cropActivities === undefined) {
    return (
      <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">
        Loading harvest registers...
      </div>
    );
  }

  // Filter only harvesting activities
  const harvestActivities = cropActivities.filter(
    (a: any) => a.type === "harvesting"
  );

  // Enrich with crop block name
  const blockMap = Object.fromEntries(
    (cropBlocks ?? []).map((b: any) => [b._id, b])
  );

  const enriched = harvestActivities.map((a: any) => ({
    ...a,
    block: blockMap[a.cropBlockId] ?? null,
  }));

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Land Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Cereal Harvest Register
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">
          Season records for harvested crop blocks
        </p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">
            Harvest Events Logged
          </span>
          <strong className="text-2xl font-black uppercase text-[#091E42] block mt-2">
            {enriched.length}
          </strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">
            Total Quantity Harvested
          </span>
          <strong className="text-2xl font-black uppercase text-primary block mt-2">
            {enriched.reduce((sum: number, a: any) => sum + (a.quantityHarvested ?? 0), 0).toLocaleString()}
          </strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">
            Harvested Blocks
          </span>
          <strong className="text-2xl font-black uppercase text-[#091E42] block mt-2">
            {new Set(enriched.map((a: any) => a.cropBlockId)).size}
          </strong>
        </div>
      </div>

      {/* Harvest Log Table */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">
          Harvest Activity Log
        </h3>

        {enriched.length === 0 ? (
          <div className="py-16 text-center">
            <p className="text-sm font-semibold text-[#5E6C84] uppercase tracking-wider">
              No harvest records yet
            </p>
            <p className="text-xs text-[#9CA3AF] mt-2">
              Harvest activities logged by workers will appear here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto table-scroll custom-scrollbar">
            <table className="w-full text-left text-xs divide-y divide-[#DFE1E6]">
              <thead>
                <tr className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider bg-[#F4F5F7]">
                  <th className="p-4">Crop Block</th>
                  <th className="p-4">Crop</th>
                  <th className="p-4">Category</th>
                  <th className="p-4">Qty Harvested</th>
                  <th className="p-4">Activity Date</th>
                  <th className="p-4">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] font-medium text-[#091E42]">
                {enriched.map((activity: any) => (
                  <tr
                    key={activity._id}
                    className="hover:bg-[#F4F5F7]/50 transition-colors"
                  >
                    <td className="p-4 font-bold text-[#091E42]">
                      {activity.block?.name ?? "Unknown Block"}
                    </td>
                    <td className="p-4">
                      <span className="status-badge bg-primary-subtle text-primary border border-primary-subtle text-[9px] uppercase px-1.5 py-0.5">
                        {activity.block?.crop ?? "—"}
                      </span>
                    </td>
                    <td className="p-4 text-[#5E6C84]">
                      {activity.block?.category ?? "—"}
                    </td>
                    <td className="p-4 font-mono font-bold text-primary">
                      {activity.quantityHarvested != null
                        ? activity.quantityHarvested.toLocaleString()
                        : "—"}
                    </td>
                    <td className="p-4 text-[#5E6C84]">
                      {new Date(activity.activityDate).toLocaleDateString("en-GB")}
                    </td>
                    <td className="p-4 text-[#5E6C84] max-w-[200px] truncate">
                      {activity.notes || "—"}
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
