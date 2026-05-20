"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Check, Truck } from "lucide-react";

export default function ContractDetailPage() {
  const { contractId } = useParams();
  const contractData = useQuery(api.records.getContractDetails, { contractId: contractId as any });
  const logDeliveryMutation = useMutation(api.records.addDelivery);

  const [bags, setBags] = useState("");
  const [vehicleRef, setVehicleRef] = useState("");
  const [notes, setNotes] = useState("");

  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (contractData === undefined) {
    return <div className="text-small text-muted italic p-8 font-sans">Loading contract file...</div>;
  }

  if (contractData === null) {
    return (
      <div className="space-y-4 text-center py-12 text-navy">
        <h3 className="font-display text-h1 italic">Contract Registry Not Found</h3>
        <Link href="/manager/contracts" className="text-small underline uppercase tracking-wider font-bold">
          Return to contracts ledger
        </Link>
      </div>
    );
  }

  const { contract, deliveries } = contractData;

  const totalDeliveredBags = deliveries.reduce((sum: number, d: any) => sum + d.bags, 0);
  const percentageComplete = contract.contractedBags > 0
    ? (totalDeliveredBags / contract.contractedBags) * 100
    : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!bags || !vehicleRef) {
      setError("Please specify quantity of bags and vehicle registration number.");
      return;
    }

    setSubmitting(true);
    try {
      await logDeliveryMutation({
        contractId: contract._id,
        date: Date.now(),
        bags: parseInt(bags),
        vehicleRef,
        notes,
      });

      setSuccess(true);
      setBags("");
      setVehicleRef("");
      setNotes("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(e.message || "Failed to commit delivery record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-navy">
      <header className="border-b border-rule pb-6">
        <Link href="/manager/contracts" className="text-small text-navy hover:text-gold uppercase tracking-wider font-semibold flex items-center gap-1 mb-4">
          <ArrowLeft className="h-4 w-4" />
          <span>Back to Contracts</span>
        </Link>
        <div className="flex justify-between items-end">
          <div>
            <span className="font-mono text-small uppercase text-muted tracking-wider block">
              Contract Agreement Ledger
            </span>
            <h1 className="font-display text-display italic text-navy">
              {contract.buyer}
            </h1>
          </div>
          <span className="font-mono text-small font-bold uppercase px-3 py-1 bg-paper border border-rule">
            {contract.status}
          </span>
        </div>
      </header>

      {/* Contract telemetry */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Contract Target</span>
          <strong className="text-navy text-h2 font-display italic block mt-1">{contract.contractedBags} Bags</strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Total Dispatched</span>
          <strong className="text-navy text-h2 font-display italic block mt-1">{totalDeliveredBags} Bags</strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Price per Bag</span>
          <strong className="text-navy text-h2 font-display italic block mt-1">KES {contract.pricePerBag}</strong>
        </div>
        <div className="bg-paper border border-rule p-5 font-mono text-small">
          <span className="text-muted block uppercase">Completion State</span>
          <strong className="text-navy text-h2 font-display italic block mt-1">{percentageComplete.toFixed(1)}%</strong>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Deliveries list */}
        <div className="lg:col-span-7 bg-paper border border-rule p-6 space-y-6">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3">Delivery Dispatch Ledger</h3>

          {deliveries.length === 0 ? (
            <p className="text-small text-muted italic">No delivery truck dispatches recorded yet for this contract.</p>
          ) : (
            <div className="space-y-3 font-mono text-small">
              {deliveries.map((del: any) => (
                <div key={del._id} className="p-4 bg-paper-2 border border-rule flex items-start justify-between">
                  <div className="space-y-1">
                    <span className="font-bold text-navy">{del.bags} Bags Dispatched</span>
                    <p className="text-[10px] text-muted">Vehicle Ref: {del.vehicleRef}</p>
                    {del.notes && <p className="text-[11px] text-slate-500 font-sans mt-1">Notes: {del.notes}</p>}
                  </div>
                  <span className="text-[10px] text-muted">{new Date(del.date).toLocaleDateString()}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Dispatch Form */}
        <div className="lg:col-span-5 bg-paper border border-rule p-6 space-y-6">
          <h3 className="font-display text-h2 italic border-b border-rule pb-3">Log Truck Dispatch</h3>

          {success && (
            <div className="bg-success/10 border border-success/30 text-success text-small p-4 font-mono flex items-center gap-2">
              <Check className="h-4 w-4" />
              <span>Dispatch entry successfully committed.</span>
            </div>
          )}

          {error && (
            <div className="bg-alert/10 border border-alert/30 text-alert text-small p-4 font-mono">
              [Error] {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-mono text-small text-navy mb-1.5 uppercase tracking-wider font-semibold">Bags Dispatched</label>
              <input
                type="number"
                placeholder="e.g. 150"
                value={bags}
                onChange={(e) => setBags(e.target.value)}
                className="w-full bg-paper-2 border border-rule px-3 py-2.5 text-body text-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-small text-navy mb-1.5 uppercase tracking-wider font-semibold">Vehicle Registration</label>
              <input
                type="text"
                placeholder="e.g. KBG 450A"
                value={vehicleRef}
                onChange={(e) => setVehicleRef(e.target.value)}
                className="w-full bg-paper-2 border border-rule px-3 py-2.5 text-body text-navy focus:outline-none"
              />
            </div>

            <div>
              <label className="block font-mono text-small text-navy mb-1.5 uppercase tracking-wider font-semibold">Gate Notes / Waybill Ref</label>
              <input
                type="text"
                placeholder="Waybill #8092, driver details..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-paper-2 border border-rule px-3 py-2.5 text-body text-navy focus:outline-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-navy text-white hover:bg-gold hover:text-navy py-3 text-body font-semibold uppercase tracking-wider transition-all cursor-pointer"
            >
              {submitting ? "Writing ledger file..." : "Commit Dispatch Log"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
