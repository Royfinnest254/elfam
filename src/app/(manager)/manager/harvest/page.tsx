"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function ManagerHarvestPage() {
  const fields = useQuery(api.records.listFields);

  if (fields === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading harvest registers...</div>;
  }

  // Generate hardcoded high-fidelity mock records matching Elfam's actual operations
  const harvestRecords = [
    { id: 1, fieldName: "Moiben North A", crop: "barley", yieldBags: 720, date: "2025-11-15", season: "2025", grade: "Premium Malt" },
    { id: 2, fieldName: "Moiben North B", crop: "barley", yieldBags: 650, date: "2025-11-20", season: "2025", grade: "Premium Malt" },
    { id: 3, fieldName: "Central Flat 1", crop: "wheat", yieldBags: 980, date: "2025-12-05", season: "2025", grade: "Grade 1 Milling" },
    { id: 4, fieldName: "Central Flat 2", crop: "wheat", yieldBags: 1100, date: "2025-12-10", season: "2025", grade: "Grade 1 Milling" },
  ];

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Land Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Cereal Harvest Register
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Season records for wheat and contracted malting barley</p>
      </header>

      {/* Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">Barley Harvested (2025)</span>
          <strong className="text-2xl font-black uppercase text-[#091E42] block mt-2">1,370 Bags</strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">Wheat Harvested (2025)</span>
          <strong className="text-2xl font-black uppercase text-[#091E42] block mt-2">2,080 Bags</strong>
        </div>
        <div className="system-card p-6 flex flex-col justify-between">
          <span className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block">Total Grains Stored</span>
          <strong className="text-2xl font-black uppercase text-primary block mt-2">3,450 Bags</strong>
        </div>
      </div>

      {/* Harvest Log Table */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Harvest Ledger History</h3>
        <div className="overflow-x-auto table-scroll custom-scrollbar">
          <table className="w-full text-left text-xs divide-y divide-[#DFE1E6]">
            <thead>
              <tr className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider bg-[#F4F5F7]">
                <th className="p-4">Field Block</th>
                <th className="p-4">Crop Type</th>
                <th className="p-4">Season</th>
                <th className="p-4">Yield (90Kg Bags)</th>
                <th className="p-4">Quality Grade</th>
                <th className="p-4">Harvest Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE1E6] font-medium text-[#091E42]">
              {harvestRecords.map((record: any) => (
                <tr key={record.id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                  <td className="p-4 font-bold text-[#091E42]">{record.fieldName}</td>
                  <td className="p-4">
                    <span className="status-badge bg-primary-subtle text-primary border border-primary-subtle text-[9px] uppercase px-1.5 py-0.5">
                      {record.crop}
                    </span>
                  </td>
                  <td className="p-4 font-mono text-[#5E6C84]">{record.season}</td>
                  <td className="p-4 font-mono font-bold text-primary">{record.yieldBags} Bags</td>
                  <td className="p-4 font-bold text-[#006644]">{record.grade}</td>
                  <td className="p-4 text-[#5E6C84]">{new Date(record.date).toLocaleDateString("en-GB")}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

