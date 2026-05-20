"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkerRecordLivestockPage() {
  const livestock = useQuery(api.records.listLivestock, {});

  const logProduction = useMutation(api.records.logLivestockProduction);
  const logHealth = useMutation(api.records.logLivestockHealth);
  const logBreeding = useMutation(api.records.logLivestockBreeding);

  const [activeTab, setActiveTab] = useState<"production" | "health" | "breeding">("production");

  // Common state
  const [selectedAnimalId, setSelectedAnimalId] = useState("");
  const [notes, setNotes] = useState("");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Production-specific state
  const [prodType, setProdType] = useState("milk");
  const [prodQty, setProdQty] = useState("");

  // Health-specific state
  const [condition, setCondition] = useState("");
  const [treatment, setTreatment] = useState("");
  const [dosage, setDosage] = useState("");
  const [withholdingDays, setWithholdingDays] = useState("");

  // Breeding-specific state
  const [breedType, setBreedType] = useState("insemination");
  const [breedStatus, setBreedStatus] = useState("pregnant");
  const [details, setDetails] = useState("");

  if (livestock === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading livestock assets...</span>
      </div>
    );
  }

  const handleResetForm = () => {
    setSelectedAnimalId("");
    setNotes("");
    setProdQty("");
    setCondition("");
    setTreatment("");
    setDosage("");
    setWithholdingDays("");
    setDetails("");
  };

  const handleLogProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const animal = livestock.find(l => l._id === selectedAnimalId);
    if (!animal) {
      setErrorMsg("Please select a registered animal.");
      return;
    }

    const qty = parseFloat(prodQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid yield quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await logProduction({
        livestockId: selectedAnimalId as any,
        category: animal.category,
        type: prodType,
        quantity: qty,
        date: new Date().toISOString().split("T")[0],
        notes,
        flagged: false,
      });

      setStatusMsg("VERIFIED: Yield successfully added to database ledger.");
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log production yield.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogHealth = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const animal = livestock.find(l => l._id === selectedAnimalId);
    if (!animal) {
      setErrorMsg("Please select a registered animal.");
      return;
    }

    if (!condition.trim() || !treatment.trim()) {
      setErrorMsg("Condition and Treatment fields are required.");
      return;
    }

    const whDays = parseInt(withholdingDays) || 0;

    setSubmitting(true);
    try {
      await logHealth({
        livestockId: selectedAnimalId as any,
        category: animal.category,
        date: Date.now(),
        condition: condition.trim(),
        treatment: treatment.trim(),
        dosage: dosage.trim(),
        withholdingDays: whDays,
        notes,
      });

      setStatusMsg("VERIFIED: Health treatment successfully logged. Withholding rules applied.");
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log health event.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogBreeding = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const animal = livestock.find(l => l._id === selectedAnimalId);
    if (!animal) {
      setErrorMsg("Please select a registered animal.");
      return;
    }

    setSubmitting(true);
    try {
      await logBreeding({
        livestockId: selectedAnimalId as any,
        category: animal.category,
        date: Date.now(),
        type: breedType as any,
        status: breedStatus as any,
        details: details.trim(),
        notes,
      });

      setStatusMsg("VERIFIED: Breeding record logged successfully.");
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log breeding event.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto p-4 space-y-6 pb-20 text-[#0F1B2D]">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-[#DFE1E6] pb-4">
        <Link href="/worker" className="p-2 hover:bg-[#F4F5F7] rounded-[6px] transition-colors border border-[#DFE1E6]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="label block text-teal">
            Station Primary Entry
          </span>
          <h1 className="text-xl font-normal tracking-tight">
            Log Livestock Data
          </h1>
        </div>
      </header>

      {/* Tabs */}
      <div className="grid grid-cols-3 gap-2">
        {(["production", "health", "breeding"] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveTab(tab);
              setStatusMsg(null);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold border rounded-[6px] transition-colors cursor-pointer ${
              activeTab === tab
                ? "bg-[#0F1B2D] border-[#0F1B2D] text-white"
                : "bg-white border-[#DFE1E6] text-[#0F1B2D] hover:bg-[#F4F5F7]"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Notifications */}
      {statusMsg && (
        <div className="text-teal text-xs font-bold bg-teal/5 border border-teal/20 p-4 rounded-[4px]">
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="text-alert text-xs font-bold bg-alert/5 border border-alert/20 p-4 rounded-[4px]">
          {errorMsg}
        </div>
      )}

      {/* Forms container */}
      <div className="system-card p-6 rounded-none">
        {activeTab === "production" && (
          <form onSubmit={handleLogProduction} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="animal-select-prod" className="label text-[#5E6C84]">Select Animal / Group</label>
              <select
                id="animal-select-prod"
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="input-field bg-white cursor-pointer"
                required
              >
                <option value="">-- Choose Animal --</option>
                {livestock.map((item) => (
                  <option key={item._id} value={item._id}>
                    [{item.category}] Tag {item.tagNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="prod-type-select" className="label text-[#5E6C84]">Yield Type</label>
                <select
                  id="prod-type-select"
                  value={prodType}
                  onChange={(e) => setProdType(e.target.value)}
                  className="input-field bg-white cursor-pointer"
                  required
                >
                  <option value="milk">Milk (Litres)</option>
                  <option value="eggs">Eggs (Pcs)</option>
                  <option value="wool">Wool (Kg)</option>
                  <option value="manure">Manure (Bags)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="prod-qty-input" className="label text-[#5E6C84]">Quantity</label>
                <input
                  type="number"
                  id="prod-qty-input"
                  step="0.1"
                  value={prodQty}
                  onChange={(e) => setProdQty(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 15.5"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="prod-notes-input" className="label text-[#5E6C84]">Operational Notes</label>
              <textarea
                id="prod-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px] py-2"
                placeholder="Include weather, health flags or feed deviation details..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
            >
              {submitting ? "Logging yield..." : "Log production yield"}
            </button>
          </form>
        )}

        {activeTab === "health" && (
          <form onSubmit={handleLogHealth} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="animal-select-health" className="label text-[#5E6C84]">Select Affected Animal</label>
              <select
                id="animal-select-health"
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="input-field bg-white cursor-pointer"
                required
              >
                <option value="">-- Choose Animal --</option>
                {livestock.map((item) => (
                  <option key={item._id} value={item._id}>
                    [{item.category}] Tag {item.tagNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="condition-input" className="label text-[#5E6C84]">Condition / Symptoms</label>
              <input
                type="text"
                id="condition-input"
                value={condition}
                onChange={(e) => setCondition(e.target.value)}
                className="input-field"
                placeholder="e.g. Foot rot, Mastitis signs"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="treatment-input" className="label text-[#5E6C84]">Drug / Treatment</label>
                <input
                  type="text"
                  id="treatment-input"
                  value={treatment}
                  onChange={(e) => setTreatment(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Alamycin 10%"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="dosage-input" className="label text-[#5E6C84]">Dosage administered</label>
                <input
                  type="text"
                  id="dosage-input"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 15 ml, intramuscular"
                  required
                />
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="wh-days-input" className="label text-[#5E6C84]">Withholding Period (Days)</label>
              <input
                type="number"
                id="wh-days-input"
                value={withholdingDays}
                onChange={(e) => setWithholdingDays(e.target.value)}
                className="input-field"
                placeholder="e.g. 3"
                required
              />
              <span className="mono text-[9px] text-[#FF5630] font-bold uppercase tracking-wider block mt-1">
                Yield quarantine will be enforced automatically.
              </span>
            </div>

            <div className="space-y-1">
              <label htmlFor="health-notes-input" className="label text-[#5E6C84]">Notes</label>
              <textarea
                id="health-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px] py-2"
                placeholder="Veterinary recommendation details..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
            >
              {submitting ? "Logging treatment..." : "Log health treatment"}
            </button>
          </form>
        )}

        {activeTab === "breeding" && (
          <form onSubmit={handleLogBreeding} className="space-y-4">
            <div className="space-y-1">
              <label htmlFor="animal-select-breed" className="label text-[#5E6C84]">Select Female Animal</label>
              <select
                id="animal-select-breed"
                value={selectedAnimalId}
                onChange={(e) => setSelectedAnimalId(e.target.value)}
                className="input-field bg-white cursor-pointer"
                required
              >
                <option value="">-- Choose Animal --</option>
                {livestock.map((item) => (
                  <option key={item._id} value={item._id}>
                    [{item.category}] Tag {item.tagNumber} - {item.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="breed-type-select" className="label text-[#5E6C84]">Breeding Action</label>
                <select
                  id="breed-type-select"
                  value={breedType}
                  onChange={(e) => setBreedType(e.target.value)}
                  className="input-field bg-white cursor-pointer"
                  required
                >
                  <option value="insemination">Artificial Insemination</option>
                  <option value="pregnancy_check">Pregnancy Diagnosis</option>
                  <option value="birth">Parturition (Birth)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="breed-status-select" className="label text-[#5E6C84]">Resulting Status</label>
                <select
                  id="breed-status-select"
                  value={breedStatus}
                  onChange={(e) => setBreedStatus(e.target.value)}
                  className="input-field bg-white cursor-pointer"
                  required
                >
                  <option value="pregnant">Confirmed Pregnant</option>
                  <option value="open">Confirmed Open (Not pregnant)</option>
                  <option value="successful">Parturition Successful</option>
                  <option value="failed">Parturition Failed / Complication</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="details-input" className="label text-[#5E6C84]">Breeding Details / Parameters</label>
              <input
                type="text"
                id="details-input"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="input-field"
                placeholder="e.g. Sire tag, check methodology, complications details"
                required
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="breed-notes-input" className="label text-[#5E6C84]">Notes</label>
              <textarea
                id="breed-notes-input"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="input-field min-h-[80px] py-2"
                placeholder="Observations, next expected date..."
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
            >
              {submitting ? "Logging breeding cycle..." : "Log breeding event"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
