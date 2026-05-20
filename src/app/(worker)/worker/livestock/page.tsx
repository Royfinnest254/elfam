"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { Info } from "lucide-react";

export default function WorkerLivestockPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedStatus, setSelectedStatus] = useState<string>("All");

  const livestock = useQuery(api.records.listLivestock, {});
  const createLivestockMutation = useMutation(api.records.createLivestock);

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [tagNumber, setTagNumber] = useState("");
  const [category, setCategory] = useState("Cattle");
  const [name, setName] = useState("");
  const [breed, setBreed] = useState("");
  const [dob, setDob] = useState("");
  const [status, setStatus] = useState("active");
  const [notes, setNotes] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (livestock === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center font-sans text-muted">
        <span className="body-small block">Loading livestock registry...</span>
      </div>
    );
  }

  const categories = ["All", "Cattle", "Sheep", "Goats", "Pigs", "Poultry", "Rabbits", "Donkeys", "Horses", "Camels", "Beehives", "Fish"];
  const statuses = ["All", "active", "treatment", "dry", "sold", "deceased"];

  const filteredLivestock = livestock.filter((item) => {
    const matchCat = selectedCategory === "All" || item.category.toLowerCase() === selectedCategory.toLowerCase();
    const matchStatus = selectedStatus === "All" || item.status === selectedStatus;
    return matchCat && matchStatus;
  });

  const handleRegisterLivestock = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!tagNumber.trim()) {
      setErrorMsg("Tag number is required.");
      return;
    }
    if (!breed.trim()) {
      setErrorMsg("Breed / details are required.");
      return;
    }
    if (!dob) {
      setErrorMsg("Date of Birth is required.");
      return;
    }

    const epochDob = new Date(dob).getTime();
    if (isNaN(epochDob)) {
      setErrorMsg("Please enter a valid Date of Birth.");
      return;
    }

    setSubmitting(true);
    try {
      await createLivestockMutation({
        tagNumber: tagNumber.trim(),
        category,
        name: name.trim() || "Unnamed Record",
        breed: breed.trim(),
        dateOfBirth: epochDob,
        status: status as any,
        notes: notes.trim(),
      });
      setStatusMsg("VERIFIED: Livestock registered successfully.");
      setTagNumber("");
      setName("");
      setBreed("");
      setDob("");
      setStatus("active");
      setNotes("");
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to register livestock record.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label block mb-2 text-teal">
            Livestock List
          </span>
          <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
            Livestock Registry
          </h1>
          <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
            Log and track animal health status and details
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
          Register animal
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

      {/* Filter Tabs Toolbar */}
      <div className="system-card p-6 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-[#DFE1E6] pb-4">
          <div className="space-y-1.5">
            <span className="label text-[#5E6C84] block">Category Filter</span>
            <div className="flex flex-wrap gap-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-[6px] transition-colors cursor-pointer ${
                    selectedCategory === cat
                      ? "bg-[#0F1B2D] border-[#0F1B2D] text-white"
                      : "bg-white border-[#DFE1E6] text-[#0F1B2D] hover:bg-[#F4F5F7]"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <span className="label text-[#5E6C84] block">Status Filter</span>
            <div className="flex flex-wrap gap-2">
              {statuses.map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setSelectedStatus(st)}
                  className={`px-3 py-1.5 text-xs font-medium border rounded-[6px] transition-colors cursor-pointer ${
                    selectedStatus === st
                      ? "bg-[#00869B] border-[#00869B] text-white"
                      : "bg-white border-[#DFE1E6] text-[#0F1B2D] hover:bg-[#F4F5F7]"
                  }`}
                >
                  {st.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Info Box */}
        <div className="flex items-start gap-2.5 bg-teal/5 text-teal p-4 rounded-[4px] border border-teal/20">
          <Info className="h-4.5 w-4.5 shrink-0 mt-0.5" />
          <p className="body-small leading-relaxed">
            <strong>Oversight Mode</strong>: Staff log daily activity details, treatments, and events. Hardware/RFID tracking is not active; all identifiers utilize Visual Tag Numbers.
          </p>
        </div>
      </div>

      {/* Livestock Table */}
      <div className="system-card p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[10px] font-semibold uppercase tracking-wider text-[#5E6C84]">
                <th className="py-4 px-6">Tag Number</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Breed / Details</th>
                <th className="py-4 px-6">Age</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#DFE1E6] text-xs font-medium text-[#0F1B2D]">
              {filteredLivestock.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-[#5E6C84] italic">
                    No animals match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredLivestock.map((item) => {
                  const ageInYears = ((Date.now() - item.dateOfBirth) / (365 * 24 * 60 * 60 * 1000)).toFixed(1);
                  return (
                    <tr key={item._id} className="hover:bg-[#F4F5F7]/40 transition-colors">
                      <td className="py-4 px-6 font-mono font-bold tracking-tight text-[#0F1B2D]">
                        {item.tagNumber}
                      </td>
                      <td className="py-4 px-6">
                        <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 font-bold">{item.name}</td>
                      <td className="py-4 px-6">{item.breed}</td>
                      <td className="py-4 px-6 mono">{ageInYears} yrs</td>
                      <td className="py-4 px-6">
                        <span className={`status-badge text-[9px] border uppercase ${
                          item.status === "active"
                            ? "text-teal border-teal/20 bg-teal/5"
                            : item.status === "treatment"
                            ? "text-alert border-alert/20 bg-alert/5"
                            : "text-[#5E6C84] border-[#DFE1E6] bg-white"
                        }`}>
                          {item.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-[#5E6C84] font-normal italic truncate max-w-[200px]">
                        {item.notes}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Registration Modal (Flat visual design) */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#091E42]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0F1B2D] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DFE1E6] pb-3">
              <h2 className="text-xl font-normal text-[#0F1B2D]">Register new animal</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#5E6C84] hover:text-[#0F1B2D] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleRegisterLivestock} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="tag-number" className="label text-[#5E6C84]">Visual Tag Number</label>
                  <input
                    type="text"
                    id="tag-number"
                    value={tagNumber}
                    onChange={(e) => setTagNumber(e.target.value)}
                    className="input-field"
                    placeholder="e.g. EL-C082"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="livestock-cat" className="label text-[#5E6C84]">Category Group</label>
                  <select
                    id="livestock-cat"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="Cattle">Cattle</option>
                    <option value="Sheep">Sheep</option>
                    <option value="Goats">Goats</option>
                    <option value="Pigs">Pigs</option>
                    <option value="Poultry">Poultry</option>
                    <option value="Rabbits">Rabbits</option>
                    <option value="Donkeys">Donkeys</option>
                    <option value="Horses">Horses</option>
                    <option value="Camels">Camels</option>
                    <option value="Beehives">Beehives</option>
                    <option value="Fish">Fish</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="animal-name" className="label text-[#5E6C84]">Record Name / Identifier</label>
                  <input
                    type="text"
                    id="animal-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Daisy, Flock B"
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="animal-breed" className="label text-[#5E6C84]">Breed / Details</label>
                  <input
                    type="text"
                    id="animal-breed"
                    value={breed}
                    onChange={(e) => setBreed(e.target.value)}
                    className="input-field"
                    placeholder="e.g. Ayrshire, Sussex Red"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label htmlFor="animal-dob" className="label text-[#5E6C84]">Date of Birth</label>
                  <input
                    type="date"
                    id="animal-dob"
                    value={dob}
                    onChange={(e) => setDob(e.target.value)}
                    className="input-field"
                    required
                  />
                </div>

                <div className="space-y-1">
                  <label htmlFor="animal-status" className="label text-[#5E6C84]">Status</label>
                  <select
                    id="animal-status"
                    value={status}
                    onChange={(e) => setStatus(e.target.value)}
                    className="input-field bg-white"
                  >
                    <option value="active">Active</option>
                    <option value="treatment">In Treatment</option>
                    <option value="dry">Dry</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label htmlFor="animal-notes" className="label text-[#5E6C84]">Administrative Notes</label>
                <textarea
                  id="animal-notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="input-field min-h-[80px] py-2"
                  placeholder="Notes on lineage, purchase weight, vaccination history, etc."
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
                  {submitting ? "Registering..." : "Register animal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
