"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info, Sliders } from "lucide-react";

export default function WorkerInventoryPage() {
  const activeInventory = useQuery(api.records.listInventory, { status: "active" });
  const pendingInventory = useQuery(api.records.listInventory, { status: "pending_approval" });

  const logMovement = useMutation(api.records.logInventoryMovement);
  const proposeItem = useMutation(api.records.registerInventoryItem);

  const [activeTab, setActiveTab] = useState<"movement" | "propose">("movement");

  // Common notifications
  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Movement state
  const [selectedInventoryId, setSelectedInventoryId] = useState("");
  const [movementType, setMovementType] = useState<"restock" | "withdrawal">("withdrawal");
  const [movementQty, setMovementQty] = useState("");
  const [notes, setNotes] = useState("");

  // Propose state
  const [prodName, setProdName] = useState("");
  const [prodCategory, setProdCategory] = useState("Feed");
  const [prodUnit, setProdUnit] = useState("bags");
  const [lowThreshold, setLowThreshold] = useState("");

  if (activeInventory === undefined || pendingInventory === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading store inventory...</span>
      </div>
    );
  }

  const handleResetForm = () => {
    setSelectedInventoryId("");
    setMovementQty("");
    setNotes("");
    setProdName("");
    setLowThreshold("");
  };

  const handleLogMovement = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    const item = activeInventory.find(i => i._id === selectedInventoryId);
    if (!item) {
      setErrorMsg("Please select an active inventory item.");
      return;
    }

    const qty = parseFloat(movementQty);
    if (isNaN(qty) || qty <= 0) {
      setErrorMsg("Please enter a valid positive quantity.");
      return;
    }

    if (movementType === "withdrawal" && item.quantity < qty) {
      setErrorMsg(`Insufficient stock: Only ${item.quantity} ${item.unit} available in store.`);
      return;
    }

    setSubmitting(true);
    try {
      await logMovement({
        inventoryId: selectedInventoryId as any,
        type: movementType,
        quantity: qty,
        notes: notes.trim(),
      });

      setStatusMsg(`VERIFIED: Stock ${movementType} logged successfully.`);
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to log movement.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleProposeItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!prodName.trim()) {
      setErrorMsg("Please enter a product name.");
      return;
    }

    const threshold = parseFloat(lowThreshold);
    if (isNaN(threshold) || threshold < 0) {
      setErrorMsg("Please enter a valid warning threshold.");
      return;
    }

    setSubmitting(true);
    try {
      await proposeItem({
        productName: prodName.trim(),
        category: prodCategory,
        unit: prodUnit,
        lowStockThreshold: threshold,
      });

      setStatusMsg("VERIFIED: Proposed item submitted for Manager approval.");
      handleResetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to propose new inventory item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="label block mb-2 text-teal">
          Store & Stock Control
        </span>
        <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
          Store Inventory
        </h1>
        <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
          Log stock movements and propose new inventory additions for validation
        </p>
      </header>

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

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Active Stock levels table */}
        <div className="lg:col-span-7 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
              Active Store Stock
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[10px] font-semibold uppercase tracking-wider text-[#5E6C84]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE1E6] text-xs font-medium text-[#0F1B2D]">
                  {activeInventory.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#5E6C84] italic">
                        No active inventory items found. Propose items to get started.
                      </td>
                    </tr>
                  ) : (
                    activeInventory.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className={`hover:bg-[#F4F5F7]/40 transition-colors ${isLow ? "bg-[#FF5630]/5" : ""}`}>
                          <td className="py-3.5 px-4 font-bold">{item.productName}</td>
                          <td className="py-3.5 px-4">
                            <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold mono">
                            {item.quantity.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-3.5 px-4">
                            {isLow ? (
                              <span className="status-badge text-[9px] text-alert border-alert/20 bg-alert/5 font-bold">
                                LOW STOCK
                              </span>
                            ) : (
                              <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 font-bold">
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

          {/* Pending items check (Oversight info) */}
          {pendingInventory.length > 0 && (
            <div className="system-card p-6 space-y-4">
              <h4 className="text-xs font-bold text-[#0F1B2D] uppercase tracking-wider">
                My Pending Proposals Queue ({pendingInventory.length})
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {pendingInventory.map((item) => (
                  <div key={item._id} className="p-3 bg-[#F4F5F7] border border-[#DFE1E6] text-xs">
                    <span className="font-bold text-[#0F1B2D] block">{item.productName}</span>
                    <span className="text-[10px] text-[#5E6C84] uppercase tracking-wider block mt-1">
                      Cat: {item.category} &bull; Alert Target: {item.lowStockThreshold} {item.unit}
                    </span>
                    <span className="status-badge text-[9px] text-[#C09E5A] border-[#C09E5A]/20 bg-[#C09E5A]/5 mt-2 block w-fit font-bold">
                      AWAITING REVIEW
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: Operational Logging Actions */}
        <div className="lg:col-span-5 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">
              Store Control Panel
            </h3>

            {/* Action Tabs */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("movement");
                  setStatusMsg(null);
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-semibold border rounded-[6px] transition-colors cursor-pointer ${
                  activeTab === "movement"
                    ? "bg-[#0F1B2D] border-[#0F1B2D] text-white"
                    : "bg-white border-[#DFE1E6] text-[#0F1B2D] hover:bg-[#F4F5F7]"
                }`}
              >
                Stock Movement
              </button>
              <button
                type="button"
                onClick={() => {
                  setActiveTab("propose");
                  setStatusMsg(null);
                  setErrorMsg(null);
                }}
                className={`py-2 text-xs font-semibold border rounded-[6px] transition-colors cursor-pointer ${
                  activeTab === "propose"
                    ? "bg-[#0F1B2D] border-[#0F1B2D] text-white"
                    : "bg-white border-[#DFE1E6] text-[#0F1B2D] hover:bg-[#F4F5F7]"
                }`}
              >
                Propose Item
              </button>
            </div>

            {/* Render Form */}
            {activeTab === "movement" ? (
              <form onSubmit={handleLogMovement} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="inventory-item-select" className="label text-[#5E6C84]">Select Store Product</label>
                  <select
                    id="inventory-item-select"
                    value={selectedInventoryId}
                    onChange={(e) => setSelectedInventoryId(e.target.value)}
                    className="input-field bg-white cursor-pointer"
                    required
                  >
                    <option value="">-- Choose Stock Item --</option>
                    {activeInventory.map((item) => (
                      <option key={item._id} value={item._id}>
                        [{item.category}] {item.productName} ({item.quantity.toFixed(1)} {item.unit} in stock)
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="move-type-select" className="label text-[#5E6C84]">Action Type</label>
                    <select
                      id="move-type-select"
                      value={movementType}
                      onChange={(e) => setMovementType(e.target.value as any)}
                      className="input-field bg-white cursor-pointer"
                      required
                    >
                      <option value="withdrawal">Withdrawal (Usage)</option>
                      <option value="restock">Restock (Received)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="move-qty-input" className="label text-[#5E6C84]">Quantity</label>
                    <input
                      type="number"
                      id="move-qty-input"
                      step="0.1"
                      value={movementQty}
                      onChange={(e) => setMovementQty(e.target.value)}
                      className="input-field"
                      placeholder="e.g. 5"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="move-notes" className="label text-[#5E6C84]">Usage / Delivery Notes</label>
                  <textarea
                    id="move-notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="input-field min-h-[100px] py-2 resize-none"
                    placeholder="Note specific field block, treatment herd reference, or restock invoice details..."
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
                >
                  {submitting ? "Logging stock movement..." : "Log Stock Entry"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleProposeItem} className="space-y-4">
                <div className="space-y-1">
                  <label htmlFor="prod-name-input" className="label text-[#5E6C84]">Product Name</label>
                  <input
                    type="text"
                    id="prod-name-input"
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Dairy Meal Grade II, Veterinary Penicillin"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label htmlFor="category-select" className="label text-[#5E6C84]">Category Group</label>
                    <select
                      id="category-select"
                      value={prodCategory}
                      onChange={(e) => setProdCategory(e.target.value)}
                      className="input-field bg-white cursor-pointer"
                      required
                    >
                      <option value="Feed">Animal Feed</option>
                      <option value="Medicine">Veterinary Medicine</option>
                      <option value="Supplies">General Supplies</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="unit-select" className="label text-[#5E6C84]">Stock Unit</label>
                    <select
                      id="unit-select"
                      value={prodUnit}
                      onChange={(e) => setProdUnit(e.target.value)}
                      className="input-field bg-white cursor-pointer"
                      required
                    >
                      <option value="bags">Bags</option>
                      <option value="tonnes">Tonnes</option>
                      <option value="kg">Kilograms (Kg)</option>
                      <option value="ml">Millilitres (Ml)</option>
                      <option value="litres">Litres</option>
                    </select>
                  </div>
                </div>

                <div className="space-y-1">
                  <label htmlFor="low-threshold-input" className="label text-[#5E6C84]">Low Stock Warning Threshold</label>
                  <input
                    type="number"
                    id="low-threshold-input"
                    value={lowThreshold}
                    onChange={(e) => setLowThreshold(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 10 (warns when stock drops to this level)"
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary w-full disabled:opacity-50 h-11 text-xs"
                >
                  {submitting ? "Submitting proposal..." : "Propose new stock item"}
                </button>
              </form>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
