"use client";

import React, { useState } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Download, Printer, FileText, BarChart2, Package, Tractor, Leaf, ChevronDown } from "lucide-react";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";

// Declare autoTable augmentation for jsPDF
declare module "jspdf" {
  interface jsPDF {
    lastAutoTable: { finalY: number };
  }
}

type ReportType = "farm_summary" | "inventory_usage" | "financial" | "livestock" | "crops" | "machinery";

const REPORT_OPTIONS: { value: ReportType; label: string; icon: React.ElementType; desc: string }[] = [
  { value: "farm_summary",    label: "Farm Asset Summary",      icon: BarChart2,  desc: "Total counts of all livestock, crops, inventory and equipment on the farm" },
  { value: "inventory_usage", label: "Inventory Usage Log",     icon: Package,    desc: "All withdrawals and restocks with date, item, quantity and person who acted" },
  { value: "livestock",       label: "Livestock Registry",      icon: Leaf,       desc: "Complete livestock register broken down by category and status" },
  { value: "crops",           label: "Crop Field Registry",     icon: Leaf,       desc: "All crop blocks with acreage, crop type, category and current status" },
  { value: "machinery",       label: "Machinery Fleet Report",  icon: Tractor,    desc: "All registered machines with type, status and next service date" },
  { value: "financial",       label: "Financial Ledger",        icon: FileText,   desc: "Income, expenses and net balance with full transaction audit log" },
];

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString("en-GB");
}
function formatDateTime(ts: number) {
  return new Date(ts).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" });
}

// ─── PDF Header ────────────────────────────────────────────────────────────────
function addPdfHeader(doc: any, title: string, subtitle: string) {
  // Navy bar
  doc.setFillColor(15, 27, 45);
  doc.rect(0, 0, 210, 32, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("ELFAM COMPANY LIMITED", 14, 13);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(0, 134, 155); // Teal
  doc.text("Moiben, Uasin Gishu County, Kenya", 14, 20);

  doc.setTextColor(192, 158, 90); // Gold
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text(title.toUpperCase(), 14, 27);

  // Date top-right
  doc.setTextColor(200, 200, 200);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.text(`Generated: ${new Date().toLocaleString("en-GB")}`, 196, 13, { align: "right" });

  // Subtitle line
  doc.setTextColor(94, 108, 132);
  doc.setFontSize(9);
  doc.setFont("helvetica", "italic");
  doc.text(subtitle, 14, 40);

  return 48; // next Y
}

// ─── PDF Footer (on every page) ────────────────────────────────────────────────
function addPdfFooter(doc: any) {
  const count = doc.internal.getNumberOfPages();
  for (let i = 1; i <= count; i++) {
    doc.setPage(i);
    const h = doc.internal.pageSize.height;
    doc.setFontSize(7);
    doc.setTextColor(150);
    doc.line(14, h - 18, 196, h - 18);
    doc.text("ELFAM COMPANY LIMITED — Confidential Farm Management Record", 14, h - 13);
    doc.text(`Page ${i} of ${count}`, 196, h - 13, { align: "right" });
    // Signature block on first page only
    if (i === 1) {
      doc.setFontSize(8);
      doc.setTextColor(94, 108, 132);
      doc.text("Prepared by:", 14, h - 7);
      doc.text("Role: Operations Manager", 60, h - 7);
      doc.text(`Date: ${new Date().toLocaleDateString("en-GB")}`, 140, h - 7);
    }
  }
}

// ─── PDF generators ────────────────────────────────────────────────────────────

function generateFarmSummaryPDF(data: any) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Farm Asset Summary Report", "Consolidated count of all assets registered across all departments");

  const { livestock, cropBlocks, inventory, machinery } = data;

  // Livestock by category
  const lwCats = livestock.reduce((acc: Record<string, number>, a: any) => {
    acc[a.category] = (acc[a.category] || 0) + 1;
    return acc;
  }, {});
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 27, 45);
  doc.text("1. Livestock Summary", 14, y + 2);
  autoTable(doc, {
    startY: y + 6,
    head: [["Category", "Total Head"]],
    body: Object.entries(lwCats).map(([cat, cnt]) => [cat, `${cnt} Head`]),
    theme: "striped",
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Crops
  const totalAcres = cropBlocks.reduce((s: number, b: any) => s + b.acres, 0);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("2. Crop Blocks Summary", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Block Name", "Category", "Crop", "Acres", "Status"]],
    body: cropBlocks.map((b: any) => [b.name, b.category, b.crop.toUpperCase(), `${b.acres} acres`, b.status]),
    foot: [["", "", "TOTAL ACREAGE", `${totalAcres} acres`, ""]],
    theme: "striped",
    headStyles: { fillColor: [0, 134, 155], textColor: 255, fontSize: 9, fontStyle: "bold" },
    footStyles: { fillColor: [240, 242, 245], textColor: [15, 27, 45], fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Inventory
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("3. Inventory Stock Levels", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Product", "Category", "Qty", "Unit", "Status"]],
    body: inventory.map((i: any) => [
      i.productName, i.category,
      i.quantity.toFixed(1), i.unit,
      i.quantity <= i.lowStockThreshold ? "LOW STOCK" : "OK",
    ]),
    theme: "striped",
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 10;

  // Machinery
  if (y > 230) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("4. Machinery Fleet", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Machine", "Type", "Status", "Fuel", "Next Service"]],
    body: machinery.map((m: any) => [m.name, m.type.replace("_", " "), m.status, m.fuelType, formatDate(m.nextServiceDate)]),
    theme: "striped",
    headStyles: { fillColor: [0, 134, 155], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  addPdfFooter(doc);
  doc.save(`Elfam_Farm_Summary_${new Date().toISOString().split("T")[0]}.pdf`);
}

function generateInventoryUsagePDF(movements: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Inventory Usage Log", "All stock movements — withdrawals and restocks — with date, quantity, item and person responsible");

  const withdrawals = movements.filter((m) => m.type === "withdrawal");
  const restocks = movements.filter((m) => m.type === "restock");

  // Summary
  doc.setFontSize(9);
  doc.setTextColor(94, 108, 132);
  doc.text(`Total movements: ${movements.length}    Withdrawals: ${withdrawals.length}    Restocks: ${restocks.length}`, 14, y);
  y += 8;

  // Withdrawals table
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(15, 27, 45);
  doc.text("Withdrawals", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Date & Time", "Product", "Category", "Qty Withdrawn", "Person (Name)", "Role", "Notes"]],
    body: withdrawals.length === 0
      ? [["No withdrawals recorded", "", "", "", "", "", ""]]
      : withdrawals.map((m) => [
          formatDateTime(m.timestamp),
          m.productName,
          m.category,
          `${m.quantity} ${m.unit}`,
          m.userName,
          m.userRole,
          m.notes || "—",
        ]),
    theme: "grid",
    headStyles: { fillColor: [185, 28, 28], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });
  y = (doc as any).lastAutoTable.finalY + 12;

  // Restocks table
  if (y > 160) { doc.addPage(); y = 20; }
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Restocks", 14, y);
  autoTable(doc, {
    startY: y + 4,
    head: [["Date & Time", "Product", "Category", "Qty Added", "Person (Name)", "Role", "Notes"]],
    body: restocks.length === 0
      ? [["No restocks recorded", "", "", "", "", "", ""]]
      : restocks.map((m) => [
          formatDateTime(m.timestamp),
          m.productName,
          m.category,
          `${m.quantity} ${m.unit}`,
          m.userName,
          m.userRole,
          m.notes || "—",
        ]),
    theme: "grid",
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    margin: { left: 14, right: 14 },
  });

  addPdfFooter(doc);
  doc.save(`Elfam_Inventory_Usage_${new Date().toISOString().split("T")[0]}.pdf`);
}

function generateLivestockPDF(livestock: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Livestock Registry Report", "Complete livestock register by category with status and identification");

  const categories = livestock.map((a) => a.category).filter((val, idx, self) => self.indexOf(val) === idx);
  for (const cat of categories) {
    const group = livestock.filter((a) => a.category === cat);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(15, 27, 45);
    doc.text(`${cat} — ${group.length} head`, 14, y);
    autoTable(doc, {
      startY: y + 4,
      head: [["Tag No.", "Name", "Breed", "Date of Birth", "Status", "Notes"]],
      body: group.map((a) => [a.tagNumber, a.name, a.breed, formatDate(a.dateOfBirth), a.status.toUpperCase(), a.notes || "—"]),
      theme: "striped",
      headStyles: { fillColor: [0, 134, 155], textColor: 255, fontSize: 8, fontStyle: "bold" },
      bodyStyles: { fontSize: 8 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 12;
    if (y > 170) { doc.addPage(); y = 20; }
  }

  addPdfFooter(doc);
  doc.save(`Elfam_Livestock_Registry_${new Date().toISOString().split("T")[0]}.pdf`);
}

function generateCropsPDF(cropBlocks: any[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Crop Field Registry Report", "All registered crop blocks with acreage, crop type and current status");

  const totalAcres = cropBlocks.reduce((s, b) => s + b.acres, 0);
  autoTable(doc, {
    startY: y,
    head: [["Block Name", "Category", "Crop", "Acres", "Status", "Planted Date", "Notes"]],
    body: cropBlocks.map((b) => [
      b.name, b.category, b.crop.toUpperCase(),
      `${b.acres} acres`, b.status,
      b.plantedDate ? formatDate(b.plantedDate) : "—",
      b.notes || "—",
    ]),
    foot: [["", "", "TOTAL", `${totalAcres} acres`, "", "", ""]],
    theme: "striped",
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontSize: 9, fontStyle: "bold" },
    footStyles: { fillColor: [240, 242, 245], fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  addPdfFooter(doc);
  doc.save(`Elfam_Crops_Registry_${new Date().toISOString().split("T")[0]}.pdf`);
}

function generateMachineryPDF(machinery: any[]) {
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Machinery Fleet Report", "All registered machines with operational status and upcoming service dates");

  autoTable(doc, {
    startY: y,
    head: [["Machine Name", "Type", "Plate No.", "Fuel", "Status", "Next Service", "Notes"]],
    body: machinery.map((m) => [
      m.name, m.type.replace("_", " "), m.plateNumber || "—",
      m.fuelType, m.status.toUpperCase(),
      formatDate(m.nextServiceDate), m.notes || "—",
    ]),
    theme: "striped",
    headStyles: { fillColor: [0, 134, 155], textColor: 255, fontSize: 9, fontStyle: "bold" },
    bodyStyles: { fontSize: 9 },
    margin: { left: 14, right: 14 },
  });

  addPdfFooter(doc);
  doc.save(`Elfam_Machinery_Fleet_${new Date().toISOString().split("T")[0]}.pdf`);
}

function generateFinancialPDF(transactions: any[]) {
  const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
  let y = addPdfHeader(doc, "Financial Transaction Ledger", "All recorded income and expense transactions from the farm ledger");

  const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);

  // Summary
  doc.setFontSize(9);
  doc.setTextColor(94, 108, 132);
  doc.text(`Gross Revenue: KES ${income.toLocaleString()}   |   Gross Expenses: KES ${expense.toLocaleString()}   |   Net Balance: KES ${(income - expense).toLocaleString()}`, 14, y);
  y += 8;

  autoTable(doc, {
    startY: y,
    head: [["Date", "Type", "Category", "Description", "Reference", "Amount (KES)"]],
    body: transactions.map((t) => [
      formatDate(t.date),
      t.type.toUpperCase(),
      t.category.replace(/_/g, " "),
      t.description,
      t.reference || "—",
      t.amount.toLocaleString(),
    ]),
    theme: "grid",
    headStyles: { fillColor: [15, 27, 45], textColor: 255, fontSize: 8, fontStyle: "bold" },
    bodyStyles: { fontSize: 8 },
    columnStyles: { 5: { halign: "right" } },
    margin: { left: 14, right: 14 },
  });

  addPdfFooter(doc);
  doc.save(`Elfam_Financial_Ledger_${new Date().toISOString().split("T")[0]}.pdf`);
}

// ─── Main component ─────────────────────────────────────────────────────────────

export default function ManagerReportsPage() {
  const [selectedReport, setSelectedReport] = useState<ReportType>("farm_summary");
  const [generating, setGenerating] = useState(false);

  const livestock = useQuery(api.records.listLivestock, {});
  const cropBlocks = useQuery(api.records.listCropBlocks, {});
  const inventory = useQuery(api.records.listInventory, { status: "active" });
  const machinery = useQuery(api.records.listMachinery, {});
  const transactions = useQuery(api.records.listTransactions, {});
  const movements = useQuery(api.records.listInventoryMovementsNew, {});

  const loading = livestock === undefined || cropBlocks === undefined || inventory === undefined
    || machinery === undefined || transactions === undefined || movements === undefined;

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-sm text-[#6B7280]">
        Loading report data...
      </div>
    );
  }

  // Derived stats for preview
  const lwCats = livestock!.reduce((acc: Record<string, number>, a) => {
    acc[a.category] = (acc[a.category] || 0) + 1; return acc;
  }, {});
  const totalIncome = transactions!.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions!.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0);
  const totalAcres = cropBlocks!.reduce((s, b) => s + b.acres, 0);
  const withdrawals = movements!.filter((m) => m.type === "withdrawal");
  const restocks = movements!.filter((m) => m.type === "restock");

  const handleDownload = async () => {
    setGenerating(true);
    try {
      if (selectedReport === "farm_summary") {
        generateFarmSummaryPDF({ livestock: livestock!, cropBlocks: cropBlocks!, inventory: inventory!, machinery: machinery! });
      } else if (selectedReport === "inventory_usage") {
        generateInventoryUsagePDF(movements!);
      } else if (selectedReport === "livestock") {
        generateLivestockPDF(livestock!);
      } else if (selectedReport === "crops") {
        generateCropsPDF(cropBlocks!);
      } else if (selectedReport === "machinery") {
        generateMachineryPDF(machinery!);
      } else if (selectedReport === "financial") {
        generateFinancialPDF(transactions!);
      }
    } finally {
      setTimeout(() => setGenerating(false), 800);
    }
  };

  const currentOpt = REPORT_OPTIONS.find((r) => r.value === selectedReport)!;

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <header>
        <p className="label text-[#00869B] mb-1">Executive Ledger</p>
        <h1 className="text-2xl font-bold text-[#0F1B2D]" style={{ fontFamily: "Georgia, serif" }}>
          Reports Console
        </h1>
        <p className="body-small text-[#6B7280] mt-1">
          Select a report type, preview the data, then download as PDF
        </p>
      </header>

      {/* Report selector grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {REPORT_OPTIONS.map((opt) => {
          const Icon = opt.icon;
          const active = selectedReport === opt.value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setSelectedReport(opt.value)}
              className={`
                system-card p-4 text-left transition-all duration-150 border-2 cursor-pointer
                ${active ? "border-[#00869B] bg-[#EBF7F9]" : "border-[#E4E7EC] hover:border-[#C8CDD8]"}
              `}
            >
              <Icon className={`h-5 w-5 mb-2 ${active ? "text-[#00869B]" : "text-[#9CA3AF]"}`} />
              <p className={`text-[12px] font-bold uppercase tracking-wide ${active ? "text-[#00869B]" : "text-[#374151]"}`}>
                {opt.label}
              </p>
              <p className="text-[11px] text-[#6B7280] mt-1 leading-snug">{opt.desc}</p>
            </button>
          );
        })}
      </div>

      {/* Download bar */}
      <div className="system-card px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-[#111827]">{currentOpt.label}</p>
          <p className="text-xs text-[#6B7280]">{currentOpt.desc}</p>
        </div>
        <div className="flex gap-3">
          <button type="button" onClick={() => window.print()} className="btn-secondary">
            <Printer className="h-4 w-4" />
            Print
          </button>
          <button type="button" onClick={handleDownload} disabled={generating} className="btn-primary">
            <Download className="h-4 w-4" />
            {generating ? "Generating..." : "Download PDF"}
          </button>
        </div>
      </div>

      {/* ─── Previews ─── */}

      {/* Farm Summary */}
      {selectedReport === "farm_summary" && (
        <div className="space-y-4">
          {/* Stat cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { label: "Total Livestock", value: livestock!.length, unit: "head" },
              { label: "Crop Blocks",     value: cropBlocks!.length, unit: `blocks / ${totalAcres} acres` },
              { label: "Inventory Items", value: inventory!.length, unit: "products" },
              { label: "Machinery",       value: machinery!.length, unit: "machines" },
            ].map((s) => (
              <div key={s.label} className="system-card p-5 text-center">
                <p className="text-xs-label mb-1">{s.label}</p>
                <p className="text-3xl font-bold text-[#0F1B2D]" style={{ fontFamily: "Georgia, serif" }}>{s.value}</p>
                <p className="text-xs text-[#6B7280] mt-1">{s.unit}</p>
              </div>
            ))}
          </div>
          {/* Livestock by category */}
          <div className="system-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
              <h3 className="text-xs-label">Livestock by Category</h3>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  <th className="px-5 py-2.5 text-left text-xs-label">Category</th>
                  <th className="px-5 py-2.5 text-right text-xs-label">Head Count</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {Object.entries(lwCats).map(([cat, cnt]) => (
                  <tr key={cat} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-semibold text-[#111827]">{cat}</td>
                    <td className="px-5 py-3 text-right font-bold font-mono text-[#0F1B2D]">{cnt as number} Head</td>
                  </tr>
                ))}
                {Object.keys(lwCats).length === 0 && (
                  <tr><td colSpan={2} className="px-5 py-6 text-center text-[#6B7280] text-xs">No livestock registered</td></tr>
                )}
              </tbody>
            </table>
          </div>
          {/* Inventory low stock */}
          <div className="system-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
              <h3 className="text-xs-label">Inventory Stock Levels</h3>
            </div>
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  {["Product", "Category", "Qty", "Alert Level", "Status"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {inventory!.map((i) => {
                  const low = i.quantity <= i.lowStockThreshold;
                  return (
                    <tr key={i._id} className="hover:bg-[#F9FAFB]">
                      <td className="px-5 py-3 font-semibold text-[#111827]">{i.productName}</td>
                      <td className="px-5 py-3 text-[#6B7280]">{i.category}</td>
                      <td className="px-5 py-3 font-mono font-bold text-[#0F1B2D]">{i.quantity.toFixed(1)} {i.unit}</td>
                      <td className="px-5 py-3 font-mono text-[#6B7280]">{i.lowStockThreshold.toFixed(1)} {i.unit}</td>
                      <td className="px-5 py-3">
                        <span className={`status-badge ${low ? "status-low" : "status-ok"}`}>{low ? "LOW" : "OK"}</span>
                      </td>
                    </tr>
                  );
                })}
                {inventory!.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-6 text-center text-[#6B7280] text-xs">No inventory items</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inventory Usage */}
      {selectedReport === "inventory_usage" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Movements", value: movements!.length },
              { label: "Withdrawals", value: withdrawals.length },
              { label: "Restocks", value: restocks.length },
            ].map((s) => (
              <div key={s.label} className="system-card p-5 text-center">
                <p className="text-xs-label mb-1">{s.label}</p>
                <p className="text-2xl font-bold text-[#0F1B2D]" style={{ fontFamily: "Georgia, serif" }}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="system-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
              <h3 className="text-xs-label">All Movements — Date, Item, Person</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                    {["Date & Time", "Type", "Product", "Category", "Quantity", "Person", "Role", "Notes"].map((h) => (
                      <th key={h} className="px-4 py-2.5 text-left text-xs-label whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {movements!.map((m) => (
                    <tr key={m._id} className="hover:bg-[#F9FAFB]">
                      <td className="px-4 py-3 font-mono text-xs text-[#6B7280] whitespace-nowrap">{formatDateTime(m.timestamp)}</td>
                      <td className="px-4 py-3">
                        <span className={`status-badge ${m.type === "withdrawal" ? "status-out" : "status-ok"}`}>{m.type}</span>
                      </td>
                      <td className="px-4 py-3 font-semibold text-[#111827]">{m.productName}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{m.category}</td>
                      <td className="px-4 py-3 font-mono font-bold text-[#0F1B2D]">{m.quantity} {m.unit}</td>
                      <td className="px-4 py-3 font-semibold text-[#374151]">{m.userName}</td>
                      <td className="px-4 py-3 text-[#6B7280] capitalize">{m.userRole}</td>
                      <td className="px-4 py-3 text-[#6B7280]">{m.notes || "—"}</td>
                    </tr>
                  ))}
                  {movements!.length === 0 && (
                    <tr><td colSpan={8} className="px-5 py-8 text-center text-[#6B7280] text-xs">No movements recorded yet</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Livestock */}
      {selectedReport === "livestock" && (
        <div className="system-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
            <h3 className="text-xs-label">Livestock Registry — {livestock!.length} total</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  {["Tag No.", "Name", "Category", "Breed", "Date of Birth", "Status"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {livestock!.map((a) => (
                  <tr key={a._id} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{a.tagNumber}</td>
                    <td className="px-5 py-3 font-semibold text-[#111827]">{a.name}</td>
                    <td className="px-5 py-3 text-[#374151]">{a.category}</td>
                    <td className="px-5 py-3 text-[#6B7280]">{a.breed}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{formatDate(a.dateOfBirth)}</td>
                    <td className="px-5 py-3"><span className="status-badge status-ok capitalize">{a.status}</span></td>
                  </tr>
                ))}
                {livestock!.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7280] text-xs">No livestock registered</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Crops */}
      {selectedReport === "crops" && (
        <div className="system-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
            <h3 className="text-xs-label">Crop Blocks — {cropBlocks!.length} blocks / {totalAcres} total acres</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  {["Block Name", "Category", "Crop", "Acres", "Status", "Planted Date"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {cropBlocks!.map((b) => (
                  <tr key={b._id} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-semibold text-[#111827]">{b.name}</td>
                    <td className="px-5 py-3 text-[#374151]">{b.category}</td>
                    <td className="px-5 py-3 font-mono text-xs uppercase text-[#00869B] font-bold">{b.crop}</td>
                    <td className="px-5 py-3 font-mono font-bold text-[#0F1B2D]">{b.acres} ac</td>
                    <td className="px-5 py-3"><span className="status-badge status-ok capitalize">{b.status}</span></td>
                    <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{b.plantedDate ? formatDate(b.plantedDate) : "—"}</td>
                  </tr>
                ))}
                {cropBlocks!.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7280] text-xs">No crop blocks registered</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Machinery */}
      {selectedReport === "machinery" && (
        <div className="system-card overflow-hidden">
          <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
            <h3 className="text-xs-label">Machinery Fleet — {machinery!.length} machines</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse">
              <thead>
                <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                  {["Machine", "Type", "Plate No.", "Fuel", "Status", "Next Service"].map((h) => (
                    <th key={h} className="px-5 py-2.5 text-left text-xs-label">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F3F4F6]">
                {machinery!.map((m) => (
                  <tr key={m._id} className="hover:bg-[#F9FAFB]">
                    <td className="px-5 py-3 font-semibold text-[#111827]">{m.name}</td>
                    <td className="px-5 py-3 text-[#374151] capitalize">{m.type.replace("_", " ")}</td>
                    <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{m.plateNumber || "—"}</td>
                    <td className="px-5 py-3 capitalize text-[#374151]">{m.fuelType}</td>
                    <td className="px-5 py-3">
                      <span className={`status-badge ${m.status === "operational" ? "status-ok" : m.status === "maintenance" ? "status-low" : "status-out"}`}>
                        {m.status}
                      </span>
                    </td>
                    <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{formatDate(m.nextServiceDate)}</td>
                  </tr>
                ))}
                {machinery!.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7280] text-xs">No machinery registered</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Financial */}
      {selectedReport === "financial" && (
        <div className="space-y-4">
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Gross Revenue",  value: `KES ${totalIncome.toLocaleString()}`,       color: "text-[#15803d]" },
              { label: "Gross Expenses", value: `KES ${totalExpense.toLocaleString()}`,       color: "text-[#b91c1c]" },
              { label: "Net Balance",    value: `KES ${(totalIncome-totalExpense).toLocaleString()}`, color: "text-[#0F1B2D]" },
            ].map((s) => (
              <div key={s.label} className="system-card p-5 text-center">
                <p className="text-xs-label mb-1">{s.label}</p>
                <p className={`text-xl font-bold font-mono ${s.color}`}>{s.value}</p>
              </div>
            ))}
          </div>
          <div className="system-card overflow-hidden">
            <div className="px-5 py-3 border-b border-[#E4E7EC] bg-[#F9FAFB]">
              <h3 className="text-xs-label">Transaction Audit Log — {transactions!.length} records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-collapse">
                <thead>
                  <tr className="bg-[#F9FAFB] border-b border-[#E4E7EC]">
                    {["Date", "Type", "Category", "Description", "Reference", "Amount"].map((h) => (
                      <th key={h} className="px-5 py-2.5 text-left text-xs-label">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F3F4F6]">
                  {transactions!.map((t) => (
                    <tr key={t._id} className="hover:bg-[#F9FAFB]">
                      <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{formatDate(t.date)}</td>
                      <td className="px-5 py-3">
                        <span className={`status-badge ${t.type === "income" ? "status-ok" : "status-out"}`}>{t.type}</span>
                      </td>
                      <td className="px-5 py-3 text-[#374151] capitalize">{t.category.replace(/_/g, " ")}</td>
                      <td className="px-5 py-3 text-[#111827]">{t.description}</td>
                      <td className="px-5 py-3 font-mono text-xs text-[#6B7280]">{t.reference || "—"}</td>
                      <td className="px-5 py-3 font-mono font-bold text-right text-[#0F1B2D]">KES {t.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                  {transactions!.length === 0 && (
                    <tr><td colSpan={6} className="px-5 py-8 text-center text-[#6B7280] text-xs">No transactions recorded</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
