"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Calendar, Plus, X, Award, CheckCircle } from "lucide-react";

export default function FieldDetailPage() {
  const { fieldId } = useParams();
  const fieldData = useQuery(api.records.getField, { fieldId: fieldId as any });
  const logSoilMutation = useMutation(api.records.logSoilTest);

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [testDate, setTestDate] = useState("");
  const [ph, setPh] = useState("6.5");
  const [nitrogen, setNitrogen] = useState<"low" | "medium" | "high">("medium");
  const [phosphorus, setPhosphorus] = useState<"low" | "medium" | "high">("medium");
  const [potassium, setPotassium] = useState<"low" | "medium" | "high">("medium");
  const [recommendations, setRecommendations] = useState("");
  
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (fieldData === undefined) {
    return (
      <div className="text-xs text-muted uppercase font-mono tracking-widest p-8 font-sans">
        Loading crop field record...
      </div>
    );
  }

  if (fieldData === null) {
    return (
      <div className="space-y-6 text-center py-20 text-ink bg-paper border border-rule">
        <h3 className="font-display text-display italic">Field Record Not Found</h3>
        <Link href="/manager/fields" className="inline-block btn-primary text-xs font-mono tracking-wider uppercase px-6 py-3 rounded-none">
          Return to Crops Directory
        </Link>
      </div>
    );
  }

  const { field, applications = [], harvests = [], soilTests = [] } = fieldData;

  const handleSoilTestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setSubmitting(true);

    if (!testDate || !ph || !recommendations) {
      setFormError("Please fill in the test date, pH, and recommendations.");
      setSubmitting(false);
      return;
    }

    const phNum = parseFloat(ph);
    if (isNaN(phNum) || phNum < 0 || phNum > 14) {
      setFormError("pH must be a valid number between 0 and 14.");
      setSubmitting(false);
      return;
    }

    try {
      await logSoilMutation({
        fieldId: fieldId as any,
        date: new Date(testDate).getTime(),
        ph: phNum,
        nitrogen,
        phosphorus,
        potassium,
        recommendations,
      });
      setShowModal(false);
      // Reset form
      setTestDate("");
      setPh("6.5");
      setNitrogen("medium");
      setPhosphorus("medium");
      setPotassium("medium");
      setRecommendations("");
    } catch (err: any) {
      setFormError(err.message || "Failed to log soil test.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-ink pb-12">
      <header className="border-b border-rule pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <Link href="/manager/fields" className="text-[10px] text-moss hover:underline uppercase tracking-widest font-mono flex items-center gap-1 mb-4">
            <ArrowLeft className="h-3 w-3" />
            <span>Back to Fields</span>
          </Link>
          <span className="font-mono text-[9px] uppercase text-muted tracking-[0.2em] block mb-1">
            Plot Ledger
          </span>
          <h1 className="font-display text-display uppercase text-ink">
            {field.name}
          </h1>
        </div>
        <div className="flex gap-3">
          <span className="font-mono text-[9px] font-bold uppercase px-3 py-1 bg-paper border border-rule">
            {field.crop}
          </span>
          <button
            type="button"
            onClick={() => setShowModal(true)}
            className="btn-primary text-xs uppercase font-mono tracking-wider flex items-center gap-2 rounded-none"
          >
            <Plus className="h-4 w-4" />
            <span>Log Soil Test</span>
          </button>
        </div>
      </header>

      {/* Highlights Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-paper border border-rule p-5 font-mono text-[11px]">
          <span className="text-muted block uppercase">Field Size</span>
          <strong className="text-ink text-h2 font-display italic block mt-1">{field.acres} Acres</strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-[11px]">
          <span className="text-muted block uppercase">Planted Date</span>
          <strong className="text-ink text-h2 font-display italic block mt-1 font-sans font-normal">
            {field.plantedDate ? new Date(field.plantedDate).toLocaleDateString("en-GB") : "Fallow"}
          </strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-[11px]">
          <span className="text-muted block uppercase">Expected Harvest</span>
          <strong className="text-ink text-h2 font-display italic block mt-1 font-sans font-normal">
            {field.expectedHarvestDate ? new Date(field.expectedHarvestDate).toLocaleDateString("en-GB") : "—"}
          </strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Spray & Fertilizer application log (Col 1) */}
        <div className="lg:col-span-4 bg-paper border border-rule p-6 space-y-4">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
            Input Applications Log
          </h3>
          {applications.length === 0 ? (
            <p className="text-xs text-muted italic font-sans">No inputs applied to this field.</p>
          ) : (
            <div className="space-y-3 font-sans text-xs">
              {applications.map((app: any) => (
                <div key={app._id} className="p-4 bg-paper-2 border border-rule">
                  <div className="flex justify-between items-start">
                    <div>
                      <strong className="uppercase text-ink text-xs block mb-0.5">{app.type}</strong>
                      <span className="text-[10px] text-muted">{app.product}</span>
                    </div>
                    <span className="font-mono text-[9px] text-muted">
                      {new Date(app.date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="mt-2 font-mono text-[9px] text-moss">
                    Application Rate: {app.rate}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Soil Quality Ledger (Col 2) */}
        <div className="lg:col-span-4 bg-paper border border-rule p-6 space-y-4">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
            Soil Quality History
          </h3>
          {soilTests.length === 0 ? (
            <p className="text-xs text-muted italic font-sans">No soil health logs registered for this block.</p>
          ) : (
            <div className="space-y-4 font-sans text-xs">
              {soilTests.map((test: any) => (
                <div key={test._id} className="p-4 bg-paper-2 border border-rule space-y-3">
                  <div className="flex justify-between items-start">
                    <span className="font-mono text-[10px] font-bold text-moss">
                      pH level: {test.ph}
                    </span>
                    <span className="font-mono text-[9px] text-muted">
                      {new Date(test.date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2 font-mono text-[8px] uppercase tracking-wider font-bold">
                    <div className={`p-1.5 border text-center ${
                      test.nitrogen === "low" ? "bg-alert/5 text-alert border-alert/15" : "bg-moss/5 text-moss border-moss/15"
                    }`}>
                      N: {test.nitrogen}
                    </div>
                    <div className={`p-1.5 border text-center ${
                      test.phosphorus === "low" ? "bg-alert/5 text-alert border-alert/15" : "bg-moss/5 text-moss border-moss/15"
                    }`}>
                      P: {test.phosphorus}
                    </div>
                    <div className={`p-1.5 border text-center ${
                      test.potassium === "low" ? "bg-alert/5 text-alert border-alert/15" : "bg-moss/5 text-moss border-moss/15"
                    }`}>
                      K: {test.potassium}
                    </div>
                  </div>

                  <p className="text-muted text-xs italic leading-relaxed pt-1">
                    <strong>Recommendations:</strong> {test.recommendations}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Harvest records history (Col 3) */}
        <div className="lg:col-span-4 bg-paper border border-rule p-6 space-y-4">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
            Harvest Records
          </h3>
          {harvests.length === 0 ? (
            <p className="text-xs text-muted italic font-sans">No harvest yields logged yet.</p>
          ) : (
            <div className="space-y-3 font-sans text-xs">
              {harvests.map((h: any) => (
                <div key={h._id} className="p-4 bg-paper-2 border border-rule">
                  <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-ink uppercase text-xs">{h.crop} Yield</span>
                    <span className="font-mono text-[9px] text-muted">
                      {new Date(h.date).toLocaleDateString("en-GB")}
                    </span>
                  </div>
                  <div className="font-mono text-[10px] text-moss font-bold">
                    {h.bags} Bags @ {h.bagWeightKg} kg/bag ({ (h.bags * h.bagWeightKg / 1000).toFixed(2) } tonnes)
                  </div>
                  {h.notes && (
                    <p className="text-muted text-[11px] mt-2 italic">
                      Notes: {h.notes}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Log Soil Test Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-rule rounded-none w-full max-w-lg p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-rule pb-4">
              <h2 className="text-h1 font-display text-ink uppercase">Log Soil Quality Test</h2>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1 text-muted hover:text-ink transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {formError && (
              <div className="bg-alert/5 border border-alert/20 text-alert p-3 text-xs font-bold font-mono">
                [ERROR] {formError}
              </div>
            )}

            <form onSubmit={handleSoilTestSubmit} className="space-y-4 font-sans text-xs">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Test Date *
                  </label>
                  <input
                    type="date"
                    value={testDate}
                    onChange={(e) => setTestDate(e.target.value)}
                    className="input-field"
                  />
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    pH Level (0.0 - 14.0) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="14"
                    value={ph}
                    onChange={(e) => setPh(e.target.value)}
                    placeholder="e.g. 6.5"
                    className="input-field"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Nitrogen (N)
                  </label>
                  <select
                    value={nitrogen}
                    onChange={(e) => setNitrogen(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Phosphorus (P)
                  </label>
                  <select
                    value={phosphorus}
                    onChange={(e) => setPhosphorus(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                    Potassium (K)
                  </label>
                  <select
                    value={potassium}
                    onChange={(e) => setPotassium(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                  Recommendations & Treatment Plan *
                </label>
                <textarea
                  value={recommendations}
                  onChange={(e) => setRecommendations(e.target.value)}
                  rows={4}
                  placeholder="e.g. Apply lime to correct acidity, add nitrogenous fertilizer ahead of planting..."
                  className="w-full p-3 bg-paper border border-rule rounded-none text-xs font-semibold focus:outline-none focus:border-moss"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full btn-primary h-11 uppercase font-mono tracking-wider rounded-none"
              >
                {submitting ? "Logging soil test..." : "Log Soil Quality Record"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
