"use client";

import React from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ShieldAlert, CheckCircle } from "lucide-react";

export default function ManagerWithholdingPage() {
  const simNow = 1779205903000; // Match seeded database timestamp
  const activeWithholdings = useQuery(api.cows.getActiveWithholdings, { now: simNow });

  if (activeWithholdings === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading warning registers...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Quality Control
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Milk Safety Warnings List
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Cows with active drug withdrawals. Milk must NOT enter the main bulk tank.</p>
      </header>

      {activeWithholdings.length === 0 ? (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] p-6 rounded-2xl flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-[#006644] shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-[#006644] tracking-wider">All milk clean</h4>
            <p className="text-xs font-semibold text-[#006644] opacity-80">Zero cows currently flagged under active medical withholding lockdowns.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] p-6 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-[#BF2600] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-[#BF2600] tracking-wider">Lockout Safeguard Active</h4>
              <p className="text-xs font-semibold text-[#BF2600] opacity-80">
                {activeWithholdings.length} cows are currently under medication withdrawal periods. Check and lock their daily yield buckets during PM and AM milking sessions.
              </p>
            </div>
          </div>

          <div className="system-card p-6">
            <div className="overflow-x-auto table-scroll custom-scrollbar">
              <table className="w-full text-left text-xs divide-y divide-[#DFE1E6]">
                <thead>
                  <tr className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider bg-[#F4F5F7]">
                    <th className="p-4">Cow Tag</th>
                    <th className="p-4">Cow Name</th>
                    <th className="p-4">Condition Treated</th>
                    <th className="p-4">Medicine Used</th>
                    <th className="p-4">Safety Date (End)</th>
                    <th className="p-4">Time Remaining</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE1E6] font-medium text-[#091E42]">
                  {activeWithholdings.map(({ cow, treatment }: { cow: any; treatment: any }) => {
                    const timeLeftMs = treatment.withholdingUntil - simNow;
                    const daysRemaining = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));
                    
                    return (
                      <tr key={cow._id} className="hover:bg-[#F4F5F7]/50 transition-colors">
                        <td className="p-4 font-mono font-bold text-primary">{cow.tagNumber}</td>
                        <td className="p-4 font-bold">{cow.name}</td>
                        <td className="p-4">{treatment.condition}</td>
                        <td className="p-4 font-bold">{treatment.drugAdministered}</td>
                        <td className="p-4 font-mono text-[#BF2600] font-bold">
                          {new Date(treatment.withholdingUntil).toLocaleDateString("en-GB")}
                        </td>
                        <td className="p-4">
                          <span className="status-badge bg-[#FFEBE6] text-[#BF2600] border border-[#FFBDAD] text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                            {daysRemaining} DAYS LOCKED
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


