"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, Check } from "lucide-react";

export default function WorkerRecordInventoryPage() {
  const feedInventory = useQuery(api.records.listFeedInventory);
  const vetInventory = useQuery(api.records.listVetInventory);
  const addMovementMutation = useMutation(api.records.addInventoryMovement);
  const user = useQuery(api.users.viewer);

  const [activeTab, setActiveTab] = useState<"movement">("movement");
  const [itemType, setItemType] = useState<"feed" | "vet">("feed");
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [selectedId, setSelectedId] = useState("");
  const [movementType, setMovementType] = useState<"restock" | "withdrawal">("withdrawal");
  const [movementQty, setMovementQty] = useState("");
  const [notes, setNotes] = useState("");

  if (feedInventory === undefined || vetInventory === undefined || user === undefined || user === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading active inventory items...</span>
      </div>
    );
  }

  const items = itemType === "feed" ? feedInventory : vetInventory;

  const handleLogMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const item: any = items?.find((i: any) => i._id === selectedId);
    if (!item) { setErrorMsg("Please select an active inventory item."); return; }

    const qty = parseFloat(movementQty);
    if (isNaN(qty) || qty <= 0) { setErrorMsg("Please enter a valid positive quantity."); return; }
    if (movementType === "withdrawal" && item.quantity < qty) {
      setErrorMsg(`Insufficient stock: Only ${item.quantity} ${item.unit} available.`); return;
    }
    if (!notes.trim()) { setErrorMsg("Notes are required."); return; }

    setSubmitting(true);
    try {
      await addMovementMutation({
        itemId: selectedId,
        itemType,
        productName: item.product,
        type: movementType,
        quantity: qty,
        unit: item.unit,
        performedBy: user._id,
        notes: notes.trim(),
      });
      setStatusMsg(`VERIFIED: ${movementType === "withdrawal" ? "Withdrawal" : "Restock"} of ${qty} ${item.unit} logged for ${item.product}.`);
      setSelectedId(""); setMovementQty(""); setNotes("");
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log movement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[640px] mx-auto p-4 space-y-6 pb-20 text-[#1A56DB]">
      <header className="flex items-center gap-4 border-b border-[#DADCE0] pb-4">
        <Link href="/worker" className="p-2 hover:bg-[#F8F9FA] rounded-[6px] transition-colors border border-[#DADCE0]">
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div>
          <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block">Station Store Entry</span>
          <h1 className="text-xl font-normal tracking-tight">Log Store Inventory</h1>
        </div>
      </header>

      {statusMsg && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />{statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] text-xs font-semibold p-4">
          {errorMsg}
        </div>
      )}

      <div className="system-card p-6 rounded-none space-y-5">
        <form onSubmit={handleLogMovement} className="space-y-4">
          <div>
            <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1.5">Inventory Type</label>
            <div className="grid grid-cols-2 gap-2">
              {(["feed", "vet"] as const).map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => { setItemType(t); setSelectedId(""); }}
                  className={`py-2 text-xs font-black uppercase tracking-widest border transition-colors cursor-pointer ${
                    itemType === t
                      ? "bg-[#1A56DB] border-[#1A56DB] text-white"
                      : "bg-white border-[#DADCE0] text-[#1A56DB] hover:bg-[#F8F9FA]"
                  }`}
                >
                  {t === "feed" ? "Feed Store" : "Vet Inventory"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1.5">Select Store Product</label>
            <select
              value={selectedId}
              onChange={(e) => setSelectedId(e.target.value)}
              className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
              required
            >
              <option value="">-- Choose Stock Item --</option>
              {items?.map((item: any) => (
                <option key={item._id} value={item._id}>
                  {item.product} (Current: {item.quantity} {item.unit})
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1.5">Action Type</label>
              <select
                value={movementType}
                onChange={(e) => setMovementType(e.target.value as any)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
                required
              >
                <option value="withdrawal">Withdrawal (Usage)</option>
                <option value="restock">Restock (Received)</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1.5">Quantity</label>
              <input
                type="number" step="0.1"
                value={movementQty}
                onChange={(e) => setMovementQty(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
                placeholder="e.g. 5" required
              />
            </div>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block mb-1.5">Usage / Delivery Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F8F9FA] border border-[#DADCE0] p-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary resize-none rounded-none min-h-[100px]"
              placeholder="Field block, animal group, invoice number..."
              required
            />
          </div>

          <button
            type="submit" disabled={submitting}
            className="w-full btn-primary h-11 text-xs uppercase tracking-wider disabled:opacity-40 rounded-none"
          >
            {submitting ? "Logging stock movement..." : "Log Stock Entry"}
          </button>
        </form>
      </div>
    </div>
  );
}
