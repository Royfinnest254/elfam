"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkerRecordCropsPage() {
  const cropBlocks = useQuery(api.records.listCropBlocks);
  const logCropActivity = useMutation(api.records.logCropActivity);

  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [activityType, setActivityType] = useState<"planting" | "application" | "harvesting">("planting");
  const [productApplied, setProductApplied] = useState("");
  const [rate, setRate] = useState("");
  const [quantityHarvested, setQuantityHarvested] = useState("");
  const [notes, setNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (cropBlocks === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading crop blocks...</span>
      </div>
    );
  }

  const handleResetForm = () => {
    setSelectedBlockId("");
    setProductApplied("");
    setRate("");
    setQuantityHarvested("");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!selectedBlockId) {
      setErrorMsg("Please select a crop block field.");
      return;
    }

    const qtyHarvested = activityType === "harvesting" ? parseFloat(quantityHarvested) : undefined;
    if (activityType === "harvesting" && (qtyHarvested === undefined || isNaN(qtyHarvested) || qtyHarvested < 0)) {
      setErrorMsg("Please enter a valid harvest quantity.");
      return;
    }

    setSubmitting(true);
    try {
      await logCropActivity({
        cropBlockId: selectedBlockId as any,
        type: activityType,
        activityDate: Date.now(),
        productApplied: activityType === "application" ? productApplied.trim() : undefined,
        rate: activityType === "application" ? rate.trim() : undefined,
        quantityHarvested: qtyHarvested,
        notes: notes.trim(),
      });

      setStatusMsg("VERIFIED: Field operation logged successfully.");
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log crop activity.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto p-4 space-y-6 pb-20 text-[#1A56DB]">
      {/* Header */}
      <header className="flex items-center gap-4 border-b border-[#DADCE0] pb-4">
        <Link href="/worker" className="p-2 hover:bg-[#F8F9FA] rounded-[6px] transition-colors border border-[#DADCE0]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="label block text-teal">
            Station Field Entry
          </span>
          <h1 className="text-xl font-normal tracking-tight">
            Log Crops Operations
          </h1>
        </div>
      </header>

      {/* Tabs / Activity Type */}
      <div className="grid grid-cols-3 gap-2">
        {(["planting", "application", "harvesting"] as const).map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => {
              setActivityType(type);
              setStatusMsg(null);
              setErrorMsg(null);
            }}
            className={`py-2 text-xs font-semibold border rounded-[6px] transition-colors cursor-pointer ${
              activityType === type
                ? "bg-[#1A56DB] border-[#1A56DB] text-white"
                : "bg-white border-[#DADCE0] text-[#1A56DB] hover:bg-[#F8F9FA]"
            }`}
          >
            {type.charAt(0).toUpperCase() + type.slice(1)}
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

      {/* Main Card */}
      <div className="system-card p-6 rounded-none">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label htmlFor="block-select" className="label text-[#5F6368]">Select Crop Block / Field</label>
            <select
              id="block-select"
              value={selectedBlockId}
              onChange={(e) => setSelectedBlockId(e.target.value)}
              className="input-field bg-white cursor-pointer"
              required
            >
              <option value="">-- Choose Crop Block --</option>
              {cropBlocks.map((block) => (
                <option key={block._id} value={block._id}>
                  {block.name} - {block.crop.toUpperCase()} ({block.acres} Acres)
                </option>
              ))}
            </select>
          </div>

          {activityType === "application" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="prod-applied-input" className="label text-[#5F6368]">Chemical / Inputs Applied</label>
                <input
                  type="text"
                  id="prod-applied-input"
                  value={productApplied}
                  onChange={(e) => setProductApplied(e.target.value)}
                  className="input-field"
                  placeholder="e.g. NPK Fertilizer, Herbicide X"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="rate-input" className="label text-[#5F6368]">Application Rate</label>
                <input
                  type="text"
                  id="rate-input"
                  value={rate}
                  onChange={(e) => setRate(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 50 kg/acre, 2L/ha"
                  required
                />
              </div>
            </div>
          )}

          {activityType === "harvesting" && (
            <div className="space-y-1">
              <label htmlFor="qty-harvested-input" className="label text-[#5F6368]">Quantity Harvested (Tonnes)</label>
              <input
                type="number"
                id="qty-harvested-input"
                step="0.01"
                value={quantityHarvested}
                onChange={(e) => setQuantityHarvested(e.target.value)}
                className="input-field"
                placeholder="e.g. 12.5"
                required
              />
            </div>
          )}

          <div className="space-y-1">
            <label htmlFor="activity-notes" className="label text-[#5F6368]">Activity Notes / Details</label>
            <textarea
              id="activity-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="input-field min-h-[100px] py-2 resize-none"
              placeholder="Include team details, machinery calibration, weather condition notes..."
              required
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
          >
            {submitting ? "Logging field task..." : "Log Crops Activity"}
          </button>
        </form>
      </div>
    </div>
  );
}
