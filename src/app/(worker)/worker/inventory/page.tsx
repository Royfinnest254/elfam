"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check, Package } from "lucide-react";

export default function WorkerInventoryPage() {
  const feedInventory = useQuery(api.records.listFeedInventory);
  const vetInventory = useQuery(api.records.listVetInventory);
  const addMovementMutation = useMutation(api.records.addInventoryMovement);
  const user = useQuery(api.users.viewer);

  const [activeTab, setActiveTab] = useState<"feed" | "vet">("feed");
  const [selectedId, setSelectedId] = useState("");
  const [itemType, setItemType] = useState<"feed" | "vet">("feed");
  const [movementType, setMovementType] = useState<"restock" | "withdrawal">("withdrawal");
  const [qty, setQty] = useState("");
  const [notes, setNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (feedInventory === undefined || vetInventory === undefined || user === undefined || user === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading store inventory...</span>
      </div>
    );
  }

  const activeItems = activeTab === "feed" ? feedInventory : vetInventory;

  const handleLogMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!selectedId) { setErrorMsg("Please select an inventory item."); return; }
    const qty_ = parseFloat(qty);
    if (isNaN(qty_) || qty_ <= 0) { setErrorMsg("Enter a valid positive quantity."); return; }
    if (!notes.trim()) { setErrorMsg("Notes are required."); return; }

    const isFeed = activeTab === "feed";
    const item: any = (isFeed ? feedInventory : vetInventory)?.find((i: any) => i._id === selectedId);
    if (!item) { setErrorMsg("Item not found."); return; }

    setSubmitting(true);
    try {
      await addMovementMutation({
        itemId: selectedId,
        itemType: activeTab,
        productName: item.product,
        type: movementType,
        quantity: qty_,
        unit: item.unit,
        performedBy: user._id,
        notes: notes.trim(),
      });
      setStatusMsg(`VERIFIED: ${item.product} — ${movementType} of ${qty_} ${item.unit} logged.`);
      setSelectedId(""); setQty(""); setNotes("");
      setTimeout(() => setStatusMsg(null), 4000);
    } catch (err: any) {
      setErrorMsg(err.message || "Failed to log movement.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Store & Stock Control
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Store Inventory
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Log feed and veterinary stock movements
        </p>
      </header>

      {statusMsg && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#1E8E3E] text-xs font-semibold p-4 flex items-center gap-2">
          <Check className="h-4 w-4 shrink-0" />
          {statusMsg}
        </div>
      )}
      {errorMsg && (
        <div className="bg-[#FFEBE6] border border-[#FFBDAD] text-[#D93025] text-xs font-semibold p-4">
          {errorMsg}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Stock Table */}
        <div className="lg:col-span-7 system-card p-6 space-y-4">
          {/* Tab Toggle */}
          <div className="grid grid-cols-2 gap-2">
            {(["feed", "vet"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => { setActiveTab(t); setSelectedId(""); setItemType(t); }}
                className={`py-2 text-xs font-black uppercase tracking-widest border transition-colors cursor-pointer ${
                  activeTab === t
                    ? "bg-[#202124] border-[#202124] text-white"
                    : "bg-white border-[#DADCE0] text-[#5F6368] hover:bg-[#F8F9FA]"
                }`}
              >
                {t === "feed" ? "Feed Inventory" : "Vet Inventory"}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-black uppercase tracking-wider text-[#5F6368]">
                  <th className="py-3 px-4">Product</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4 text-right">Quantity</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#202124]">
                {activeItems?.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-[#5F6368] italic">
                      No items registered in this inventory.
                    </td>
                  </tr>
                ) : (
                  activeItems?.map((item: any) => {
                    const threshold = item.lowStockThreshold ?? 5;
                    const isLow = item.quantity <= threshold;
                    return (
                      <tr key={item._id} className={`hover:bg-[#F8F9FA]/40 transition-colors ${isLow ? "bg-[#FFEBE6]/20" : ""}`}>
                        <td className="py-3.5 px-4 font-bold">{item.product}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#E8F0FE] border-[#A8C7FA] text-primary">
                            {item.type ?? item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="py-3.5 px-4">
                          {isLow ? (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#FFEBE6] border-[#FFBDAD] text-[#D93025]">
                              LOW STOCK
                            </span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#E3FCEF] border-[#ABF5D1] text-[#1E8E3E]">
                              OK
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Log Movement */}
        <div className="lg:col-span-5 system-card p-6 space-y-5">
          <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-[#5F6368] border-b border-[#DADCE0] pb-3">
            Log Stock Movement
          </h3>
          <form onSubmit={handleLogMovement} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                Inventory Category
              </label>
              <div className="grid grid-cols-2 gap-2 mb-3">
                {(["feed", "vet"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setItemType(t); setActiveTab(t); setSelectedId(""); }}
                    className={`h-9 text-[10px] font-black uppercase tracking-widest border transition-colors cursor-pointer ${
                      itemType === t
                        ? "bg-primary text-white border-primary"
                        : "bg-white text-[#5F6368] border-[#DADCE0] hover:bg-[#F8F9FA]"
                    }`}
                  >
                    {t === "feed" ? "Feed" : "Veterinary"}
                  </button>
                ))}
              </div>
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
                required
              >
                <option value="">-- Select Item --</option>
                {(itemType === "feed" ? feedInventory : vetInventory)?.map((item: any) => (
                  <option key={item._id} value={item._id}>
                    {item.product} ({item.quantity} {item.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                  Action
                </label>
                <select
                  value={movementType}
                  onChange={(e) => setMovementType(e.target.value as any)}
                  className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
                >
                  <option value="withdrawal">Withdrawal</option>
                  <option value="restock">Restock</option>
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                  Quantity
                </label>
                <input
                  type="number" step="0.1" required
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full h-11 bg-[#F8F9FA] border border-[#DADCE0] px-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-black text-[#5F6368] mb-1.5 uppercase tracking-wider">
                Notes
              </label>
              <textarea
                rows={3} required
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Usage context, field block, or restock invoice..."
                className="w-full bg-[#F8F9FA] border border-[#DADCE0] p-3 text-xs font-semibold text-[#202124] focus:outline-none focus:border-primary rounded-none resize-none"
              />
            </div>

            <button
              type="submit" disabled={submitting}
              className="w-full btn-primary h-12 text-[10px] rounded-none uppercase tracking-wider disabled:opacity-40"
            >
              {submitting ? "Logging..." : "Commit Stock Entry"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
