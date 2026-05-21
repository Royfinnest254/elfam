"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Check, Sliders, Plus } from "lucide-react";

export default function ManagerInventoryPage() {
  const feedInventory = useQuery(api.records.listFeedInventory);
  const vetInventory = useQuery(api.records.listVetInventory);
  const user = useQuery(api.users.viewer);

  const updateFeedQtyMutation = useMutation(api.records.updateFeedQuantity);
  const updateVetQtyMutation = useMutation(api.records.updateVetQuantity);
  const addMovementMutation = useMutation(api.records.addInventoryMovement);

  const [activeTab, setActiveTab] = useState<"feed" | "vet">("feed");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState("");

  // Restock modal state
  const [restockId, setRestockId] = useState<string | null>(null);
  const [restockType, setRestockType] = useState<"feed" | "vet">("feed");
  const [restockQty, setRestockQty] = useState("");
  const [restockNotes, setRestockNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  if (feedInventory === undefined || vetInventory === undefined || user === undefined || user === null) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading store inventory...</span>
      </div>
    );
  }

  const showMsg = (msg: string, isError = false) => {
    if (isError) { setErrorMsg(msg); setStatusMsg(null); }
    else { setStatusMsg(msg); setErrorMsg(null); }
    setTimeout(() => { setStatusMsg(null); setErrorMsg(null); }, 4000);
  };

  const currentItems = activeTab === "feed" ? feedInventory : vetInventory;

  const handleSaveQty = async (item: any) => {
    const val = parseFloat(editingValue);
    if (isNaN(val) || val < 0) { showMsg("Enter a valid positive number.", true); return; }
    setActionLoading(true);
    try {
      if (activeTab === "feed") {
        await updateFeedQtyMutation({ id: item._id, quantity: val });
      } else {
        await updateVetQtyMutation({ id: item._id, quantity: val });
      }
      showMsg(`VERIFIED: ${item.product} quantity updated to ${val} ${item.unit}.`);
      setEditingId(null); setEditingValue("");
    } catch (e: any) {
      showMsg(e.message, true);
    } finally { setActionLoading(false); }
  };

  const handleRestock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockId || !user) return;
    const qty = parseFloat(restockQty);
    if (isNaN(qty) || qty <= 0) { showMsg("Enter a valid quantity.", true); return; }
    const items = restockType === "feed" ? feedInventory : vetInventory;
    const item: any = items?.find((i: any) => i._id === restockId);
    if (!item) return;

    setActionLoading(true);
    try {
      await addMovementMutation({
        itemId: restockId,
        itemType: restockType,
        productName: item.product,
        type: "restock",
        quantity: qty,
        unit: item.unit,
        performedBy: user._id,
        notes: restockNotes.trim() || "Manager restock entry.",
      });
      showMsg(`VERIFIED: ${item.product} restocked by ${qty} ${item.unit}.`);
      setRestockId(null); setRestockQty(""); setRestockNotes("");
    } catch (e: any) {
      showMsg(e.message, true);
    } finally { setActionLoading(false); }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DADCE0] pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
            Store & Stock Control
          </span>
          <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
            Store Inventory
          </h1>
          <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
            Manage feed and veterinary stock levels
          </p>
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

      {/* Tab Toggle */}
      <div className="grid grid-cols-2 gap-2 max-w-sm">
        {(["feed", "vet"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => { setActiveTab(t); setEditingId(null); setRestockId(null); }}
            className={`py-2.5 text-[10px] font-black uppercase tracking-widest border transition-colors cursor-pointer ${
              activeTab === t
                ? "bg-[#202124] border-[#202124] text-white"
                : "bg-white border-[#DADCE0] text-[#5F6368] hover:bg-[#F8F9FA]"
            }`}
          >
            {t === "feed" ? "Feed Inventory" : "Vet Inventory"}
          </button>
        ))}
      </div>

      {/* Stock Table */}
      <div className="system-card p-6 space-y-4">
        <div className="overflow-x-auto table-scroll custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-black uppercase tracking-wider text-[#5F6368]">
                <th className="py-3 px-4">Product</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Quantity</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-center">Adjust Qty</th>
                <th className="py-3 px-4 text-right">Restock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#202124]">
              {currentItems.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-[#5F6368] italic">
                    No inventory items found for this category.
                  </td>
                </tr>
              ) : (
                currentItems.map((item: any) => {
                  const threshold = item.lowStockThreshold ?? 5;
                  const isLow = item.quantity <= threshold;
                  return (
                    <React.Fragment key={item._id}>
                      <tr className={`hover:bg-[#F8F9FA]/40 transition-colors ${isLow ? "bg-[#FFEBE6]/10" : ""}`}>
                        <td className="py-3.5 px-4 font-bold">{item.product}</td>
                        <td className="py-3.5 px-4">
                          <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#E8F0FE] border-[#A8C7FA] text-primary">
                            {item.type ?? item.category}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-bold">
                          {editingId === item._id ? (
                            <input
                              type="number" step="0.1"
                              value={editingValue}
                              onChange={(e) => setEditingValue(e.target.value)}
                              className="w-24 px-2 py-1 text-right text-xs border border-[#DADCE0] bg-white focus:outline-none"
                              placeholder={item.quantity.toString()}
                            />
                          ) : (
                            <span>{item.quantity} {item.unit}</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4">
                          {isLow ? (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#FFEBE6] border-[#FFBDAD] text-[#D93025]">LOW STOCK</span>
                          ) : (
                            <span className="text-[9px] font-black uppercase px-1.5 py-0.5 border bg-[#E3FCEF] border-[#ABF5D1] text-[#1E8E3E]">OK</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {editingId === item._id ? (
                            <div className="flex justify-center gap-1.5">
                              <button type="button"
                                onClick={() => handleSaveQty(item)}
                                disabled={actionLoading}
                                className="px-2.5 py-1 text-[10px] font-bold bg-primary text-white cursor-pointer hover:bg-primary-dark transition-colors"
                              >Save</button>
                              <button type="button"
                                onClick={() => { setEditingId(null); setEditingValue(""); }}
                                className="px-2.5 py-1 text-[10px] font-bold border border-[#DADCE0] bg-white text-[#5F6368] cursor-pointer hover:bg-[#F8F9FA]"
                              >×</button>
                            </div>
                          ) : (
                            <button type="button"
                              onClick={() => { setEditingId(item._id); setEditingValue(item.quantity.toString()); setRestockId(null); }}
                              className="px-2.5 py-1 hover:bg-[#F8F9FA] text-primary border border-primary/20 inline-flex items-center gap-1 cursor-pointer text-[10px] font-bold"
                            >
                              <Sliders className="h-3 w-3" /> Edit
                            </button>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button type="button"
                            onClick={() => { setRestockId(restockId === item._id ? null : item._id); setRestockType(activeTab); setRestockQty(""); setRestockNotes(""); setEditingId(null); }}
                            className="px-2.5 py-1 text-[10px] font-bold border border-[#ABF5D1] bg-[#E3FCEF] hover:bg-[#C6F6D5] text-[#1E8E3E] flex items-center gap-1 cursor-pointer ml-auto"
                          >
                            <Plus className="h-3 w-3" /> Restock
                          </button>
                        </td>
                      </tr>
                      {restockId === item._id && (
                        <tr>
                          <td colSpan={6} className="p-0">
                            <form onSubmit={handleRestock} className="bg-[#E3FCEF]/30 border-t border-[#ABF5D1] px-4 py-3 flex flex-wrap items-end gap-3">
                              <div>
                                <label className="text-[9px] font-black uppercase text-[#5F6368] block mb-1">Quantity to Restock</label>
                                <input type="number" step="0.1" required value={restockQty} onChange={(e) => setRestockQty(e.target.value)}
                                  className="h-9 w-28 bg-white border border-[#DADCE0] px-2 text-xs font-semibold text-[#202124] focus:outline-none"
                                  placeholder={`In ${item.unit}`}
                                />
                              </div>
                              <div className="flex-1 min-w-[180px]">
                                <label className="text-[9px] font-black uppercase text-[#5F6368] block mb-1">Notes</label>
                                <input type="text" value={restockNotes} onChange={(e) => setRestockNotes(e.target.value)}
                                  className="w-full h-9 bg-white border border-[#DADCE0] px-2 text-xs font-semibold text-[#202124] focus:outline-none"
                                  placeholder="Delivery invoice or source..."
                                />
                              </div>
                              <button type="submit" disabled={actionLoading}
                                className="h-9 px-4 text-[9px] font-bold uppercase tracking-wider bg-[#1E8E3E] hover:bg-[#166534] text-white transition-colors cursor-pointer disabled:opacity-50"
                              >
                                Commit Restock
                              </button>
                              <button type="button" onClick={() => setRestockId(null)}
                                className="h-9 px-3 text-[9px] font-bold uppercase tracking-wider border border-[#DADCE0] bg-white hover:bg-[#F8F9FA] text-[#5F6368] cursor-pointer"
                              >Cancel</button>
                            </form>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
