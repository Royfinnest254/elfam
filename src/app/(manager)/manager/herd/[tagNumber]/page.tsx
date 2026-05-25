"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Scale, Calendar, AlertTriangle, ChevronRight, Check } from "lucide-react";

export default function LivestockProfilePage() {
  const { tagNumber } = useParams();
  const router = useRouter();
  
  const animal = useQuery(api.livestock.getByTag, { tagNumber: tagNumber as string });

  const productionHistory = useQuery(
    api.livestock.getProductionHistory,
    animal && !animal.isOffspring ? { livestockId: animal._id as any } : "skip"
  );
  
  const birthEvents = useQuery(
    api.livestock.getBirthEvents,
    animal && !animal.isOffspring ? { parentId: animal._id as any } : "skip"
  );
  
  const treatments = useQuery(
    api.livestock.getTreatments,
    animal && !animal.isOffspring ? { livestockId: animal._id as any } : "skip"
  );

  const promote = useMutation(api.records.promoteOffspring);

  // Promotion Form state
  const [promoteTag, setPromoteTag] = useState("");
  const [promoteStatus, setPromoteStatus] = useState<"milking" | "dry" | "treatment">("dry");
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSubmitting, setPromoSubmitting] = useState(false);

  if (animal === undefined || productionHistory === undefined || birthEvents === undefined || treatments === undefined) {
    return (
      <div className="text-xs text-muted uppercase font-mono tracking-widest p-8 font-sans">
        Loading animal profile file...
      </div>
    );
  }

  if (animal === null) {
    return (
      <div className="space-y-6 text-center py-20 text-ink bg-paper border border-rule">
        <h3 className="font-display text-display italic">Tag Not Registered</h3>
        <p className="text-small text-muted font-sans max-w-sm mx-auto">
          No livestock or young offspring profile matches tag number "{tagNumber}" in the registry.
        </p>
        <Link href="/manager/livestock" className="inline-block btn-primary text-xs font-mono tracking-wider uppercase px-6 py-3 rounded-none">
          Return to Registry
        </Link>
      </div>
    );
  }

  const isDairy = animal.species === "cattle" || animal.species === "goat";
  const isMeatOrGrowth = animal.species === "pig" || animal.species === "sheep" || animal.species === "other";
  
  // Calculate weaning date countdown
  let weaningCountdown = "";
  if (animal.isOffspring && animal.weaningDate) {
    const diff = animal.weaningDate - Date.now();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    weaningCountdown = days > 0 ? `${days} days remaining` : "Weaning complete / Ready for mature promotion";
  }

  const handlePromotionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPromoError(null);
    setPromoSubmitting(true);

    if (!promoteTag.trim()) {
      setPromoError("A new mature tag number is required.");
      setPromoSubmitting(false);
      return;
    }

    try {
      await promote({
        offspringId: animal._id as any,
        status: promoteStatus,
        newTagNumber: promoteTag.trim(),
      });
      router.push(`/manager/livestock/${promoteTag.trim()}`);
    } catch (err: any) {
      setPromoError(err.message || "Failed to promote animal.");
    } finally {
      setPromoSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-ink pb-12">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/livestock" className="text-[10px] text-moss hover:underline uppercase tracking-widest font-mono flex items-center gap-1 mb-4">
          <ArrowLeft className="h-3 w-3" />
          <span>Back to Registry</span>
        </Link>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="font-mono text-[9px] uppercase text-muted tracking-[0.2em] block mb-1">
              Livestock File &gt; {animal.tagNumber}
            </span>
            <h1 className="font-display text-display uppercase text-ink">
              {animal.name}
            </h1>
          </div>
          <div className="flex gap-2">
            <span className="text-[9px] font-mono font-bold uppercase px-3 py-1 bg-paper border border-rule text-moss">
              {animal.species}
            </span>
            <span className={`text-[9px] font-mono font-bold uppercase px-3 py-1 border ${
              animal.status === "milking" || animal.status === "active" ? "bg-[#1f3a2e]/10 text-moss border-[#1f3a2e]/20" :
              animal.status === "treatment" ? "bg-alert/10 text-alert border-alert/20" :
              "bg-paper-2 text-muted border-rule"
            }`}>
              {animal.status}
            </span>
          </div>
        </div>
      </header>

      {/* Main Profile Info Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Pedigree & Biological Ledger (Col 1) */}
        <div className="lg:col-span-4 bg-paper border border-rule p-6 space-y-6">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
            Biological Ledger
          </h3>
          <div className="space-y-4 font-mono text-[11px]">
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Species</span>
              <span className="font-bold text-ink capitalize">{animal.species}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Breed</span>
              <span className="font-bold text-ink">{animal.breed}</span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Date of Birth</span>
              <span className="font-bold text-ink">
                {new Date(animal.dateOfBirth).toLocaleDateString("en-GB")}
              </span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Sex</span>
              <span className="font-bold text-ink">{animal.sex === "M" ? "Male" : "Female"}</span>
            </div>

            {!animal.isOffspring && isDairy && (
              <div className="flex justify-between border-b border-rule pb-2">
                <span className="text-muted">Lactation No.</span>
                <span className="font-bold text-ink">#{animal.currentLactationNumber}</span>
              </div>
            )}

            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Sire Info</span>
              <span className="font-bold text-ink truncate max-w-[150px]" title={animal.sireInfo}>
                {animal.sireInfo || "N/A"}
              </span>
            </div>
            <div className="flex justify-between border-b border-rule pb-2">
              <span className="text-muted">Dam Tag</span>
              <span className="font-bold text-ink">{animal.damTagNumber || "N/A"}</span>
            </div>

            {animal.isOffspring && animal.currentWeight && (
              <div className="flex justify-between border-b border-rule pb-2">
                <span className="text-muted">Current Weight</span>
                <span className="font-bold text-moss">{animal.currentWeight} kg</span>
              </div>
            )}
          </div>

          <div className="text-xs text-muted italic bg-paper-2 p-4 border border-rule">
            <strong>Notes:</strong> {animal.notes || "No notes on record."}
          </div>

          {/* Offspring Weaning Card */}
          {animal.isOffspring && (
            <div className="bg-cream/40 border border-rule p-4 space-y-3 font-sans text-xs">
              <h4 className="font-mono text-[10px] uppercase font-bold text-moss tracking-wider">
                Weaning Details
              </h4>
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-moss" />
                <span>
                  Expected Weaning:{" "}
                  {animal.weaningDate
                    ? new Date(animal.weaningDate).toLocaleDateString("en-GB")
                    : "Not specified"}
                </span>
              </div>
              {weaningCountdown && (
                <div className="bg-moss/5 text-moss px-2 py-1.5 font-mono text-[10px] font-bold border border-moss/10">
                  {weaningCountdown}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Dynamic Yield, History, & Actions (Col 2) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Offspring Promotion Form */}
          {animal.isOffspring && animal.status !== "promoted" && (
            <div className="bg-cream border border-moss p-6 space-y-4">
              <h3 className="font-display text-h2 italic uppercase text-moss border-b border-rule pb-3">
                Promote to Mature Herd
              </h3>
              <p className="text-xs text-ink/80 font-sans leading-relaxed">
                Elevate this young animal to the active breeding or milking registry. This will assign a permanent mature identification tag and set its lactation cohort.
              </p>
              {promoError && (
                <div className="bg-alert/5 border border-alert/20 text-alert p-3 text-xs font-mono">
                  [ERROR] {promoError}
                </div>
              )}
              <form onSubmit={handlePromotionSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                      New Mature Tag *
                    </label>
                    <input
                      type="text"
                      value={promoteTag}
                      onChange={(e) => setPromoteTag(e.target.value)}
                      placeholder="e.g. EL-CT-255"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[9px] font-mono font-bold text-ink uppercase tracking-wider mb-1">
                      Mature Status
                    </label>
                    <select
                      value={promoteStatus}
                      onChange={(e) => setPromoteStatus(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="dry">Dry (Non-Lactating)</option>
                      <option value="milking">Milking (Active Lactation)</option>
                      <option value="treatment">Treatment (Medical Withholding)</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={promoSubmitting}
                  className="btn-primary w-full h-11 text-xs uppercase font-mono tracking-wider rounded-none"
                >
                  {promoSubmitting ? "Promoting..." : "Complete Mature Promotion"}
                </button>
              </form>
            </div>
          )}

          {/* Dairy Milking History */}
          {!animal.isOffspring && isDairy && (
            <div className="bg-paper border border-rule p-6 space-y-4">
              <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
                Daily Production Yields
              </h3>
              {productionHistory.length === 0 ? (
                <p className="text-xs text-muted italic font-sans">No daily milk yields logged on file.</p>
              ) : (
                <div className="max-h-[250px] overflow-y-auto border border-rule divide-y divide-rule font-mono text-xs">
                  {productionHistory.map((rec: any) => (
                    <div key={rec._id} className="flex justify-between p-3 items-center">
                      <span className="text-muted">
                        {new Date(rec.date).toLocaleDateString("en-GB")} {rec.session ? `(${rec.session})` : ""}
                      </span>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-ink">{rec.amount.toFixed(1)} Litres</span>
                        {rec.flagged && (
                          <span className="bg-alert text-cream px-2 py-0.5 text-[9px] font-bold tracking-wider font-mono">
                            WITHHELD
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Meat and Growth Weight History */}
          {!animal.isOffspring && isMeatOrGrowth && (
            <div className="bg-paper border border-rule p-6 space-y-4">
              <div className="flex justify-between items-center border-b border-rule pb-3">
                <h3 className="font-display text-h2 italic uppercase text-moss">
                  Weight & Growth Log
                </h3>
                <div className="flex items-center gap-1.5 text-moss font-mono text-[10px] font-bold">
                  <Scale className="h-4 w-4" />
                  <span>Growth tracking active</span>
                </div>
              </div>
              {productionHistory.filter((r: any) => r.type === "weight").length === 0 ? (
                <p className="text-xs text-muted italic font-sans">No weight records logged for this animal.</p>
              ) : (
                <div className="max-h-[250px] overflow-y-auto border border-rule divide-y divide-rule font-mono text-xs">
                  {productionHistory
                    .filter((r: any) => r.type === "weight")
                    .map((rec: any) => (
                      <div key={rec._id} className="flex justify-between p-3 items-center">
                        <span className="text-muted">
                          {new Date(rec.date).toLocaleDateString("en-GB")}
                        </span>
                        <span className="font-bold text-moss">{rec.amount.toFixed(1)} kg</span>
                      </div>
                    ))}
                </div>
              )}
            </div>
          )}

          {/* Medical Treatments & Active Withholdings */}
          <div className="bg-paper border border-rule p-6 space-y-4">
            <h3 className="font-display text-h2 italic border-b border-rule pb-3 uppercase text-moss">
              Medical Treatments & Withholding Logs
            </h3>
            {treatments.length === 0 ? (
              <p className="text-xs text-muted italic font-sans">No medical incidents or treatment plans logged.</p>
            ) : (
              <div className="space-y-4 font-sans text-xs">
                {treatments.map((t: any) => {
                  const isCurrentlyWithheld = t.withholdingUntil > Date.now();
                  return (
                    <div key={t._id} className="p-4 bg-paper-2 border border-rule space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <strong className="text-ink text-sm block mb-0.5">{t.condition}</strong>
                          <span className="text-[10px] font-mono text-muted uppercase">
                            Administered: {t.drugAdministered} ({t.dosage})
                          </span>
                        </div>
                        <span className="font-mono text-[9px] text-muted">
                          {new Date(t.date).toLocaleDateString("en-GB")}
                        </span>
                      </div>
                      <p className="text-muted text-xs leading-relaxed">{t.notes}</p>
                      
                      <div className={`mt-2 font-mono text-[9px] border px-2 py-1.5 flex items-center gap-2 ${
                        isCurrentlyWithheld 
                          ? "bg-alert/5 text-alert border-alert/20" 
                          : "bg-moss/5 text-moss border-moss/20"
                      }`}>
                        {isCurrentlyWithheld ? (
                          <>
                            <AlertTriangle className="h-3.5 w-3.5" />
                            <span>
                              Active Medication Withholding until {new Date(t.withholdingUntil).toLocaleDateString("en-GB")} ({t.withholdingDays} days)
                            </span>
                          </>
                        ) : (
                          <>
                            <Check className="h-3.5 w-3.5" />
                            <span>Withholding Cleared ({t.withholdingDays} days)</span>
                          </>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
