"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../../convex/_generated/api";
import Link from "next/link";
import { ArrowLeft, Check, ClipboardList, TrendingUp, TrendingDown } from "lucide-react";

export default function ManagerInventoryFlowPage() {
  const user = useQuery(api.users.viewer);
  const feeds = useQuery(api.records.listFeedInventory);
  const vets = useQuery(api.records.listVetInventory);
  const movements = useQuery(api.records.listInventoryMovements);

  const addMovementMutation = useMutation(api.records.addInventoryMovement);

  // Form states
  const [itemType, setItemType] = useState<"feed" | "vet" | "machinery" | "general">("feed");
  const [selectedItemId, setSelectedItemId] = useState("");
  const [productName, setProductName] = useState("");
  const [type, setType] = useState<"restock" | "withdrawal">("restock");
  const [quantity, setQuantity] = useState("");
  const [notes, setNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  // Auto-resolve unit and product name
  let resolvedUnit = "units";
  let resolvedProductName = productName;

  if (itemType === "feed" && feeds) {
    const matched = feeds.find((f: any) => f._id === selectedItemId);
    if (matched) {
      resolvedUnit = matched.unit;
      resolvedProductName = matched.product;
    }
  } else if (itemType === "vet" && vets) {
    const matched = vets.find((v: any) => v._id === selectedItemId);
    if (matched) {
      resolvedUnit = matched.unit;
      resolvedProductName = matched.product;
    }
  } else if (itemType === "machinery") {
    resolvedUnit = "pieces";
  } else if (itemType === "general") {
    resolvedUnit = "units";
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!user) {
      setError("You must be logged in to modify inventory.");
      return;
    }

    if (itemType === "feed" || itemType === "vet") {
      if (!selectedItemId) {
        setError("Please select a valid inventory product.");
        return;
      }
    } else {
      if (!productName.trim()) {
        setError("Please enter the product or part name.");
        return;
      }
    }

    const qtyVal = parseFloat(quantity);
    if (isNaN(qtyVal) || qtyVal <= 0) {
      setError("Please enter a valid positive quantity.");
      return;
    }

    setLoading(true);
    try {
      await addMovementMutation({
        itemId: itemType === "feed" || itemType === "vet" ? selectedItemId : "manual-entry",
        itemType,
        productName: resolvedProductName,
        type,
        quantity: qtyVal,
        unit: resolvedUnit,
        performedBy: user._id,
        notes: notes.trim(),
      });
      setSuccess(true);
      setQuantity("");
      setNotes("");
      setProductName("");
      setSelectedItemId("");
      setTimeout(() => setSuccess(false), 3000);
    } catch (e: any) {
      setError(`[Inventory] Log failed: ${e.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  };

  if (feeds === undefined || vets === undefined || movements === undefined) {
    return (
      <div className="font-mono text-xs text-[#5E6C84] uppercase tracking-widest p-8">
        Loading storage ledger...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12">
      <header className="border-b border-[#DFE1E6] pb-6 flex justify-between items-end">
        <div>
          <Link
            href="/manager/inventory"
            className="text-[10px] font-black uppercase text-[#5E6C84] hover:text-primary tracking-[0.2em] flex items-center gap-1.5 mb-2"
          >
            <ArrowLeft className="h-3 w-3" />
            <span>Storage Register</span>
          </Link>
          <h1 className="font-sans text-2xl font-bold uppercase text-[#091E42]">
            Inventory Stock Movements
          </h1>
          <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">
            Audit trail and logging forms for crop inputs, feed silage, and medications
          </p>
        </div>
      </header>

      {success && (
        <div className="bg-[#E3FCEF] border border-[#ABF5D1] text-[#006644] text-xs font-semibold p-4 rounded-none flex items-center gap-2">
          <Check className="h-4 w-4" />
          <span>Movement logged successfully. Inventory levels updated.</span>
        </div>
      )}

      {error && (
        <div className="bg-[#FFEBE6] border border-[#FFD2C7] text-[#BF2600] text-xs font-semibold p-4 rounded-none">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Form component */}
        <div className="lg:col-span-4 border border-[#DFE1E6] bg-white p-6 space-y-6">
          <h3 className="text-base font-bold uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4 flex items-center gap-2">
            <ClipboardList className="h-4 w-4 text-[#5E6C84]" />
            <span>Log Stock Adjustment</span>
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                Department / Category
              </label>
              <select
                value={itemType}
                onChange={(e) => {
                  setItemType(e.target.value as any);
                  setSelectedItemId("");
                  setProductName("");
                }}
                className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
              >
                <option value="feed">Feed & Silage</option>
                <option value="vet">Veterinary Drugs</option>
                <option value="machinery">Machinery & Spares</option>
                <option value="general">General Farm Supplies</option>
              </select>
            </div>

            {/* Dynamic Product selection */}
            {itemType === "feed" && (
              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Select Feed Product
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Feed --</option>
                  {feeds.map((f: any) => (
                    <option key={f._id} value={f._id}>
                      {f.product} ({f.quantity} {f.unit} on hand)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {itemType === "vet" && (
              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Select Medicine Product
                </label>
                <select
                  value={selectedItemId}
                  onChange={(e) => setSelectedItemId(e.target.value)}
                  required
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                >
                  <option value="">-- Choose Drug --</option>
                  {vets.map((v: any) => (
                    <option key={v._id} value={v._id}>
                      {v.product} ({v.quantity} {v.unit} on hand)
                    </option>
                  ))}
                </select>
              </div>
            )}

            {(itemType === "machinery" || itemType === "general") && (
              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Item / Part Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Massey Ferguson oil filter"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                />
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Action
                </label>
                <select
                  value={type}
                  onChange={(e) => setType(e.target.value as any)}
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                >
                  <option value="restock">Restock (+)</option>
                  <option value="withdrawal">Withdraw (-)</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                  Quantity ({resolvedUnit})
                </label>
                <input
                  type="number"
                  required
                  step="any"
                  placeholder="0.00"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
                Transaction Notes
              </label>
              <textarea
                rows={3}
                required
                placeholder="Specify supplier, user purpose or dosage allocations..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full border border-[#DFE1E6] bg-white p-3 text-xs font-semibold text-[#091E42] focus:outline-none focus:border-primary resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark disabled:bg-[#DFE1E6] text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              {loading ? "Logging..." : "Commit Transaction"}
            </button>
          </form>
        </div>

        {/* Ledger Table */}
        <div className="lg:col-span-8 border border-[#DFE1E6] bg-white p-6 space-y-4">
          <h3 className="text-base font-bold uppercase tracking-tight text-[#091E42] border-b border-[#DFE1E6] pb-4">
            Movement Log Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-[#DFE1E6]">
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Item
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Dept
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Type
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider text-right">
                    Quantity
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Logged By
                  </th>
                  <th className="pb-3 text-[10px] font-black text-[#5E6C84] uppercase tracking-wider">
                    Notes
                  </th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-6 text-center text-xs italic text-[#5E6C84]">
                      No movement transactions logged.
                    </td>
                  </tr>
                ) : (
                  movements.map((move: any) => {
                    const isRestock = move.type === "restock";
                    return (
                      <tr key={move._id} className="border-b border-[#DFE1E6] hover:bg-[#F4F5F7] text-xs font-semibold">
                        <td className="py-3 font-mono text-[11px] text-[#5E6C84]">
                          {new Date(move.timestamp).toLocaleString("en-GB", {
                            day: "2-digit",
                            month: "2-digit",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </td>
                        <td className="py-3 text-[#091E42]">{move.productName}</td>
                        <td className="py-3 uppercase text-[10px] text-[#7A869A]">{move.itemType}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider ${
                              isRestock ? "text-[#0A7C52]" : "text-[#BF2600]"
                            }`}
                          >
                            {isRestock ? (
                              <TrendingUp className="h-3 w-3" />
                            ) : (
                              <TrendingDown className="h-3 w-3" />
                            )}
                            {move.type}
                          </span>
                        </td>
                        <td className="py-3 font-mono font-bold text-right text-[#091E42]">
                          {isRestock ? "+" : "-"}
                          {move.quantity} {move.unit}
                        </td>
                        <td className="py-3 text-[#5E6C84]">{move.userName}</td>
                        <td className="py-3 text-[#7A869A] max-w-[180px] truncate" title={move.notes}>
                          {move.notes}
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
    </div>
  );
}
