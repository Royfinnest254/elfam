"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info } from "lucide-react";

export default function ManagerCropsPage() {
  const cropBlocks = useQuery(api.records.listCropBlocks, {});
  const cropActivities = useQuery(api.records.listCropActivities, {});
  const createCropBlockMutation = useMutation(api.records.createCropBlock);
  const deleteCropBlockMutation = useMutation(api.records.deleteCropBlock);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [category, setCategory] = useState("Cereal");
  const [crop, setCrop] = useState("");
  const [acres, setAcres] = useState("");
  const [status, setStatus] = useState("fallow");
  const [notes, setNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (cropBlocks === undefined || cropActivities === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading crops registry...</span>
      </div>
    );
  }

  const handleRegisterBlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg("Block name is required.");
      return;
    }
    const parsedAcres = parseFloat(acres);
    if (isNaN(parsedAcres) || parsedAcres <= 0) {
      setErrorMsg("Acreage must be a positive number.");
      return;
    }

    setSubmitting(true);
    try {
      await createCropBlockMutation({
        name: name.trim(),
        category,
        crop: crop || "Fallow",
        acres: parsedAcres,
        status: status as any,
        notes: notes.trim(),
      });
      setStatusMsg("VERIFIED: Crop block successfully registered.");
      setName("");
      setCrop("Wheat");
      setAcres("");
      setStatus("fallow");
      setNotes("");
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register crop block.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteBlock = async (id: any) => {
    if (!confirm("Are you sure you want to delete this crop block record?")) return;
    try {
      await deleteCropBlockMutation({ id });
      setStatusMsg("VERIFIED: Crop block record deleted.");
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to delete crop block.");
    }
  };

  // Aggregate block acreage
  const totalAcres = cropBlocks.reduce((sum, block) => sum + block.acres, 0);
  const cerealAcres = cropBlocks.filter(b => b.category.toLowerCase() === "cereal").reduce((sum, b) => sum + b.acres, 0);
  const hortAcres = cropBlocks.filter(b => b.category.toLowerCase() === "horticulture").reduce((sum, b) => sum + b.acres, 0);
  const forageAcres = cropBlocks.filter(b => b.category.toLowerCase() === "forage").reduce((sum, b) => sum + b.acres, 0);

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label block mb-2 text-teal">
            Crops & Fields Register
          </span>
          <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
            Crops & Crop Blocks
          </h1>
          <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
            Acreage mapping, block status & crop activity histories
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
          Register crop block
        </button>
      </header>

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

      {/* Acreage Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="system-card p-6 text-center space-y-1">
          <span className="label text-[#5E6C84] block">Total Managed Acreage</span>
          <span className="text-2xl font-normal text-[#0F1B2D] block mono">{totalAcres} Acres</span>
        </div>
        <div className="system-card p-6 text-center space-y-1">
          <span className="label text-[#5E6C84] block">Cereals Block</span>
          <span className="text-2xl font-normal text-teal block mono">{cerealAcres} Acres</span>
        </div>
        <div className="system-card p-6 text-center space-y-1">
          <span className="label text-[#5E6C84] block">Horticulture Block</span>
          <span className="text-2xl font-normal text-teal block mono">{hortAcres} Acres</span>
        </div>
        <div className="system-card p-6 text-center space-y-1">
          <span className="label text-[#5E6C84] block">Forage Meadow</span>
          <span className="text-2xl font-normal text-teal block mono">{forageAcres} Acres</span>
        </div>
      </div>

      {/* Info Warning */}
      <div className="flex items-start gap-2.5 bg-teal/5 text-teal p-4 rounded-[4px] border border-teal/20">
        <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
        <p className="body-small leading-relaxed">
          <strong>Acreage Operations Note</strong>: Crop blocks represent the physical field boundary allocations for the Moiben farm sector. Workers log agricultural tasks (seeding, chemical applications, tillage, harvesting) directly to these blocks from the field logging portal.
        </p>
      </div>

      {/* Crop Blocks Table */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
              Active Crop Blocks
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[10px] font-semibold uppercase tracking-wider text-[#5E6C84]">
                    <th className="py-3 px-4">Block Name</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4">Crop Type</th>
                    <th className="py-3 px-4 text-right">Acreage</th>
                    <th className="py-3 px-4">Planted Date</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DFE1E6] text-xs font-medium text-[#0F1B2D]">
                  {cropBlocks.map((block) => (
                    <tr key={block._id} className="hover:bg-[#F4F5F7]/40 transition-colors">
                      <td className="py-3.5 px-4 font-bold">{block.name}</td>
                      <td className="py-3.5 px-4">
                        <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5">
                          {block.category}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 uppercase text-[#5E6C84]">{block.crop}</td>
                      <td className="py-3.5 px-4 text-right mono">{block.acres} ac</td>
                      <td className="py-3.5 px-4 mono">
                        {block.plantedDate ? new Date(block.plantedDate).toLocaleDateString() : "Fallow"}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className={`status-badge text-[9px] border ${
                          block.status === "growing" || block.status === "planted"
                            ? "text-teal border-teal/20 bg-teal/5"
                            : "text-[#5E6C84] border-[#DFE1E6] bg-white"
                        }`}>
                          {block.status.toUpperCase()}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeleteBlock(block._id)}
                          className="text-alert hover:underline font-bold text-xs"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right: Crop Activities Audit Logs */}
        <div className="lg:col-span-4 space-y-6">
          <div className="system-card p-6 space-y-6">
            <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight">
              Field Operations Log
            </h3>
            {cropActivities.length === 0 ? (
              <p className="body-small text-[#5E6C84] italic">No field activities recorded.</p>
            ) : (
              <div className="space-y-4 max-h-[480px] overflow-y-auto pr-2 custom-scrollbar">
                {cropActivities.map((act) => {
                  const block = cropBlocks.find(b => b._id === act.cropBlockId);
                  return (
                    <div key={act._id} className="p-3 bg-[#F4F5F7] border border-[#DFE1E6] rounded-none space-y-1.5">
                      <div className="flex justify-between items-start">
                        <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5">
                          {act.type}
                        </span>
                        <span className="mono text-[9px] text-[#5E6C84]">
                          {new Date(act.activityDate).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-xs font-bold text-[#0F1B2D] block">
                        Block: {block?.name || "Unknown Block"}
                      </span>
                      {act.productApplied && (
                        <p className="body-small text-[#5E6C84]">
                          Product: <strong>{act.productApplied}</strong> ({act.rate || "N/A"})
                        </p>
                      )}
                      {act.quantityHarvested !== undefined && (
                        <p className="body-small text-[#5E6C84]">
                          Harvest Yield: <strong>{act.quantityHarvested} tonnes</strong>
                        </p>
                      )}
                      <p className="body-small text-[#5E6C84] italic font-normal">
                        "{act.notes}"
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Registration Modal (Flat visual design) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#091E42]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0F1B2D] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DFE1E6] pb-3">
              <h2 className="text-xl font-normal text-[#0F1B2D]">Register new crop block</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#5E6C84] hover:text-[#0F1B2D] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterBlock} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="block-name" className="label text-[#5E6C84]">Block Name</label>
                <input
                  type="text"
                  id="block-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="e.g. Block C"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="block-cat" className="label text-[#5E6C84]">Category Group</label>
                  <select
                    id="block-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="Cereal">Cereal</option>
                    <option value="Horticulture">Horticulture</option>
                    <option value="Forage">Forage</option>
                    <option value="Forestry">Forestry</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label htmlFor="block-crop" className="label text-[#5E6C84]">Crop Type</label>
                  <select
                    id="block-crop"
                    value={crop}
                    onChange={(e) => setCrop(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="Wheat">Wheat</option>
                    <option value="Maize">Maize</option>
                    <option value="Barley">Barley</option>
                    <option value="Lucerne">Lucerne</option>
                    <option value="Oats">Oats</option>
                    <option value="Beans">Beans</option>
                    <option value="Potatoes">Potatoes</option>
                    <option value="Cabbage">Cabbage</option>
                    <option value="Grass (forage)">Grass (forage)</option>
                    <option value="Other">Other</option>
                    <option value="Fallow">None (Fallow)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="block-acres" className="label text-[#5E6C84]">Acreage (Acres)</label>
                  <input
                    type="number"
                    id="block-acres"
                    step="0.1"
                    value={acres}
                    onChange={(e) => setAcres(e.target.value)}
                    className="input-field"
                    placeholder="e.g. 24.5"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="block-status" className="label text-[#5E6C84]">Status</label>
                  <select
                    id="block-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="fallow">Fallow</option>
                    <option value="planted">Planted</option>
                    <option value="growing">Growing</option>
                    <option value="harvested">Harvested</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="block-notes" className="label text-[#5E6C84]">Soil / Field Notes</label>
                <textarea
                  id="block-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field min-h-[80px] py-2"
                  placeholder="Note soil preparation, lime applications, etc."
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#DFE1E6]">
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
                  {submitting ? "Registering..." : "Register block"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
