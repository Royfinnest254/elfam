"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export default function LogNewTreatmentPage() {
  const router = useRouter();
  const livestock = useQuery(api.livestock.list, {});
  const users = useQuery(api.users.list);
  const logTreatmentMutation = useMutation(api.records.logTreatment);

  const [livestockId, setLivestockId] = useState("");
  const [condition, setCondition] = useState("");
  const [drug, setDrug] = useState("");
  const [dosage, setDosage] = useState("");
  const [withholdingDays, setWithholdingDays] = useState("");
  const [administeredBy, setAdministeredBy] = useState("");
  const [notes, setNotes] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const activeLivestock = livestock?.filter((c: any) => c.status !== "deceased" && c.status !== "sold") ?? [];
  const staffMembers = users?.filter((u: any) => u.role === "manager" || u.role === "worker") ?? [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!livestockId || !condition || !drug || !dosage || !withholdingDays || !administeredBy) {
      setError("Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      await logTreatmentMutation({
        livestockId: livestockId as any,
        date: Date.now(),
        condition,
        drugAdministered: drug,
        dosage,
        withholdingDays: parseInt(withholdingDays),
        administeredBy: administeredBy as any,
        notes,
      });

      setSuccess(true);
      setTimeout(() => {
        router.push("/manager/treatments");
      }, 1500);
    } catch (e: any) {
      setError(e.message || "Failed to log veterinary treatment.");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <Link href="/manager/treatments" className="text-[10px] font-black text-primary hover:text-[#202124] uppercase tracking-wider flex items-center gap-1.5 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Treatments</span>
        </Link>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Log Veterinary Medical Event
        </h1>
      </header>

      <div className="max-w-xl system-card p-8 bg-white border border-[#DADCE0] space-y-6">
        {success && (
          <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
            <Check className="h-4 w-4 shrink-0" />
            <span>Veterinary log written. Returning to Treatments list...</span>
          </div>
        )}

        {error && (
          <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] text-xs font-semibold p-4 rounded-xl">
            [Error] {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Select Sick Animal (Tag)</label>
            <select
              value={livestockId}
              onChange={(e) => setLivestockId(e.target.value)}
              className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors cursor-pointer"
            >
              <option value="">-- Choose Animal --</option>
              {activeLivestock.map((c: any) => (
                <option key={c._id} value={c._id}>
                  {c.tagNumber} ({c.name} - {c.species})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Medical Issue / Condition</label>
            <input
              type="text"
              placeholder="e.g. Mastitis, Milk Fever, Foot Rot"
              value={condition}
              onChange={(e) => setCondition(e.target.value)}
              className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Drug / Medicine</label>
              <input
                type="text"
                placeholder="e.g. Penicillin, Alamycin"
                value={drug}
                onChange={(e) => setDrug(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Dosage administered</label>
              <input
                type="text"
                placeholder="e.g. 20ml IM, 15ml SC"
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Milk Withholding (Days)</label>
              <input
                type="number"
                placeholder="e.g. 4"
                value={withholdingDays}
                onChange={(e) => setWithholdingDays(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Administered By (Staff)</label>
              <select
                value={administeredBy}
                onChange={(e) => setAdministeredBy(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors cursor-pointer"
              >
                <option value="">-- Select --</option>
                {staffMembers.map((s: any) => (
                  <option key={s._id} value={s._id}>{s.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black uppercase tracking-wider text-[#5F6368] ml-1 block">Operational Notes</label>
            <textarea
              rows={3}
              placeholder="Provide context or symptoms..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#DADCE0] p-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-[14px] transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-primary w-full h-[52px] rounded-[18px] text-xs font-black uppercase tracking-widest cursor-pointer disabled:opacity-50"
          >
            {loading ? "Registering treatment file..." : "Commit Treatment Log"}
          </button>
        </form>
      </div>
    </div>
  );
}

