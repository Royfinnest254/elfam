"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check } from "lucide-react";

export default function ManagerCalvingsPage() {
  const calvings = useQuery(api.records.listCalvings);
  const cows = useQuery(api.cows.list, {});
  const registerCalvingMutation = useMutation(api.records.registerCalving);

  const [cowId, setCowId] = useState("");
  const [calfSex, setCalfSex] = useState<"M" | "F">("F");
  const [calfTagNumber, setCalfTagNumber] = useState("");
  const [sireInfo, setSireInfo] = useState("");
  const [complications, setComplications] = useState("");
  const [notes, setNotes] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCows = cows?.filter((c: any) => c.status !== "deceased" && c.status !== "sold") ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cowId) {
      setError("Please select a dam cow.");
      return;
    }

    try {
      await registerCalvingMutation({
        cowId: cowId as any,
        date: Date.now(),
        calfSex,
        calfTagNumber: calfTagNumber || null,
        sireInfo,
        complications,
        notes,
      });

      setSuccess(true);
      setCowId("");
      setCalfTagNumber("");
      setSireInfo("");
      setComplications("");
      setNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to log calving.");
    }
  };

  if (calvings === undefined || cows === undefined) {
    return <div className="text-xs text-[#5E6C84] uppercase font-black tracking-widest p-8 font-sans">Loading calving logs...</div>;
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Dairy Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Calving Records
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Registry of historical calvings and newborn heifer tracking</p>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-[#006644]" />
          <span>Calving successfully recorded and newborn registered.</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] text-xs font-semibold p-4 rounded-xl">
          [Error] {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Calving logs list */}
        <div className="lg:col-span-7 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Calvings Archive</h3>
          {calvings.length === 0 ? (
            <p className="text-xs text-[#5E6C84] italic font-semibold">No calving events on file.</p>
          ) : (
            <div className="space-y-3 font-semibold text-xs text-[#5E6C84]">
              {calvings.map((c: any) => {
                const dam = cows.find((cow: any) => cow._id === c.cowId);
                return (
                  <div key={c._id} className="p-4 bg-[#F4F5F7] border border-[#DFE1E6] rounded-[18px]">
                    <div className="flex justify-between items-start">
                      <div>
                        <strong className="text-[#091E42]">Dam: {dam?.tagNumber ?? "Unknown"} ({dam?.name ?? "Cow"})</strong>
                        <p className="text-[10px] text-primary mt-1">Calf sex: {c.calfSex} | Tag: {c.calfTagNumber ?? "Not tagged"}</p>
                      </div>
                      <span className="text-[9px] font-black uppercase text-[#7A869A] tracking-wider">{new Date(c.date).toLocaleDateString()}</span>
                    </div>
                    {c.complications && <p className="text-[10px] text-[#BF2600] font-black uppercase tracking-wider mt-2">Complications: {c.complications}</p>}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Log Calving Form */}
        <div className="lg:col-span-5 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Record Calving Event</h3>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Select Dam (Mother)</label>
              <select
                value={cowId}
                onChange={(e) => setCowId(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              >
                <option value="">-- Choose Cow --</option>
                {activeCows.map((c: any) => (
                  <option key={c._id} value={c._id}>{c.tagNumber} ({c.name})</option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Calf Sex</label>
                <select
                  value={calfSex}
                  onChange={(e) => setCalfSex(e.target.value as any)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                >
                  <option value="F">Female (Heifer)</option>
                  <option value="M">Male (Bull)</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Calf Tag (If tagged)</label>
                <input
                  type="text"
                  placeholder="e.g. EL-0099"
                  value={calfTagNumber}
                  onChange={(e) => setCalfTagNumber(e.target.value)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Sire (Father) Info</label>
              <input
                type="text"
                placeholder="Semen code or bull code..."
                value={sireInfo}
                onChange={(e) => setSireInfo(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Complications (If any)</label>
              <input
                type="text"
                placeholder="Dystocia, retained placenta..."
                value={complications}
                onChange={(e) => setComplications(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Notes</label>
              <input
                type="text"
                placeholder="Newborn health, weight..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-12 text-[11px] rounded-[18px] mt-4 uppercase tracking-wider"
            >
              Log Calving & Birth
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

