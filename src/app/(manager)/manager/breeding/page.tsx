"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check } from "lucide-react";

export default function ManagerBreedingPage() {
  const cows = useQuery(api.cows.list, {});
  const users = useQuery(api.users.list);
  const logServiceMutation = useMutation(api.records.logService);
  const logPregnancyMutation = useMutation(api.records.logPregnancyDiagnosis);

  // States
  const [cowId, setCowId] = useState("");
  const [serviceType, setServiceType] = useState<"AI" | "natural">("AI");
  const [bullCode, setBullCode] = useState("");
  const [performedBy, setPerformedBy] = useState("");
  const [serviceNotes, setServiceNotes] = useState("");

  const [pregCowId, setPregCowId] = useState("");
  const [pregResult, setPregResult] = useState<"pregnant" | "open" | "uncertain">("pregnant");
  const [performedByPreg, setPerformedByPreg] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const activeCows = cows?.filter((c: any) => c.status !== "deceased" && c.status !== "sold") ?? [];
  const staffMembers = users?.filter((u: any) => u.role === "manager" || u.role === "worker") ?? [];

  const handleLogService = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!cowId || !bullCode || !performedBy) {
      setError("Please fill out all required service fields.");
      return;
    }

    try {
      await logServiceMutation({
        cowId: cowId as any,
        date: Date.now(),
        type: serviceType,
        bullOrSemenCode: bullCode,
        performedBy: performedBy as any,
        notes: serviceNotes,
      });

      setSuccess(true);
      setCowId("");
      setBullCode("");
      setServiceNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to log breeding service.");
    }
  };

  const handleLogPregnancy = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!pregCowId || !performedByPreg) {
      setError("Please fill out all required pregnancy verification fields.");
      return;
    }

    try {
      const expectedCalvingDate = pregResult === "pregnant" ? Date.now() + 280 * 24 * 60 * 60 * 1000 : null;
      await logPregnancyMutation({
        cowId: pregCowId as any,
        date: Date.now(),
        result: pregResult,
        expectedCalvingDate,
        performedBy: performedByPreg as any,
      });

      setSuccess(true);
      setPregCowId("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to log pregnancy diagnosis.");
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Dairy Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Breeding Board
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">Artificial Insemination (AI) services and pregnancy check logs</p>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
          <Check className="h-4 w-4 text-[#006644]" />
          <span>Breeding action successfully committed to database.</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#BF2600] text-xs font-semibold p-4 rounded-xl">
          [Error] {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Log AI Service */}
        <div className="lg:col-span-6 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Log Breeding Service</h3>
          <form onSubmit={handleLogService} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Select Cow</label>
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
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Service Type</label>
                <select
                  value={serviceType}
                  onChange={(e) => setServiceType(e.target.value as any)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                >
                  <option value="AI">AI (Insemination)</option>
                  <option value="natural">Natural Bull</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Bull / Semen Code</label>
                <input
                  type="text"
                  placeholder="e.g. JE-980 or Bull Tag"
                  value={bullCode}
                  onChange={(e) => setBullCode(e.target.value)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Inseminator (Staff)</label>
              <select
                value={performedBy}
                onChange={(e) => setPerformedBy(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              >
                <option value="">-- Select Inseminator --</option>
                {staffMembers.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Service Notes</label>
              <input
                type="text"
                placeholder="Straw lot number, heat strength..."
                value={serviceNotes}
                onChange={(e) => setServiceNotes(e.target.value)}
                className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-12 text-[11px] rounded-[18px] mt-4 uppercase tracking-wider"
            >
              Log Insemination Service
            </button>
          </form>
        </div>

        {/* Log Pregnancy verification */}
        <div className="lg:col-span-6 system-card p-6 space-y-6">
          <h3 className="text-base font-black uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">Verify Pregnancy Status</h3>
          <form onSubmit={handleLogPregnancy} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Select Cow Checked</label>
              <select
                value={pregCowId}
                onChange={(e) => setPregCowId(e.target.value)}
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
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Checkup Result</label>
                <select
                  value={pregResult}
                  onChange={(e) => setPregResult(e.target.value as any)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                >
                  <option value="pregnant">Pregnant (Confirmed)</option>
                  <option value="open">Open (Not pregnant)</option>
                  <option value="uncertain">Uncertain / Re-test</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#5E6C84] mb-1.5 uppercase tracking-wider">Checked By (Staff)</label>
                <select
                  value={performedByPreg}
                  onChange={(e) => setPerformedByPreg(e.target.value)}
                  className="w-full h-11 bg-[#F4F5F7] border border-[#DFE1E6] px-4 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
                >
                  <option value="">-- Select --</option>
                  {staffMembers.map((s: any) => (
                    <option key={s._id} value={s._id}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <button
              type="submit"
              className="w-full btn-primary h-12 text-[11px] rounded-[18px] mt-4 uppercase tracking-wider"
            >
              Verify Pregnancy Record
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

