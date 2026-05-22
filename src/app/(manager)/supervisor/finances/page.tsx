"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { getFarmClock } from "@/lib/farmClock";

export default function SupervisorFinancesPage() {
  const { now, yesterdayDateStr } = getFarmClock();
  const user = useQuery(api.users.viewer);
  const cows = useQuery(api.cows.getHerdDashboard, { now, yesterdayDateStr });
  const contracts = useQuery(api.records.listContracts);
  const deliveries = useQuery(api.records.listAllDeliveries);
  const transactions = useQuery(api.records.listTransactions);
  const addTransaction = useMutation(api.records.addTransaction);

  // Form states
  const [type, setType] = useState<"income" | "expense">("income");
  const [category, setCategory] = useState<any>("milk_sales");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [reference, setReference] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (
    contracts === undefined ||
    cows === undefined ||
    deliveries === undefined ||
    transactions === undefined ||
    user === undefined
  ) {
    return (
      <div className="font-mono text-xs text-[#5F6368] uppercase tracking-widest p-8">
        Loading financial registers...
      </div>
    );
  }

  // --- Calculations for Section 1: Daily Revenue Estimate ---
  const yesterdayMilkYield = cows.reduce((sum, c) => sum + (c.yesterdayYield ?? 0), 0);
  const milkRate = 55.0;
  const yesterdayRevenueEst = yesterdayMilkYield * milkRate;

  // --- Calculations for Section 2: Cereal sales contracts table ---
  let totalBookValue = 0;
  let totalRevenueCollected = 0;

  const contractRows = contracts.map((c, index) => {
    const contractDeliveries = deliveries.filter((d) => d.contractId === c._id);
    const bagsDelivered = contractDeliveries.reduce((sum, d) => sum + d.bags, 0);
    const totalValue = c.contractedBags * c.pricePerBag;
    const revenueCollected = bagsDelivered * c.pricePerBag;

    totalBookValue += totalValue;
    totalRevenueCollected += revenueCollected;

    const contractNum = `EL-CTR-2026-${(index + 1).toString().padStart(3, "0")}`;

    return {
      id: c._id,
      number: contractNum,
      buyer: c.buyer,
      crop: c.crop,
      contractedBags: c.contractedBags,
      pricePerBag: c.pricePerBag,
      totalValue,
      status: c.status,
      bagsDelivered,
      revenueCollected,
    };
  });

  // --- Calculations for Section 3: Ledger Summary ---
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpenses = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashFlow = totalIncome - totalExpenses;

  const handleLogTransaction = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setFormError("Please enter a valid amount greater than zero.");
      setSubmitting(false);
      return;
    }

    try {
      await addTransaction({
        date: Date.now(),
        type,
        category,
        amount: parsedAmount,
        description,
        reference,
        loggedBy: user?._id as any,
      });

      setFormSuccess("TRANSACTION LOGGED SUCCESSFULLY");
      setAmount("");
      setDescription("");
      setReference("");
    } catch (err: any) {
      console.error(err);
      setFormError(err.message || "Failed to log transaction.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 font-sans text-[#202124] pb-12">
      {/* Page Title & Header */}
      <header className="border-b border-[#DADCE0] pb-6">
        <span className="text-[10px] font-black uppercase text-[#5F6368] tracking-[0.2em] block mb-2">
          Executive Ledger &gt; Finance
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#202124]">
          Financial Registry & Ledger
        </h1>
        <p className="text-xs text-[#5F6368] font-semibold mt-1 uppercase tracking-wider">
          Cash flow statements, cereal contracts, and ledger auditing
        </p>
      </header>

      {/* Grid: Financial Summary Indicators */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card space-y-1">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Yesterday's Milk Revenue (Est.)
          </span>
          <div className="text-2xl font-black text-primary font-mono">
            KES {yesterdayRevenueEst.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#5F6368] font-semibold">
            Based on {yesterdayMilkYield.toFixed(1)}L produced @ KES 55.00/litre.
          </p>
        </div>

        <div className="card space-y-1">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Total Ledger Income
          </span>
          <div className="text-2xl font-black text-[#1E8E3E] font-mono">
            KES {totalIncome.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#5F6368] font-semibold">
            Audited cash inflows from sales.
          </p>
        </div>

        <div className="card space-y-1">
          <span className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider block">
            Net Ledger Cash Flow
          </span>
          <div className={`text-2xl font-black font-mono ${netCashFlow >= 0 ? "text-[#1E8E3E]" : "text-[#D93025]"}`}>
            KES {netCashFlow.toLocaleString("en-KE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-[#5F6368] font-semibold">
            Outflow: KES {totalExpenses.toLocaleString()}
          </p>
        </div>
      </div>

      {/* Grid: Interactive Form & General Ledger list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Ledger List */}
        <div className="lg:col-span-2 card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
            General Transaction Ledger
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                  <th className="pb-2">Date</th>
                  <th className="pb-2">Type</th>
                  <th className="pb-2">Category</th>
                  <th className="pb-2">Description</th>
                  <th className="pb-2">Ref No.</th>
                  <th className="pb-2 text-right">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-4 text-center text-muted italic">
                      No ledger transactions logged. Use the form to add one.
                    </td>
                  </tr>
                ) : (
                  transactions.map((t) => (
                    <tr key={t._id} className="hover:bg-[#F8F9FA]/30">
                      <td className="py-3 font-mono text-[#5F6368]">
                        {new Date(t.date).toLocaleDateString("en-GB", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </td>
                      <td className="py-3">
                        <span
                          className={`badge ${
                            t.type === "income" ? "border-[#1E8E3E] text-[#1E8E3E]" : "border-[#D93025] text-[#D93025]"
                          }`}
                        >
                          {t.type.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3 capitalize text-[#5F6368]">
                        {t.category.replace("_", " ")}
                      </td>
                      <td className="py-3 text-[#202124] max-w-[180px] truncate" title={t.description}>
                        {t.description}
                      </td>
                      <td className="py-3 font-mono text-[#5F6368]">{t.reference || "—"}</td>
                      <td
                        className={`py-3 text-right font-mono font-bold ${
                          t.type === "income" ? "text-[#1E8E3E]" : "text-[#202124]"
                        }`}
                      >
                        {t.type === "expense" ? "-" : ""}KES {t.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Form to Log Transaction */}
        <div className="card space-y-4">
          <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
            Log Cash Transaction
          </h3>

          {formError && (
            <div className="border border-[#FFBDAD] text-[#D93025] text-xs p-3 rounded-[4px]">
              [Error] {formError}
            </div>
          )}

          {formSuccess && (
            <div className="border border-[#ABF5D1] text-[#1E8E3E] text-[10px] uppercase tracking-wider font-semibold p-3 rounded-[4px]">
              {formSuccess}
            </div>
          )}

          <form onSubmit={handleLogTransaction} className="space-y-4">
            <div className="space-y-1">
              <label className="label text-muted">Transaction Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setType("income");
                    setCategory("milk_sales");
                  }}
                  className={`btn text-xs font-bold py-2 ${
                    type === "income"
                      ? "btn-primary bg-[#1E8E3E] hover:bg-[#005135]"
                      : "btn-secondary"
                  }`}
                >
                  Income
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setType("expense");
                    setCategory("feed_purchase");
                  }}
                  className={`btn text-xs font-bold py-2 ${
                    type === "expense"
                      ? "btn-primary bg-[#D93025] hover:bg-[#A32000]"
                      : "btn-secondary"
                  }`}
                >
                  Expense
                </button>
              </div>
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-category" className="label text-muted">
                Category
              </label>
              <select
                id="tx-category"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="input-field cursor-pointer bg-white"
              >
                {type === "income" ? (
                  <>
                    <option value="milk_sales">Milk Dispatch Sales</option>
                    <option value="crop_sales">Cereal / Crop Sales</option>
                    <option value="animal_sales">Livestock Auction Sales</option>
                    <option value="other">Other Receipts</option>
                  </>
                ) : (
                  <>
                    <option value="wages">Staff & Labour Wages</option>
                    <option value="vet_medical">Veterinary & Medical Treatment</option>
                    <option value="feed_purchase">Fodder & Feed Inventory</option>
                    <option value="machinery_fuel">Machinery Fuel (Diesel)</option>
                    <option value="maintenance">Equipment & Spare Parts</option>
                    <option value="supplies">General Farm Supplies</option>
                    <option value="other">Other Disbursements</option>
                  </>
                )}
              </select>
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-amount" className="label text-muted">
                Amount (KES)
              </label>
              <input
                type="number"
                id="tx-amount"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                required
                placeholder="e.g. 15000"
                className="input-field"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-desc" className="label text-muted">
                Description
              </label>
              <input
                type="text"
                id="tx-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                placeholder="e.g. Bulk milk payout May 20"
                className="input-field"
              />
            </div>

            <div className="space-y-1">
              <label htmlFor="tx-ref" className="label text-muted">
                Reference / Receipt
              </label>
              <input
                type="text"
                id="tx-ref"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                placeholder="e.g. MPESA Ref / Inv No."
                className="input-field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50"
            >
              {submitting ? "Logging transaction..." : "Record Transaction"}
            </button>
          </form>
        </div>
      </div>

      {/* Section 2: Cereal sales contracts table */}
      <section className="bg-white border border-[#DADCE0] p-6 rounded-[24px] space-y-4">
        <h3 className="text-sm font-black uppercase tracking-wider text-[#202124] border-b border-[#DADCE0] pb-3">
          Cereal Sales Contracts
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="text-[10px] font-black text-[#5F6368] uppercase tracking-wider border-b border-[#DADCE0]">
                <th className="pb-2">Contract No.</th>
                <th className="pb-2">Buyer</th>
                <th className="pb-2">Crop</th>
                <th className="pb-2 text-right">Contracted Volume</th>
                <th className="pb-2 text-right">Unit Price</th>
                <th className="pb-2 text-right">Total Value</th>
                <th className="pb-2">Status</th>
                <th className="pb-2 text-right">Delivered</th>
                <th className="pb-2 text-right">Revenue Collected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DADCE0] font-semibold text-[#202124]">
              {contractRows.map((row) => (
                <tr key={row.id} className="hover:bg-[#F8F9FA]/30">
                  <td className="py-3.5 font-mono text-primary">{row.number}</td>
                  <td className="py-3.5">{row.buyer}</td>
                  <td className="py-3.5 uppercase text-[10px]">{row.crop}</td>
                  <td className="py-3.5 text-right font-mono">{row.contractedBags.toLocaleString()} Bags</td>
                  <td className="py-3.5 text-right font-mono">KES {row.pricePerBag.toLocaleString()}</td>
                  <td className="py-3.5 text-right font-mono">KES {row.totalValue.toLocaleString()}</td>
                  <td className="py-3.5">
                    <span className={`status-badge ${
                      row.status === "active" ? "status-ok" :
                      row.status === "fulfilled" ? "bg-[#E3FCEF] text-[#1E8E3E]" :
                      "bg-[#FFEBE6] text-[#D93025]"
                    }`}>
                      {row.status}
                    </span>
                  </td>
                  <td className="py-3.5 text-right font-mono">{row.bagsDelivered.toLocaleString()} Bags</td>
                  <td className="py-3.5 text-right font-mono text-[#1E8E3E]">
                    KES {row.revenueCollected.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-4 border-t border-[#DADCE0] flex flex-col sm:flex-row justify-between text-xs font-bold text-[#5F6368] gap-2">
          <span>
            Total contract book value: <span className="text-[#202124] font-mono">KES {totalBookValue.toLocaleString()}</span>
          </span>
          <span>
            Revenue collected to date: <span className="text-[#1E8E3E] font-mono">KES {totalRevenueCollected.toLocaleString()}</span>
          </span>
        </div>
      </section>
    </div>
  );
}
