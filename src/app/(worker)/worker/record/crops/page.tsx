"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkerRecordCropsPage() {
  const fields = useQuery(api.records.listFields);
  const logFieldPlanting = useMutation(api.records.logFieldPlanting);
  const logFieldApplication = useMutation(api.records.logFieldApplication);
  const logFieldHarvest = useMutation(api.records.logFieldHarvest);

  const [selectedBlockId, setSelectedBlockId] = useState("");
  const [activityType, setActivityType] = useState<"planting" | "application" | "harvesting">("planting");
  const [appType, setAppType] = useState<"fertilizer" | "herbicide" | "pesticide" | "seed">("fertilizer");
  const [productApplied, setProductApplied] = useState("");
  const [rate, setRate] = useState("");
  const [harvestedBags, setHarvestedBags] = useState("");
  const [bagWeight, setBagWeight] = useState("90");
  const [notes, setNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (fields === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading fields...</span>
      </div>
    );
  }

  const handleResetForm = () => {
    setSelectedBlockId("");
    setProductApplied("");
    setRate("");
    setHarvestedBags("");
    setBagWeight("90");
    setNotes("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!selectedBlockId) {
      setErrorMsg("Please select a field.");
      return;
    }

    setSubmitting(true);
    try {
      if (activityType === "planting") {
        await logFieldPlanting({
          fieldId: selectedBlockId as any,
          plantedDate: Date.now(),
          expectedHarvestDate: Date.now() + 120 * 24 * 60 * 60 * 1000,
          notes: notes.trim(),
        });
      } else if (activityType === "application") {
        if (!productApplied || !rate) {
          setErrorMsg("Chemical product and application rate are required.");
          setSubmitting(false);
          return;
        }
        await logFieldApplication({
          fieldId: selectedBlockId as any,
          date: Date.now(),
          type: appType,
          product: productApplied.trim(),
          rate: rate.trim(),
        });
      } else if (activityType === "harvesting") {
        const bagsNum = parseInt(harvestedBags, 10);
        const weightNum = parseFloat(bagWeight);
        if (isNaN(bagsNum) || bagsNum <= 0 || isNaN(weightNum) || weightNum <= 0) {
          setErrorMsg("Please enter valid bags and weight.");
          setSubmitting(false);
          return;
        }
        const selectedField = fields?.find((f) => f._id === selectedBlockId);
        await logFieldHarvest({
          fieldId: selectedBlockId as any,
          date: Date.now(),
          crop: selectedField ? selectedField.crop : "wheat",
          bags: bagsNum,
          bagWeightKg: weightNum,
          notes: notes.trim(),
        });
      }

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
              <option value="">-- Choose Field --</option>
              {fields.map((field) => (
                <option key={field._id} value={field._id}>
                  {field.name} - {field.crop.toUpperCase()} ({field.acres} Acres)
                </option>
              ))}
            </select>
          </div>

          {activityType === "application" && (
            <div className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="app-type-select" className="label text-[#5F6368]">Application Type</label>
                <select
                  id="app-type-select"
                  value={appType}
                  onChange={(e) => setAppType(e.target.value as any)}
                  className="input-field bg-white cursor-pointer"
                  required
                >
                  <option value="fertilizer">Fertilizer</option>
                  <option value="herbicide">Herbicide</option>
                  <option value="pesticide">Pesticide</option>
                  <option value="seed">Seed</option>
                </select>
              </div>

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
            </div>
          )}

          {activityType === "harvesting" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label htmlFor="bags-input" className="label text-[#5F6368]">Bags Harvested</label>
                <input
                  type="number"
                  id="bags-input"
                  value={harvestedBags}
                  onChange={(e) => setHarvestedBags(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 150"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="weight-input" className="label text-[#5F6368]">Bag Weight (Kg)</label>
                <input
                  type="number"
                  id="weight-input"
                  value={bagWeight}
                  onChange={(e) => setBagWeight(e.target.value)}
                  className="input-field"
                  placeholder="e.g. 90"
                  required
                />
              </div>
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
