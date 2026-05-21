"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { Check, AlertCircle } from "lucide-react";

export default function WorkerHealthObservationPage() {
  const user = useQuery(api.users.viewer);
  const cows = useQuery(api.cows.list, {});
  const addIncidentMutation = useMutation(api.records.addIncident);

  const [cowId, setCowId] = useState("");
  const [tagSearch, setTagSearch] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [severity, setSeverity] = useState<"low" | "medium" | "critical">("medium");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const activeCows = useMemo(
    () => cows?.filter((c: any) => c.status !== "deceased" && c.status !== "sold") ?? [],
    [cows]
  );

  const filteredCows = useMemo(() => {
    if (!tagSearch.trim()) return activeCows;
    const q = tagSearch.toUpperCase();
    return activeCows.filter(
      (c: any) =>
        c.tagNumber.toUpperCase().includes(q) ||
        c.name.toUpperCase().includes(q)
    );
  }, [activeCows, tagSearch]);

  const selectedCow = cows?.find((c: any) => c._id === cowId) ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user || user === null) {
      setError("Not authenticated.");
      return;
    }
    if (!cowId) {
      setError("Please select the affected cow.");
      return;
    }
    if (!title.trim() || !description.trim()) {
      setError("Title and description are required.");
      return;
    }

    setSubmitting(true);
    try {
      await addIncidentMutation({
        title: title.trim(),
        department: "dairy",
        cowId: cowId as any,
        description: description.trim(),
        reportedBy: user._id,
        severity,
        notes: "",
      });

      setSuccess(true);
      setTitle("");
      setDescription("");
      setCowId("");
      setTagSearch("");
      setSeverity("medium");
      setTimeout(() => setSuccess(false), 4000);
    } catch (err: any) {
      setError(err.message || "Failed to submit observation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (cows === undefined || user === undefined || user === null) {
    return (
      <div className="text-xs text-[#5F6368] uppercase font-black tracking-widest p-8 font-sans">
        Loading registry...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Health Event Portal
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Log Cow Health Observation
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Report sick or injured animals · Escalates to veterinary management
        </p>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left: Cow Selector */}
        <div className="system-card p-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5F6368] border-b border-[#DADCE0] pb-3">
            1 — Affected Cow
          </h2>

          <div>
            <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
              Search Tag / Name
            </label>
            <input
              type="text"
              value={tagSearch}
              onChange={(e) => setTagSearch(e.target.value)}
              placeholder="e.g. EL-008 or Chepkoech"
              className="w-full h-10 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none transition-colors"
            />
          </div>

          <div className="max-h-72 overflow-y-auto border border-[#DADCE0] divide-y divide-[#DADCE0] custom-scrollbar">
            {filteredCows.length === 0 ? (
              <p className="p-4 text-xs text-[#5F6368] italic">No cows match search.</p>
            ) : (
              filteredCows.map((c: any) => {
                const isSelected = cowId === c._id;
                return (
                  <button
                    key={c._id}
                    type="button"
                    onClick={() => { setCowId(c._id); setError(null); }}
                    className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors cursor-pointer
                      ${isSelected
                        ? "bg-[#E8F0FE] border-l-4 border-[#1A56DB]"
                        : "bg-white hover:bg-[#F8F9FA]"
                      }`}
                  >
                    <div>
                      <span className="text-xs font-black text-[#202124] block">
                        {c.tagNumber}
                      </span>
                      <span className="text-[10px] text-[#5F6368] font-semibold">
                        {c.name} · {c.breed}
                      </span>
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 border 
                      ${c.status === "treatment"
                        ? "bg-[#FFEBE6] text-[#D93025] border-[#FFBDAD]"
                        : c.status === "dry"
                        ? "bg-[#F8F9FA] text-[#5F6368] border-[#DADCE0]"
                        : "bg-[#E8F0FE] text-[#1A56DB] border-[#A8C7FA]"
                      }`}>
                      {c.status}
                    </span>
                  </button>
                );
              })
            )}
          </div>

          {selectedCow && (
            <div className="bg-[#F8F9FA] border border-[#DADCE0] p-4 space-y-1">
              <p className="text-[10px] font-black uppercase tracking-wider text-[#5F6368]">
                Selected Animal
              </p>
              <p className="text-sm font-black text-[#202124]">
                {selectedCow.tagNumber} — {selectedCow.name}
              </p>
              <p className="text-xs text-[#5F6368] font-semibold">
                {selectedCow.breed} · Lactation #{selectedCow.currentLactationNumber}
              </p>
            </div>
          )}
        </div>

        {/* Right: Observation Form */}
        <div className="system-card p-5 space-y-4">
          <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5F6368] border-b border-[#DADCE0] pb-3">
            2 — Observation Details
          </h2>

          {success && (
            <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 flex items-center gap-2">
              <Check className="h-4 w-4 shrink-0" />
              <span>VERIFIED: Observation logged. Management has been notified.</span>
            </div>
          )}

          {error && (
            <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] text-xs font-semibold p-4 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                Symptom / Issue Title
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Limping, swollen udder, not eating"
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                Severity
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(["low", "medium", "critical"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSeverity(s)}
                    className={`h-11 text-[10px] font-black uppercase tracking-widest border transition-colors cursor-pointer
                      ${severity === s
                        ? s === "critical"
                          ? "bg-[#D93025] text-white border-[#D93025]"
                          : s === "medium"
                          ? "bg-[#FBBC04] text-[#202124] border-[#FBBC04]"
                          : "bg-[#1E8E3E] text-white border-[#1E8E3E]"
                        : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]"
                      }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                Detailed Description
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe exact symptoms, behaviour changes, location on body, time noticed..."
                className="w-full bg-[#F8F9FA] border border-[#DADCE0] p-4 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none transition-colors resize-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !cowId}
              className="w-full btn-primary h-12 text-[11px] rounded-none uppercase tracking-wider disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {submitting ? "Filing observation report..." : "Submit Health Observation"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
