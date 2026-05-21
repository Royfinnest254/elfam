"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Plus, X, Tractor, ClipboardList, Check } from "lucide-react";

export default function OwnerOperationsPage() {
  const fields = useQuery(api.records.listFields);
  const contracts = useQuery(api.records.listContracts);
  const deliveries = useQuery(api.records.listAllDeliveries);
  
  const addDeliveryMutation = useMutation(api.records.addDelivery);

  // Form states
  const [logFormOpen, setLogFormOpen] = useState(false);
  const [bags, setBags] = useState("");
  const [vehicleRef, setVehicleRef] = useState("");
  const [notes, setNotes] = useState("");
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  if (fields === undefined || contracts === undefined || deliveries === undefined) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading operations registry...
      </div>
    );
  }

  // --- Calculations ---
  // Sum of acres where crop is not fallow
  const activeCropAcreage = fields
    .filter((f) => f.crop !== "fallow")
    .reduce((sum, f) => sum + f.acres, 0);

  // Active Barley Contract
  const activeBarleyContract = contracts.find(
    (c) => c.crop === "barley" && c.status === "active"
  );

  // Deliveries under this contract
  const barleyDeliveries = activeBarleyContract
    ? deliveries.filter((d) => d.contractId === activeBarleyContract._id)
    : [];

  const totalDeliveredBags = barleyDeliveries.reduce((sum, d) => sum + d.bags, 0);
  const bagsRemaining = activeBarleyContract
    ? Math.max(0, activeBarleyContract.contractedBags - totalDeliveredBags)
    : 0;

  // Submit Handler
  const handleLogDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeBarleyContract) return;

    setError(null);
    setSuccess(false);
    setLoading(true);

    const bagsVal = parseInt(bags);
    if (isNaN(bagsVal) || bagsVal <= 0) {
      setError("Please enter a valid positive number of bags.");
      setLoading(false);
      return;
    }

    if (!vehicleRef.trim()) {
      setError("Please enter a vehicle registration reference.");
      setLoading(false);
      return;
    }

    try {
      await addDeliveryMutation({
        contractId: activeBarleyContract._id,
        date: Date.now(),
        bags: bagsVal,
        vehicleRef: vehicleRef.trim(),
        notes: notes.trim(),
      });
      setSuccess(true);
      setBags("");
      setVehicleRef("");
      setNotes("");
      setTimeout(() => {
        setLogFormOpen(false);
        setSuccess(false);
      }, 1500);
    } catch (err: any) {
      setError(`[Delivery] failed: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      {/* Page Title & Header */}
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Executive Ledger &gt; Operations
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Operations
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Current state of cereal and field operations
        </p>
      </header>

      {/* Split Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Fields Table */}
        <section className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
          <div className="flex items-center gap-2 border-b border-[#DADCE0] pb-3">
            <Tractor className="h-5 w-5 text-[#5F6368]" />
            <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">
              Field Cultivation Logs
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                  <th className="pb-2">Block</th>
                  <th className="pb-2">Size</th>
                  <th className="pb-2">Crop</th>
                  <th className="pb-2">Stage of Growth</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
                {fields.map((field) => {
                  // Standard crop growth stages based on planting dates or crops
                  let stage = "fallow";
                  if (field.crop !== "fallow") {
                    if (field.name.includes("Block A") || field.name.includes("Block B")) {
                      stage = "ready for harvest";
                    } else if (field.name.includes("Block C")) {
                      stage = "flowering";
                    } else if (field.name.includes("Block D")) {
                      stage = "vegetative";
                    } else {
                      stage = "planted";
                    }
                  }

                  return (
                    <tr key={field._id} className="hover:bg-[#F8F9FA]/30">
                      <td className="py-3 font-bold">{field.name}</td>
                      <td className="py-3 font-mono">{field.acres} Ac</td>
                      <td className="py-3 uppercase text-[10px]">
                        <span className={`status-badge ${
                          field.crop === "wheat" ? "bg-primary-subtle text-primary border-primary-subtle" :
                          field.crop === "barley" ? "bg-[#E3FCEF] text-[#1E8E3E] border-[#E3FCEF]" :
                          "bg-[#DADCE0] text-[#5F6368] border-[#DADCE0]"
                        }`}>
                          {field.crop}
                        </span>
                      </td>
                      <td className="py-3 text-[#5F6368] uppercase tracking-wide text-[10px]">
                        <span className={`status-badge ${
                          stage === "ready for harvest" ? "bg-[#FFEBE6] text-[#D93025] border-[#FFEBE6]" :
                          stage === "flowering" ? "bg-[#FFF0B3] text-[#172B4D] border-[#FFF0B3]" :
                          stage === "vegetative" ? "bg-[#E3FCEF] text-[#1E8E3E] border-[#E3FCEF]" :
                          stage === "fallow" ? "bg-[#F8F9FA] text-[#7A869A] border-[#DADCE0]" :
                          "bg-primary-subtle text-primary border-primary-subtle"
                        }`}>
                          {stage}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="pt-4 border-t border-[#DADCE0] text-xs font-bold text-[#5F6368]">
            Total crop acreage: <span className="text-[#202124] font-mono">{activeCropAcreage} acres</span>.
          </div>
        </section>

        {/* Right Column: Contracts & Deliveries */}
        <section className="lg:col-span-6 bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-6">
          <div className="flex justify-between items-center border-b border-[#DADCE0] pb-3">
            <div className="flex items-center gap-2">
              <ClipboardList className="h-5 w-5 text-[#5F6368]" />
              <h3 className="text-sm font-black uppercase tracking-wider text-[#202124]">
                Contracts & Deliveries
              </h3>
            </div>
            {activeBarleyContract && (
              <button
                type="button"
                onClick={() => setLogFormOpen(true)}
                className="h-9 px-4 text-[10px] rounded-xl font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark text-white flex items-center gap-1.5 cursor-pointer"
              >
                <Plus className="h-4 w-4" />
                <span>Log Delivery</span>
              </button>
            )}
          </div>

          {activeBarleyContract ? (
            <div className="space-y-6">
              {/* Active Contract Info */}
              <div className="bg-[#F8F9FA] border border-[#DADCE0] p-5 rounded-xl space-y-4 text-xs font-semibold text-[#5F6368]">
                <div className="flex justify-between items-center">
                  <span className="text-[#202124] font-bold text-sm">{activeBarleyContract.buyer} — Barley</span>
                  <span className="status-badge status-ok text-[9px] uppercase px-2 py-0.5">ACTIVE</span>
                </div>
                <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#DADCE0]">
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#7A869A] block">Unit Price</span>
                    <span className="text-[#202124] font-bold font-mono">KES {activeBarleyContract.pricePerBag}</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#7A869A] block">Delivered</span>
                    <span className="text-[#1E8E3E] font-bold font-mono">{totalDeliveredBags} Bags</span>
                  </div>
                  <div>
                    <span className="text-[9px] uppercase tracking-wider text-[#7A869A] block">Remaining</span>
                    <span className="text-[#D93025] font-bold font-mono">{bagsRemaining} Bags</span>
                  </div>
                </div>
              </div>

              {/* Deliveries Table */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">Deliveries Log</span>
                <div className="overflow-x-auto max-h-[220px] overflow-y-auto pr-1 custom-scrollbar">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                        <th className="pb-2">Date</th>
                        <th className="pb-2 text-right">Volume</th>
                        <th className="pb-2">Vehicle</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
                      {barleyDeliveries.length === 0 ? (
                        <tr>
                          <td colSpan={3} className="py-4 text-center text-xs italic text-[#5F6368]">
                            No deliveries logged under this contract.
                          </td>
                        </tr>
                      ) : (
                        barleyDeliveries.map((d) => (
                          <tr key={d._id}>
                            <td className="py-2.5 font-mono text-[11px] text-[#5F6368]">
                              {new Date(d.date).toLocaleDateString("en-GB")}
                            </td>
                            <td className="py-2.5 font-mono text-right text-[#202124]">{d.bags} Bags</td>
                            <td className="py-2.5 font-mono uppercase text-[#7A869A]">{d.vehicleRef}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          ) : (
            <p className="text-xs text-[#5F6368] italic font-semibold">No active Barley contracts found.</p>
          )}
        </section>
      </div>

      {/* Log Delivery Modal */}
      {logFormOpen && activeBarleyContract && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#202124]/60 p-4 animate-in fade-in duration-200">
          <div className="bg-white border border-[#DADCE0] rounded-[24px] max-w-[420px] w-full p-6 space-y-6 relative shadow-elevated">
            <button
              type="button"
              onClick={() => setLogFormOpen(false)}
              className="absolute top-5 right-5 p-2 text-[#5F6368] hover:text-[#202124] hover:bg-[#F8F9FA] rounded-xl transition-all cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div>
              <h2 className="font-display text-lg font-black uppercase tracking-tight text-[#202124]">
                Log Contract Delivery
              </h2>
              <span className="text-[10px] uppercase font-bold text-[#5F6368]">
                {activeBarleyContract.buyer} barley contract &middot; {activeBarleyContract.season}
              </span>
            </div>

            {success && (
              <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 rounded-xl flex items-center gap-2">
                <Check className="h-4 w-4" />
                <span>Delivery logged successfully.</span>
              </div>
            )}

            {error && (
              <div className="bg-[#FFEBE6] border border-[#FFD2C7] text-[#D93025] text-xs font-semibold p-4 rounded-xl">
                {error}
              </div>
            )}

            <form onSubmit={handleLogDelivery} className="space-y-4 text-xs font-semibold">
              <div>
                <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                  Bags Dispatched
                </label>
                <input
                  type="number"
                  required
                  placeholder="e.g. 120"
                  value={bags}
                  onChange={(e) => setBags(e.target.value)}
                  className="w-full h-11 border border-[#DADCE0] bg-white px-3 text-xs font-bold text-[#202124] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                  Vehicle Reference (License Plate)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. KBG 412K"
                  value={vehicleRef}
                  onChange={(e) => setVehicleRef(e.target.value)}
                  className="w-full h-11 border border-[#DADCE0] bg-white px-3 text-xs font-bold text-[#202124] focus:outline-none focus:border-primary"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1">
                  Delivery Notes
                </label>
                <textarea
                  rows={2}
                  placeholder="Any gate delivery notes or driver details..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full border border-[#DADCE0] bg-white p-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[48px] rounded-xl bg-primary text-white text-[10px] font-bold uppercase tracking-wider hover:bg-primary-dark active:scale-[0.98] transition-all flex items-center justify-center cursor-pointer"
              >
                {loading ? "Saving..." : "Log Delivery"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
