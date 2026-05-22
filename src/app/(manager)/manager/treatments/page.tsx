"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Plus } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ManagerTreatmentsPage() {
  const treatments = useQuery(api.records.listAllTreatments, {}); // empty args lists all
  const livestock = useQuery(api.livestock.list, {});
  const users = useQuery(api.users.list);
  const { now: simNow } = getFarmClock();

  if (treatments === undefined || livestock === undefined || users === undefined) {
    return <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">Loading medical logs...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
            Veterinary Ledger
          </span>
          <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
            Medical Treatments
          </h1>
        </div>
        <Link 
          href="/manager/treatments/new" 
          className="btn-primary h-10 px-5 text-[10px] rounded-[14px] flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          <span>Log Treatment</span>
        </Link>
      </header>

      <div className="system-card p-6 space-y-4">
        {treatments.length === 0 ? (
          <p className="text-xs text-[#5F6368] italic font-semibold">No veterinary medical records logged.</p>
        ) : (
          <div className="overflow-x-auto table-scroll custom-scrollbar">
            <table className="w-full text-left text-xs divide-y divide-[#DADCE0]">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider bg-[#F8F9FA]">
                  <th className="p-4">Date</th>
                  <th className="p-4">Animal Tag</th>
                  <th className="p-4">Medical Issue</th>
                  <th className="p-4">Drug Used</th>
                  <th className="p-4">Dosage</th>
                  <th className="p-4">Withholding</th>
                  <th className="p-4">Safety Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-medium text-[#202124]">
                {treatments.map((t: any) => {
                  const animal = livestock.find((c: any) => c._id === (t.livestockId || t.cowId));
                  const isActive = t.withholdingUntil > simNow;
                  
                  return (
                    <tr key={t._id} className="hover:bg-[#F8F9FA]/50 transition-colors">
                      <td className="p-4 font-mono text-[#5F6368]">{new Date(t.date).toLocaleDateString("en-GB")}</td>
                      <td className="p-4 font-bold font-mono text-primary">{animal ? `${animal.tagNumber} (${animal.name} - ${animal.species})` : "Unknown"}</td>
                      <td className="p-4 font-bold">{t.condition}</td>
                      <td className="p-4">{t.drugAdministered}</td>
                      <td className="p-4 font-mono">{t.dosage}</td>
                      <td className="p-4 font-mono text-[#5F6368]">{t.withholdingDays} Days</td>
                      <td className="p-4">
                        <span className={`status-badge text-[9px] uppercase font-black px-2 py-1 rounded-lg border ${
                          isActive
                            ? "bg-[#FFEBE6] text-[#D93025] border-[#FFBDAD]"
                            : "bg-[#E3FCEF] text-[#1E8E3E] border-[#ABF5D1]"
                        }`}>
                          {isActive ? "ACTIVE WARNING" : "EXPIRED"}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}


