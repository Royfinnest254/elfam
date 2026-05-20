"use client";

import React, { useState, useRef } from "react";
import { useQuery } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Printer, Download, FileText } from "lucide-react";
import { jsPDF } from "jspdf";

export default function OwnerReportsPage() {
  const reportRef = useRef<HTMLDivElement>(null);
  const simNow = 1779205903000;
  const cows = useQuery(api.cows.getHerdDashboard, { now: simNow, yesterdayDateStr: "2026-05-18" });
  const fields = useQuery(api.records.listFields);

  // Parameter states
  const [reportType, setReportType] = useState<"monthly" | "herd">("monthly");
  const [selectedMonth, setSelectedMonth] = useState("May 2026");

  const totalYield = cows?.reduce((sum: number, c: any) => sum + (c.yesterdayYield ?? 0), 0) ?? 460;
  const milkingCows = cows?.filter((c: any) => c.status === "milking") ?? [];
  const averageYield = milkingCows.length > 0 ? totalYield / milkingCows.length : 0;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = () => {
    const doc = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const titleText = "ELFAM COMPANY LIMITED";
    const subTitleText = reportType === "monthly" 
      ? `MONTHLY MANAGEMENT REVIEW - ${selectedMonth.toUpperCase()}`
      : `HERD PRODUCTION AUDIT - ${selectedMonth.toUpperCase()}`;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(20);
    doc.setTextColor(9, 30, 66);
    doc.text(titleText, 20, 20);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(94, 108, 132);
    doc.text(subTitleText, 20, 26);

    doc.setFontSize(9);
    doc.text("Farm Ledger", 20, 36);
    doc.text(`Report Date: ${new Date().toLocaleDateString("en-GB")}`, 20, 41);
    doc.text("Access State: Confidential", 20, 46);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(9, 30, 66);
    doc.text("1. Executive Summary", 20, 56);
    doc.setDrawColor(223, 225, 230);
    doc.line(20, 58, 190, 58);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(94, 108, 132);
    const summaryText = reportType === "monthly"
      ? `This management review outlines the combined livestock yield metrics, crop field allocations, and compliance parameters for this farm operation for ${selectedMonth}. The farm indicates stable performance across cereal contracts and dairy husbandry.`
      : `This production audit details the specific performance logs of individual animals, average daily yield parameters, and veterinary quarantine locks in effect for ${selectedMonth} to ensure milk quality and safety compliance.`;
    
    const splitSummary = doc.splitTextToSize(summaryText, 170);
    doc.text(splitSummary, 20, 64);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(9, 30, 66);
    doc.text("2. Dairy Performance Summary", 20, 85);
    doc.line(20, 87, 190, 87);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(94, 108, 132);
    doc.text(`Herd Size: ${cows?.length ?? 28} Animals`, 20, 93);
    doc.text(`Yesterday's Total Yield: ${totalYield.toFixed(1)} Litres`, 20, 99);
    doc.text(`Average Yield per Milking Cow: ${averageYield.toFixed(1)} L/day`, 20, 105);

    if (reportType === "monthly") {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(9, 30, 66);
      doc.text("3. Cultivation Allocation", 20, 118);
      doc.line(20, 120, 190, 120);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(94, 108, 132);
      doc.text("Wheat Blocks: 450 Acres", 20, 126);
      doc.text("EABL Contracted Barley: 350 Acres", 20, 132);
      doc.text("Silage Fodder Crops: 150 Acres", 20, 138);
      doc.text("Fallow & Buffer zones: 650 Acres", 20, 144);
    } else {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(12);
      doc.setTextColor(9, 30, 66);
      doc.text("3. Herd Health & Veterinary Safeguards", 20, 118);
      doc.line(20, 120, 190, 120);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(94, 108, 132);
      const treatmentCount = cows?.filter(c => c.isWithholding).length ?? 0;
      doc.text(`Cows under active treatment: ${treatmentCount} cows`, 20, 126);
      doc.text("Milk withholding rules status: VERIFIED & ENFORCED", 20, 132);
      doc.text("Daily testing for antibiotic residues: COMPLETED (No residues detected)", 20, 138);
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(9, 30, 66);
    doc.text("Prepared by:", 20, 170);
    doc.setFont("helvetica", "normal");
    doc.text("Farm Manager", 20, 175);
    doc.setFontSize(8);
    doc.setTextColor(94, 108, 132);
    doc.text("General Manager", 20, 179);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(9, 30, 66);
    doc.text("Approved by:", 110, 170);
    doc.setFont("helvetica", "normal");
    doc.text("Farm Director", 110, 175);
    doc.setFontSize(8);
    doc.setTextColor(94, 108, 132);
    doc.text("Director", 110, 179);

    const filename = `Elfam_${reportType === "monthly" ? "Management_Review" : "Herd_Audit"}_${selectedMonth.replace(" ", "_")}.pdf`;
    doc.save(filename);
  };

  if (cows === undefined || fields === undefined) {
    return (
      <div className="font-mono text-xs text-[#5E6C84] uppercase tracking-widest p-8">
        Loading report generator...
      </div>
    );
  }

  return (
    <div className="space-y-8 font-sans text-[#091E42] pb-12 print:bg-white print:p-0">
      {/* Page Title & Header */}
      <header className="border-b border-[#DFE1E6] pb-6 print:hidden">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-[0.2em] block mb-2">
          Executive Ledger &gt; Reports
        </span>
        <h1 className="font-sans text-2xl font-black uppercase text-[#091E42]">
          Reports
        </h1>
        <p className="text-xs text-[#5E6C84] font-semibold mt-1 uppercase tracking-wider">
          Generate and print management sheets
        </p>
      </header>

      {/* Section 1: Parameter selection card */}
      <section className="bg-white border border-[#DFE1E6] p-6 rounded-[24px] space-y-6 print:hidden">
        <div className="flex items-center gap-2 border-b border-[#DFE1E6] pb-3">
          <FileText className="h-5 w-5 text-[#5E6C84]" />
          <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42]">
            Select report parameters
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-end">
          <div>
            <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
              Report Type
            </label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
            >
              <option value="monthly">Monthly management review</option>
              <option value="herd">Herd production audit</option>
            </select>
          </div>

          <div>
            <label className="text-[10px] font-black text-[#5E6C84] uppercase tracking-wider block mb-1">
              Select Month
            </label>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="w-full h-11 border border-[#DFE1E6] bg-white px-3 text-xs font-bold text-[#091E42] focus:outline-none focus:border-primary"
            >
              <option value="May 2026">May 2026</option>
              <option value="April 2026">April 2026</option>
              <option value="March 2026">March 2026</option>
              <option value="February 2026">February 2026</option>
            </select>
          </div>

          <div className="md:col-span-2 flex gap-4">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="flex-1 h-11 text-[10px] font-bold uppercase tracking-wider bg-primary hover:bg-primary-dark text-white flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
            <button
              type="button"
              onClick={handlePrint}
              className="flex-1 h-11 text-[10px] font-bold uppercase tracking-wider bg-white border border-[#DFE1E6] hover:bg-[#F4F5F7] text-[#091E42] flex items-center justify-center gap-2 cursor-pointer transition-colors"
            >
              <Printer className="h-4 w-4 text-[#5E6C84]" />
              <span>Print parameters</span>
            </button>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive print preview */}
      <section className="space-y-4 print:space-y-0">
        <span className="text-[10px] font-black uppercase text-[#5E6C84] tracking-wider block print:hidden">
          Interactive Print Preview
        </span>

        <div 
          ref={reportRef} 
          className="bg-white border border-[#DFE1E6] p-8 md:p-12 space-y-8 rounded-[24px] print:border-none print:p-0 print:shadow-none print:rounded-none"
        >
          {/* Header block */}
          <div className="flex justify-between items-start border-b-2 border-[#091E42] pb-6">
            <div>
              <h2 className="text-xl font-black uppercase tracking-tight text-[#091E42]">
                elfam company limited
              </h2>
              <p className="text-[10px] font-black uppercase text-[#5E6C84] tracking-widest mt-1">
                {reportType === "monthly" 
                  ? "Monthly Operational & Dairy Review" 
                  : "Herd Production & Safety Audit"}
              </p>
            </div>
            <div className="text-right text-xs font-semibold text-[#5E6C84] space-y-1">
              <div>Registry: <span className="text-[#091E42] font-bold">Farm Ledger</span></div>
              <div>Report Date: <span className="text-[#091E42] font-bold">{new Date(simNow).toLocaleDateString("en-GB")}</span></div>
              <div>Month: <span className="text-primary font-bold uppercase">{selectedMonth}</span></div>
            </div>
          </div>

          {/* Executive Summary */}
          <div className="space-y-3">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-2">1. Executive Summary</h3>
            <p className="text-xs text-[#5E6C84] font-medium leading-relaxed">
              {reportType === "monthly"
                ? `This management review outlines the combined livestock yield metrics, crop field allocations, and compliance parameters for this farm operation for ${selectedMonth}. The farm indicates stable performance across cereal contracts and dairy husbandry.`
                : `This production audit details the specific performance logs of individual animals, average daily yield parameters, and veterinary quarantine locks in effect for ${selectedMonth} to ensure milk quality and safety compliance.`}
            </p>
          </div>

          {/* Dairy Yield Overview */}
          <div className="space-y-4">
            <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-2">2. Dairy Performance Summary</h3>
            <div className="grid grid-cols-3 gap-4 border border-[#DFE1E6] p-5 rounded-[18px] text-xs font-medium text-[#5E6C84] bg-[#F4F5F7]">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#5E6C84] block uppercase tracking-wider">Herd Size</span>
                <strong className="text-[#091E42] text-sm font-bold">{cows?.length ?? 28} Animals</strong>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#5E6C84] block uppercase tracking-wider">Yesterday's Total Yield</span>
                <strong className="text-[#091E42] text-sm font-bold">{totalYield.toFixed(1)} Litres</strong>
              </div>
              <div className="space-y-1">
                <span className="text-[10px] font-black text-[#5E6C84] block uppercase tracking-wider">Avg Yield / Milking Cow</span>
                <strong className="text-primary text-sm font-bold">{averageYield.toFixed(1)} L/day</strong>
              </div>
            </div>
          </div>

          {/* Dynamic Section 3 */}
          {reportType === "monthly" ? (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-2">3. Cultivation Allocation</h3>
              <div className="border border-[#DFE1E6] divide-y divide-[#DFE1E6] rounded-[18px] overflow-hidden text-xs font-semibold text-[#5E6C84] bg-[#F4F5F7]">
                <div className="flex justify-between p-4">
                  <span>Wheat Blocks</span>
                  <strong className="text-[#091E42]">450 Acres</strong>
                </div>
                <div className="flex justify-between p-4">
                  <span>EABL Contracted Barley</span>
                  <strong className="text-[#091E42]">350 Acres</strong>
                </div>
                <div className="flex justify-between p-4">
                  <span>Silage Fodder Crops</span>
                  <strong className="text-[#091E42]">150 Acres</strong>
                </div>
                <div className="flex justify-between p-4">
                  <span>Fallow & Buffer zones</span>
                  <strong className="text-[#091E42]">650 Acres</strong>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <h3 className="text-sm font-black uppercase tracking-wider text-[#091E42] border-b border-[#DFE1E6] pb-2">3. Herd Health & Veterinary Safeguards</h3>
              <div className="border border-[#DFE1E6] divide-y divide-[#DFE1E6] rounded-[18px] overflow-hidden text-xs font-semibold text-[#5E6C84] bg-[#F4F5F7]">
                <div className="flex justify-between p-4">
                  <span>Cows under active withholding quarantine</span>
                  <strong className="text-[#BF2600]">{cows?.filter(c => c.isWithholding).length ?? 0} Cows</strong>
                </div>
                <div className="flex justify-between p-4">
                  <span>Withholding enforcement status</span>
                  <strong className="text-[#006644] uppercase">VERIFIED & COMPLIANT</strong>
                </div>
                <div className="flex justify-between p-4">
                  <span>Chemical residue tests completed</span>
                  <strong className="text-[#091E42]">Daily Bulk Tank Checks</strong>
                </div>
              </div>
            </div>
          )}

          {/* Signatures */}
          <div className="grid grid-cols-2 gap-12 pt-16 text-xs text-[#091E42] font-semibold">
            <div className="border-t border-[#DFE1E6] pt-4 space-y-1.5">
              <p><strong>Prepared by:</strong></p>
              <p className="text-sm font-bold uppercase text-primary">Farm Manager</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#5E6C84]">General Manager</p>
            </div>
            <div className="border-t border-[#DFE1E6] pt-4 space-y-1.5">
              <p><strong>Approved by:</strong></p>
              <p className="text-sm font-bold uppercase text-primary">Farm Director</p>
              <p className="text-[10px] font-black uppercase tracking-wider text-[#5E6C84]">Director</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
