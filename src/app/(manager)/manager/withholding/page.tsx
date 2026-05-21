"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { ShieldAlert, CheckCircle, ShieldCheck } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ManagerWithholdingPage() {
  const { now } = getFarmClock();
  const activeWithholdings = useQuery(api.cows.getActiveWithholdings, { now });
  const healCowMutation = useMutation(api.records.healCow);

  const [healingCowId, setHealingCowId] = useState<string | null>(null);
  const [healNotes, setHealNotes] = useState("");
  const [healing, setHealing] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleHeal = async (e: React.FormEvent, cowId: string, tagNumber: string) => {
    e.preventDefault();
    setHealing(true);
    try {
      await healCowMutation({
        cowId: cowId as any,
        notes: healNotes.trim() || "Cow cleared by supervisor. Withholding override — milking resumed.",
      });
      setSuccessMsg(`VERIFIED: ${tagNumber} cleared for milking.`);
      setHealingCowId(null);
      setHealNotes("");
      setTimeout(() => setSuccessMsg(null), 4000);
    } catch (err: any) {
      alert(`Heal failed: ${err.message}`);
    } finally {
      setHealing(false);
    }
  };

  if (activeWithholdings === undefined) {
    return <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">Loading warning registers...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Quality Control
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Milk Safety Warnings List
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Cows with active drug withdrawals. Milk must NOT enter the main bulk tank.
        </p>
      </header>

      {successMsg && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] p-4 flex items-center gap-2 text-xs font-semibold">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {successMsg}
        </div>
      )}

      {activeWithholdings.length === 0 ? (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] p-6 rounded-2xl flex items-center gap-4">
          <CheckCircle className="h-6 w-6 text-[#1E8E3E] shrink-0" />
          <div className="space-y-1">
            <h4 className="text-[10px] font-black uppercase text-[#1E8E3E] tracking-wider">All milk clean</h4>
            <p className="text-xs font-semibold text-[#1E8E3E] opacity-80">
              Zero cows currently flagged under active medical withholding lockdowns.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] p-6 rounded-2xl flex items-start gap-4">
            <ShieldAlert className="h-6 w-6 text-[#D93025] shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h4 className="text-[10px] font-black uppercase text-[#D93025] tracking-wider">Lockout Safeguard Active</h4>
              <p className="text-xs font-semibold text-[#D93025] opacity-80">
                {activeWithholdings.length} cows are currently under medication withdrawal periods. Check and lock their daily yield buckets during PM and AM milking sessions.
              </p>
            </div>
          </div>

          <div className="system-card p-6 space-y-4">
            <div className="overflow-x-auto table-scroll custom-scrollbar">
              <table className="w-full text-left text-xs divide-y divide-[#DADCE0]">
                <thead>
                  <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider bg-[#F8F9FA]">
                    <th className="p-4">Cow Tag</th>
                    <th className="p-4">Cow Name</th>
                    <th className="p-4">Condition Treated</th>
                    <th className="p-4">Medicine Used</th>
                    <th className="p-4">Safety Date (End)</th>
                    <th className="p-4">Time Remaining</th>
                    <th className="p-4">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0] font-medium text-[#202124]">
                  {activeWithholdings.map(({ cow, treatment }: { cow: any; treatment: any }) => {
                    const timeLeftMs = treatment.withholdingUntil - now;
                    const daysRemaining = Math.ceil(timeLeftMs / (1000 * 60 * 60 * 24));

                    return (
                      <React.Fragment key={cow._id}>
                        <tr className="hover:bg-[#F8F9FA]/50 transition-colors">
                          <td className="p-4 font-mono font-bold text-primary">{cow.tagNumber}</td>
                          <td className="p-4 font-bold">{cow.name}</td>
                          <td className="p-4">{treatment.condition}</td>
                          <td className="p-4 font-bold">{treatment.drugAdministered}</td>
                          <td className="p-4 font-mono text-[#D93025] font-bold">
                            {new Date(treatment.withholdingUntil).toLocaleDateString("en-GB")}
                          </td>
                          <td className="p-4">
                            <span className="status-badge bg-[#FFEBE6] text-[#D93025] border border-[#FFBDAD] text-[9px] uppercase font-black px-2.5 py-1 rounded-lg">
                              {daysRemaining} DAYS LOCKED
                            </span>
                          </td>
                          <td className="p-4">
                            <button
                              type="button"
                              onClick={() => {
                                setHealingCowId(healingCowId === cow._id ? null : cow._id);
                                setHealNotes("");
                              }}
                              className="h-7 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#ABF5D1] bg-[#E3FCEF] hover:bg-[#C6F6D5] text-[#1E8E3E] flex items-center gap-1 transition-colors cursor-pointer"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              Heal
                            </button>
                          </td>
                        </tr>
                        {healingCowId === cow._id && (
                          <tr>
                            <td colSpan={7} className="p-0">
                              <form
                                onSubmit={(e) => handleHeal(e, cow._id, cow.tagNumber)}
                                className="bg-[#E3FCEF]/40 border-t border-[#ABF5D1] p-4 flex flex-wrap items-end gap-3"
                              >
                                <div className="flex-1 min-w-[240px]">
                                  <label className="text-[9px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                                    Supervisor Clearance Notes
                                  </label>
                                  <input
                                    type="text"
                                    value={healNotes}
                                    onChange={(e) => setHealNotes(e.target.value)}
                                    placeholder="e.g. Vet cleared. Udder healthy. Withholding period elapsed."
                                    className="w-full h-9 border border-[#DADCE0] bg-white px-2.5 text-xs font-semibold text-[#202124] focus:outline-none"
                                  />
                                </div>
                                <button
                                  type="submit"
                                  disabled={healing}
                                  className="h-9 px-4 text-[9px] font-bold uppercase tracking-wider bg-[#1E8E3E] hover:bg-[#166534] text-white transition-colors cursor-pointer disabled:opacity-50"
                                >
                                  <ShieldCheck className="h-3 w-3 inline mr-1" />
                                  VERIFY — Heal & Clear
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setHealingCowId(null)}
                                  className="h-9 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#5F6368] transition-colors cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </form>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
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
