"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";

export default function ManagerCalvesPage() {
  const calves = useQuery(api.records.listCalves);

  if (calves === undefined) {
    return <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">Loading calves register...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Herd Registry
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Calves Directory
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">Registry of young stock heifers and bull calves under weaning age</p>
      </header>

      {/* Calves list */}
      <div className="system-card p-6 space-y-4">
        {calves.length === 0 ? (
          <p className="text-xs text-[#5F6368] italic font-semibold">No young calves registered in database.</p>
        ) : (
          <div className="overflow-x-auto table-scroll custom-scrollbar">
            <table className="w-full text-left text-xs divide-y divide-[#DADCE0]">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider bg-[#F8F9FA]">
                  <th className="p-4">Calf Tag</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Sex</th>
                  <th className="p-4">Date of Birth</th>
                  <th className="p-4">Current Weight</th>
                  <th className="p-4">Sire Info</th>
                  <th className="p-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-medium text-[#202124]">
                {calves.map((calf: any) => (
                  <tr key={calf._id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                    <td className="p-4 font-mono font-bold text-primary">{calf.tagNumber}</td>
                    <td className="p-4 font-bold">{calf.name}</td>
                    <td className="p-4 font-semibold">{calf.sex === "F" ? "Heifer (F)" : "Bull (M)"}</td>
                    <td className="p-4 font-mono text-[#5F6368]">{new Date(calf.dateOfBirth).toLocaleDateString("en-GB")}</td>
                    <td className="p-4 font-mono">{calf.currentWeight} Kg</td>
                    <td className="p-4 font-mono text-[#5F6368]">{calf.sireInfo}</td>
                    <td className="p-4">
                      <span className="status-badge status-ok text-[9px] uppercase px-2 py-0.5">
                        {calf.status}
                      </span>
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

