"use client";

import React from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../convex/_generated/api";
import Link from "next/link";
import { ClipboardList, Tractor, FileText, ArrowRight, Layers, Map } from "lucide-react";

export default function ManagerDashboardPage() {
  const user = useQuery(api.users.viewer);
  
  // Generalized Queries
  const livestock = useQuery(api.records.listLivestock, {});
  const cropBlocks = useQuery(api.records.listCropBlocks, {});
  const pendingItems = useQuery(api.records.listInventory, { status: "pending_approval" });
  const machinery = useQuery(api.records.listMachinery, {});
  const tasks = useQuery(api.records.listTasks, {});
  const completeTaskMutation = useMutation(api.records.completeTask);

  // Loading state
  if (user === undefined || livestock === undefined || cropBlocks === undefined || pendingItems === undefined || machinery === undefined || tasks === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading dashboard statistics...</span>
      </div>
    );
  }

  // Aggregated Stats
  const totalLivestock = livestock.length;
  const categoriesCount = livestock.reduce((acc: Record<string, number>, item) => {
    acc[item.category] = (acc[item.category] || 0) + 1;
    return acc;
  }, {});

  const totalAcres = cropBlocks.reduce((sum, block) => sum + block.acres, 0);
  const pendingApprovalsCount = pendingItems.length;
  const totalMachinery = machinery.length;
  const pendingTasks = tasks.filter(t => t.status !== "done");

  const handleCompleteTask = async (taskId: any) => {
    try {
      await completeTaskMutation({ taskId });
    } catch (e) {
      console.error("Failed to complete task:", e);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6">
        <span className="label block mb-2 text-teal">
          System Overview
        </span>
        <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
          Welcome, {user?.name || "Operations Manager"}
        </h1>
        <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
          Operations & Management Control Console | Elfam Agribusiness Ledger
        </p>
      </header>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="system-card p-6 border-l-4 border-teal flex flex-col justify-between">
          <span className="label text-[#5E6C84] block">Livestock Holdings</span>
          <span className="text-3xl font-normal text-[#0F1B2D] mt-2 block mono">{totalLivestock} Head</span>
          <span className="body-small text-[#5E6C84] mt-2 block">
            {Object.entries(categoriesCount).map(([cat, count]) => `${cat}: ${count}`).join(" | ") || "No stock registered"}
          </span>
        </div>

        <div className="system-card p-6 border-l-4 border-gold flex flex-col justify-between">
          <span className="label text-[#5E6C84] block">Crop Acreage</span>
          <span className="text-3xl font-normal text-[#0F1B2D] mt-2 block mono">{totalAcres} Acres</span>
          <span className="body-small text-[#5E6C84] mt-2 block">{cropBlocks.length} Active Blocks</span>
        </div>

        <div className="system-card p-6 border-l-4 border-alert flex flex-col justify-between">
          <span className="label text-[#5E6C84] block">Pending Approvals</span>
          <span className={`text-3xl font-normal mt-2 block mono ${pendingApprovalsCount > 0 ? "text-alert" : "text-[#0F1B2D]"}`}>
            {pendingApprovalsCount} Items
          </span>
          <span className="body-small text-[#5E6C84] mt-2 block">Awaiting manager review</span>
        </div>

        <div className="system-card p-6 border-l-4 border-teal flex flex-col justify-between">
          <span className="label text-[#5E6C84] block">Machinery Fleet</span>
          <span className="text-3xl font-normal text-[#0F1B2D] mt-2 block mono">{totalMachinery} Active</span>
          <span className="body-small text-[#5E6C84] mt-2 block">Equipment & machinery registered</span>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Active Work Orders & Pending Approvals */}
        <div className="lg:col-span-8 space-y-8">
          {/* Tasks Panel */}
          <div className="system-card p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-4">
              <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
                Active Work Orders
              </h3>
              <Link href="/manager/tasks" className="btn-secondary h-8 px-3 rounded-[6px] text-xs flex items-center gap-1">
                <span>All Tasks</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingTasks.length === 0 ? (
              <p className="body-small text-[#5E6C84] italic">All tasks successfully resolved.</p>
            ) : (
              <div className="space-y-3">
                {pendingTasks.slice(0, 5).map((task) => (
                  <div key={task._id} className="flex items-center justify-between p-4 bg-[#F4F5F7] border border-[#DFE1E6] rounded-none">
                    <div className="space-y-1">
                      <span className="text-xs font-bold text-[#0F1B2D]">{task.title}</span>
                      <p className="body-small text-[#5E6C84] font-medium">{task.description}</p>
                      <span className="mono text-[10px] text-[#5E6C84] uppercase tracking-wider block">
                        Due: {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleCompleteTask(task._id)}
                      className="btn-secondary h-8 px-3 rounded-[6px] text-xs cursor-pointer"
                    >
                      Resolve
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Pending Approval Items Panel */}
          <div className="system-card p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-[#DFE1E6] pb-4">
              <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
                Pending Inventory Approvals
              </h3>
              <Link href="/manager/inventory" className="btn-secondary h-8 px-3 rounded-[6px] text-xs flex items-center gap-1">
                <span>Approve Queue</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {pendingApprovalsCount === 0 ? (
              <p className="body-small text-[#5E6C84] italic">No pending items requiring review.</p>
            ) : (
              <div className="space-y-3">
                {pendingItems.map((item) => (
                  <div key={item._id} className="flex items-center justify-between p-4 bg-[#F4F5F7] border border-[#DFE1E6] rounded-none">
                    <div>
                      <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 block mb-1">
                        {item.category}
                      </span>
                      <span className="text-xs font-bold text-[#0F1B2D]">{item.productName}</span>
                      <span className="body-small text-[#5E6C84] block font-medium">Unit: {item.unit} &middot; Low Stock Level: {item.lowStockThreshold}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="status-badge text-[9px] text-alert border-alert/20 bg-alert/5 font-bold">
                        PENDING
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Quick Links / Access Panels */}
        <div className="lg:col-span-4 space-y-8">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
              Ledger Shortcuts
            </h3>
            <div className="grid grid-cols-1 gap-3">
              <Link href="/manager/livestock" className="flex items-center gap-3 p-3.5 bg-[#F4F5F7] hover:bg-[#00869B]/5 border border-[#DFE1E6] hover:border-[#00869B] transition-colors rounded-none text-xs font-medium text-[#0F1B2D]">
                <Layers className="h-4 w-4 text-teal animate-none" />
                <span>Livestock Status</span>
              </Link>
              <Link href="/manager/crops" className="flex items-center gap-3 p-3.5 bg-[#F4F5F7] hover:bg-[#00869B]/5 border border-[#DFE1E6] hover:border-[#00869B] transition-colors rounded-none text-xs font-medium text-[#0F1B2D]">
                <Map className="h-4 w-4 text-teal animate-none" />
                <span>Crops & Fields Register</span>
              </Link>
              <Link href="/manager/inventory" className="flex items-center gap-3 p-3.5 bg-[#F4F5F7] hover:bg-[#00869B]/5 border border-[#DFE1E6] hover:border-[#00869B] transition-colors rounded-none text-xs font-medium text-[#0F1B2D]">
                <ClipboardList className="h-4 w-4 text-teal animate-none" />
                <span>Store Inventory Control</span>
              </Link>
              <Link href="/manager/equipment" className="flex items-center gap-3 p-3.5 bg-[#F4F5F7] hover:bg-[#00869B]/5 border border-[#DFE1E6] hover:border-[#00869B] transition-colors rounded-none text-xs font-medium text-[#0F1B2D]">
                <Tractor className="h-4 w-4 text-teal animate-none" />
                <span>Equipment Registry</span>
              </Link>
              <Link href="/manager/reports" className="flex items-center gap-3 p-3.5 bg-[#F4F5F7] hover:bg-[#00869B]/5 border border-[#DFE1E6] hover:border-[#00869B] transition-colors rounded-none text-xs font-medium text-[#0F1B2D]">
                <FileText className="h-4 w-4 text-teal animate-none" />
                <span>Export Reports Console</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
