"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info, Check, X, Sliders } from "lucide-react";

export default function ManagerInventoryPage() {
  const activeInventory = useQuery(api.records.listInventory, { status: "active" });
  const pendingInventory = useQuery(api.records.listInventory, { status: "pending_approval" });

  const approveMutation = useMutation(api.records.approveInventoryItem);
  const rejectMutation = useMutation(api.records.rejectInventoryItem);
  const updateThresholdMutation = useMutation(api.records.updateInventoryThreshold);
  const addInventoryItemMutation = useMutation(api.records.addInventoryItem);
  const deleteInventoryItemMutation = useMutation(api.records.deleteInventoryItem);

  // States for threshold modification
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingValue, setEditingValue] = useState<string>("");

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [productName, setProductName] = useState("");
  const [category, setCategory] = useState("Feed");
  const [unit, setUnit] = useState("bags");
  const [initialQuantity, setInitialQuantity] = useState("0");
  const [lowStockThreshold, setLowStockThreshold] = useState("10");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (activeInventory === undefined || pendingInventory === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading store inventory...</span>
      </div>
    );
  }

  const handleApprove = async (id: any) => {
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await approveMutation({ id });
      setStatusMsg("VERIFIED: Proposed item approved and added to active inventory.");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to approve item.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (id: any) => {
    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await rejectMutation({ id });
      setStatusMsg("VERIFIED: Proposed item rejected and removed from queue.");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to reject item.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteInventoryItem = async (id: any) => {
    if (!confirm("Are you sure you want to delete this inventory item record?")) return;
    try {
      await deleteInventoryItemMutation({ id });
      setStatusMsg("VERIFIED: Inventory item record deleted.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete record.");
    }
  };

  const handleSaveThreshold = async (id: any) => {
    const val = parseFloat(editingValue);
    if (isNaN(val) || val < 0) {
      setErrorMsg("Please enter a valid positive number for stock warning threshold.");
      return;
    }

    setActionLoading(true);
    setStatusMsg(null);
    setErrorMsg(null);
    try {
      await updateThresholdMutation({ id, threshold: val });
      setStatusMsg("VERIFIED: Warning threshold updated successfully.");
      setEditingId(null);
      setEditingValue("");
    } catch (e: any) {
      console.error(e);
      setErrorMsg(e.message || "Failed to update threshold.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRegisterStockItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!productName.trim()) {
      setErrorMsg("Product name is required.");
      return;
    }

    const initQty = parseFloat(initialQuantity);
    const threshold = parseFloat(lowStockThreshold);

    if (isNaN(initQty) || initQty < 0) {
      setErrorMsg("Initial quantity must be a non-negative number.");
      return;
    }
    if (isNaN(threshold) || threshold < 0) {
      setErrorMsg("Low stock threshold must be a non-negative number.");
      return;
    }

    setSubmitting(true);
    try {
      await addInventoryItemMutation({
        category,
        productName: productName.trim(),
        unit,
        lowStockThreshold: threshold,
        initialQuantity: initQty,
      });
      setStatusMsg("VERIFIED: Store stock item successfully registered.");
      setProductName("");
      setCategory("Feed");
      setUnit("bags");
      setInitialQuantity("0");
      setLowStockThreshold("10");
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register inventory item.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DADCE0] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label block mb-2 text-teal">
            Store & Stock Control
          </span>
          <h1 className="text-3xl font-normal text-[#1A56DB] tracking-tight">
            Store Inventory
          </h1>
          <p className="body-small text-[#5F6368] mt-1 uppercase tracking-wider font-semibold">
            Manage stock warning thresholds and approve proposed worker inventory item additions
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            setStatusMsg(null);
            setErrorMsg(null);
            setModalOpen(true);
          }}
          className="btn-primary"
        >
          Register stock item
        </button>
      </header>

      {/* Alert Notices */}
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

      {/* Grid: Pending Approvals (Top Priority) vs Current Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Current Active Stock Levels */}
        <div className="lg:col-span-8 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight">
              Active Store Stock
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F8F9FA] border-b border-[#DADCE0] text-[10px] font-semibold uppercase tracking-wider text-[#5F6368]">
                    <th className="py-3 px-4">Product Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-right">Quantity</th>
                    <th className="py-3 px-4 text-right">Alert Threshold</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-center">Alert Control</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DADCE0] text-xs font-medium text-[#1A56DB]">
                  {activeInventory.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#5F6368] italic">
                        No active inventory items found. Add items to get started.
                      </td>
                    </tr>
                  ) : (
                    activeInventory.map((item) => {
                      const isLow = item.quantity <= item.lowStockThreshold;
                      return (
                        <tr key={item._id} className={`hover:bg-[#F8F9FA]/40 transition-colors ${isLow ? "bg-[#D93025]/5" : ""}`}>
                          <td className="py-3.5 px-4 font-bold">{item.productName}</td>
                          <td className="py-3.5 px-4">
                            <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5">
                              {item.category}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-bold mono">
                            {item.quantity.toFixed(1)} {item.unit}
                          </td>
                          <td className="py-3.5 px-4 text-right mono">
                            {editingId === item._id ? (
                              <input
                                type="number"
                                value={editingValue}
                                onChange={(e) => setEditingValue(e.target.value)}
                                className="w-20 px-2 py-1 text-right text-xs border border-[#DADCE0] rounded-[4px]"
                                placeholder={item.lowStockThreshold.toString()}
                              />
                            ) : (
                              <span>{item.lowStockThreshold.toFixed(1)} {item.unit}</span>
                            )}
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
                          <td className="py-3.5 px-4 text-center">
                            {editingId === item._id ? (
                              <div className="flex justify-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() => handleSaveThreshold(item._id)}
                                  disabled={actionLoading}
                                  className="px-2 py-1 text-[11px] font-medium bg-[#1A56DB] text-white rounded-[4px] cursor-pointer"
                                >
                                  Save
                                </button>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingId(null);
                                    setEditingValue("");
                                  }}
                                  className="px-2 py-1 text-[11px] font-medium border border-[#DADCE0] rounded-[4px] cursor-pointer"
                                >
                                  Cancel
                                </button>
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingId(item._id);
                                  setEditingValue(item.lowStockThreshold.toString());
                                }}
                                className="px-2 py-1 hover:bg-[#F8F9FA] text-[#1A56DB] border border-[#1A56DB]/20 inline-flex items-center gap-1 cursor-pointer rounded-[4px] text-[11px] font-medium"
                              >
                                <Sliders className="h-3 w-3" />
                                <span>Adjust Alert</span>
                              </button>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              type="button"
                              onClick={() => handleDeleteInventoryItem(item._id)}
                              className="text-alert hover:underline font-bold text-xs"
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Pending Approvals Queue */}
        <div className="lg:col-span-4 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#1A56DB] tracking-tight">
              Approval Queue
            </h3>
            <p className="body-small text-[#5F6368]">
              Workers register new inventory categories or products here. Review details before approving them to enter general ledger active tracking.
            </p>

            {pendingInventory.length === 0 ? (
              <p className="body-small text-[#5F6368] italic">No pending items in queue.</p>
            ) : (
              <div className="space-y-4">
                {pendingInventory.map((item) => (
                  <div key={item._id} className="p-4 bg-[#F8F9FA] border border-[#DADCE0] rounded-none space-y-3">
                    <div>
                      <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 block mb-1">
                        {item.category}
                      </span>
                      <h4 className="text-xs font-bold text-[#1A56DB]">{item.productName}</h4>
                      <p className="body-small text-[#5F6368] mt-1 font-medium">
                        Unit: {item.unit} &middot; Default Alert: {item.lowStockThreshold}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(item._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1 btn-primary h-8 px-2"
                      >
                        <Check className="h-3 w-3" />
                        <span>Approve</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(item._id)}
                        disabled={actionLoading}
                        className="flex-1 flex items-center justify-center gap-1 btn-secondary h-8 px-2 border-[#DADCE0] text-alert hover:bg-alert/5"
                      >
                        <X className="h-3 w-3" />
                        <span>Reject</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal (Flat visual design) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#202124]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#1A56DB] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DADCE0] pb-3">
              <h2 className="text-xl font-normal text-[#1A56DB]">Register new stock item</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#5F6368] hover:text-[#1A56DB] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterStockItem} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="product-name" className="label text-[#5F6368]">Product Name</label>
                <input
                  type="text"
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Lucerne Pellets, Bovine Vaccine"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="item-cat" className="label text-[#5F6368]">Category Group</label>
                  <select
                    id="item-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="Feed">Feed</option>
                    <option value="Medicine">Medicine</option>
                    <option value="Supplies">Supplies</option>
                    <option value="Produce">Produce</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="item-unit" className="label text-[#5F6368]">Measurement Unit</label>
                  <select
                    id="item-unit"
                    value={unit}
                    onChange={(e) => setUnit(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="bags">bags</option>
                    <option value="tonnes">tonnes</option>
                    <option value="kg">kg</option>
                    <option value="litres">litres</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="initial-qty" className="label text-[#5F6368]">Initial Stock Qty</label>
                  <input
                    type="number"
                    id="initial-qty"
                    step="0.1"
                    value={initialQuantity}
                    onChange={(e) => setInitialQuantity(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 100"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="stock-threshold" className="label text-[#5F6368]">Low Stock Alert Threshold</label>
                  <input
                    type="number"
                    id="stock-threshold"
                    step="0.1"
                    value={lowStockThreshold}
                    onChange={(e) => setLowStockThreshold(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 10"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#DADCE0]">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn-primary"
                >
                  {submitting ? "Registering..." : "Register stock item"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
