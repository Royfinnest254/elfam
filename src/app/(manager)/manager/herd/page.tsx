"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import Link from "next/link";
import { Search, ChevronRight, Plus, X } from "lucide-react";
import { getFarmClock } from "@/lib/farmClock";

export default function ManagerHerdPage() {
  const { now, yesterdayDateStr } = getFarmClock();
  const dashboardData = useQuery(api.livestock.getLivestockDashboard, { now, yesterdayDateStr });
  
  const registerIndividual = useMutation(api.records.registerLivestock);
  const registerGroup = useMutation(api.records.registerLivestockGroup);

  const [activeTab, setActiveTab] = useState<"individual" | "group">("individual");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [regType, setRegType] = useState<"individual" | "group">("individual");

  // Form states - Individual
  const [tagNumber, setTagNumber] = useState("");
  const [name, setName] = useState("");
  const [species, setSpecies] = useState<"cattle" | "goat" | "sheep" | "pig" | "other">("cattle");
  const [breed, setBreed] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [sex, setSex] = useState<"M" | "F">("F");
  const [status, setStatus] = useState<"milking" | "dry" | "treatment" | "young" | "sold" | "deceased">("dry");
  const [sireInfo, setSireInfo] = useState("");
  const [damTagNumber, setDamTagNumber] = useState("");
  const [notes, setNotes] = useState("");

  // Form states - Group
  const [groupCode, setGroupCode] = useState("");
  const [groupName, setGroupName] = useState("");
  const [groupSpecies, setGroupSpecies] = useState<"poultry" | "bees" | "other">("poultry");
  const [groupBreed, setGroupBreed] = useState("");
  const [groupCount, setGroupCount] = useState("");
  const [groupAcquiredDate, setGroupAcquiredDate] = useState("");
  const [groupNotes, setGroupNotes] = useState("");

  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (dashboardData === undefined) {
    return <div className="text-xs text-muted uppercase font-mono tracking-widest p-8 font-sans">Loading livestock registers...</div>;
  }

  const { individual = [], groups = [] } = dashboardData;

  const filteredIndividual = individual.filter((c: any) => {
    const matchesSearch = c.name.toLowerCase().includes(search.toLowerCase()) || c.tagNumber.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || c.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredGroups = groups.filter((g: any) => {
    const matchesSearch = g.name.toLowerCase().includes(search.toLowerCase()) || g.groupCode.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === "all" || g.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleRegisterIndividualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!tagNumber || !name || !breed || !dateOfBirth) {
      setError("Please fill in tag number, name, breed, and date of birth.");
      setSubmitting(false);
      return;
    }

    try {
      await registerIndividual({
        tagNumber,
        name,
        species,
        breed,
        dateOfBirth: new Date(dateOfBirth).getTime(),
        sex,
        status,
        currentLactationNumber: 0,
        lastBirthDate: null,
        sireInfo,
        damTagNumber,
        notes,
      });
      setShowRegisterModal(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || "Failed to register animal.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterGroupSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    if (!groupCode || !groupName || !groupBreed || !groupCount || !groupAcquiredDate) {
      setError("Please fill in all required fields.");
      setSubmitting(false);
      return;
    }

    try {
      await registerGroup({
        groupCode,
        name: groupName,
        species: groupSpecies,
        breed: groupBreed,
        status: "active",
        count: parseInt(groupCount),
        dateAcquiredOrHatched: new Date(groupAcquiredDate).getTime(),
        notes: groupNotes,
      });
      setShowRegisterModal(false);
      resetForm();
    } catch (e: any) {
      setError(e.message || "Failed to register group.");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTagNumber("");
    setName("");
    setSpecies("cattle");
    setBreed("");
    setDateOfBirth("");
    setSex("F");
    setStatus("dry");
    setSireInfo("");
    setDamTagNumber("");
    setNotes("");

    setGroupCode("");
    setGroupName("");
    setGroupSpecies("poultry");
    setGroupBreed("");
    setGroupCount("");
    setGroupAcquiredDate("");
    setGroupNotes("");
    setError(null);
  };

  return (
    <div className="space-y-8 font-sans text-ink pb-12">
      <header className="border-b border-rule pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <span className="text-[10px] font-mono uppercase text-muted tracking-[0.2em] block mb-2">
            Agribusiness Ledger
          </span>
          <h1 className="text-display font-display text-ink uppercase">
            Livestock Registry
          </h1>
        </div>
        <button
          type="button"
          onClick={() => { resetForm(); setShowRegisterModal(true); }}
          className="btn-primary flex items-center gap-2 rounded-none"
        >
          <Plus className="h-4 w-4" />
          <span>Register Livestock</span>
        </button>
      </header>

      {/* Tab Navigation */}
      <div className="flex border-b border-rule">
        <button
          type="button"
          onClick={() => { setActiveTab("individual"); setStatusFilter("all"); }}
          className={`px-6 py-3 font-display text-h2 italic border-b-2 -mb-px transition-all rounded-none ${
            activeTab === "individual" ? "border-moss text-moss font-semibold" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Individual Animals
        </button>
        <button
          type="button"
          onClick={() => { setActiveTab("group"); setStatusFilter("all"); }}
          className={`px-6 py-3 font-display text-h2 italic border-b-2 -mb-px transition-all rounded-none ${
            activeTab === "group" ? "border-moss text-moss font-semibold" : "border-transparent text-muted hover:text-ink"
          }`}
        >
          Grouped Livestock (Poultry & Bees)
        </button>
      </div>

      {/* Filter Options */}
      <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between border-b border-rule pb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-4 top-3 h-4 w-4 text-muted pointer-events-none" />
          <input
            type="text"
            placeholder={activeTab === "individual" ? "Search by tag number or name..." : "Search by group code or name..."}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 bg-paper border border-rule pl-11 pr-4 text-xs font-semibold text-ink focus:outline-none focus:border-moss rounded-none transition-colors"
          />
        </div>

        <div className="flex flex-wrap gap-2 p-1 bg-paper-2 border border-rule rounded-none">
          {activeTab === "individual" ? (
            ["all", "milking", "dry", "treatment", "young", "sold", "deceased"].map((statusVal) => (
              <button
                key={statusVal}
                type="button"
                onClick={() => setStatusFilter(statusVal)}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                  statusFilter === statusVal
                    ? "bg-moss text-cream"
                    : "text-muted hover:bg-cream hover:text-moss"
                }`}
              >
                {statusVal}
              </button>
            ))
          ) : (
            ["all", "active", "sold", "deceased"].map((statusVal) => (
              <button
                key={statusVal}
                type="button"
                onClick={() => setStatusFilter(statusVal)}
                className={`px-3 py-1.5 text-[9px] font-mono font-bold uppercase tracking-wider transition-all cursor-pointer rounded-none ${
                  statusFilter === statusVal
                    ? "bg-moss text-cream"
                    : "text-muted hover:bg-cream hover:text-moss"
                }`}
              >
                {statusVal}
              </button>
            ))
          )}
        </div>
      </div>

      {/* Grid Content */}
      {activeTab === "individual" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredIndividual.map((cow: any) => (
            <Link
              key={cow._id}
              href={`/manager/livestock/${cow.tagNumber}`}
              className="group block system-card p-6 hover:border-moss transition-all cursor-pointer relative rounded-none"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-moss block group-hover:underline">
                    {cow.tagNumber}
                  </span>
                  <h3 className="text-base font-display italic text-ink mt-1">{cow.name}</h3>
                </div>
                <span className={`status-badge ${
                  cow.status === "milking" ? "status-ok" :
                  cow.status === "treatment" ? "status-out" :
                  "bg-paper-2 text-muted border-rule"
                }`}>
                  {cow.status}
                </span>
              </div>

              <div className="border-t border-rule pt-4 space-y-2 text-xs font-medium text-muted">
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Species</span>
                  <span className="text-ink font-bold capitalize">{cow.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Breed</span>
                  <span className="text-ink font-bold">{cow.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Yield yesterday</span>
                  <span className="text-moss font-bold font-mono">
                    {cow.yesterdayYield > 0 ? `${cow.yesterdayYield.toFixed(1)} L` : "0.0 L"}
                  </span>
                </div>
              </div>

              <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-all text-moss">
                <ChevronRight className="h-5 w-5" />
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map((g: any) => (
            <div
              key={g._id}
              className="system-card p-6 relative rounded-none border border-rule bg-paper"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <span className="text-[10px] font-mono uppercase text-moss block">
                    {g.groupCode}
                  </span>
                  <h3 className="text-base font-display italic text-ink mt-1">{g.name}</h3>
                </div>
                <span className={`status-badge ${
                  g.status === "active" ? "status-ok" : "bg-paper-2 text-muted border-rule"
                }`}>
                  {g.status}
                </span>
              </div>

              <div className="border-t border-rule pt-4 space-y-2 text-xs font-medium text-muted">
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Species</span>
                  <span className="text-ink font-bold capitalize">{g.species}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Population</span>
                  <span className="text-ink font-bold font-mono">{g.count} head</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Breed/Variety</span>
                  <span className="text-ink font-bold">{g.breed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[9px] font-mono uppercase tracking-wider">Yesterday Production</span>
                  <span className="text-moss font-bold font-mono">
                    {g.yesterdayYield > 0 ? `${g.yesterdayYield.toFixed(0)} units` : "0"}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Registration Modal */}
      {showRegisterModal && (
        <div className="fixed inset-0 bg-ink/75 z-50 flex items-center justify-center p-4">
          <div className="bg-paper border border-rule rounded-none w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-6">
            <div className="flex justify-between items-center border-b border-rule pb-4">
              <h2 className="text-h1 font-display text-ink uppercase">Register New Livestock</h2>
              <button
                type="button"
                onClick={() => setShowRegisterModal(false)}
                className="p-1 text-muted hover:text-ink transition-colors"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {error && (
              <div className="bg-alert/5 border border-alert/20 text-alert p-4 text-xs font-bold font-mono">
                [ERROR] {error}
              </div>
            )}

            <div className="flex gap-4 border-b border-rule pb-4">
              <button
                type="button"
                onClick={() => setRegType("individual")}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase border rounded-none ${
                  regType === "individual" ? "bg-moss text-cream border-moss" : "bg-paper-2 text-muted border-rule"
                }`}
              >
                Individual Animal
              </button>
              <button
                type="button"
                onClick={() => setRegType("group")}
                className={`px-4 py-2 text-xs font-mono font-bold uppercase border rounded-none ${
                  regType === "group" ? "bg-moss text-cream border-moss" : "bg-paper-2 text-muted border-rule"
                }`}
              >
                Group Cohort (Poultry/Bees)
              </button>
            </div>

            {regType === "individual" ? (
              <form onSubmit={handleRegisterIndividualSubmit} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Tag Number *</label>
                    <input
                      type="text"
                      value={tagNumber}
                      onChange={(e) => setTagNumber(e.target.value)}
                      placeholder="e.g. EL-CT-102"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Name *</label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Bertha"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Species</label>
                    <select
                      value={species}
                      onChange={(e) => setSpecies(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="cattle">Cattle</option>
                      <option value="goat">Goat</option>
                      <option value="sheep">Sheep</option>
                      <option value="pig">Pig</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Breed *</label>
                    <input
                      type="text"
                      value={breed}
                      onChange={(e) => setBreed(e.target.value)}
                      placeholder="e.g. Toggenburg"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Sex</label>
                    <select
                      value={sex}
                      onChange={(e) => setSex(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="F">Female</option>
                      <option value="M">Male</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Date of Birth *</label>
                    <input
                      type="date"
                      value={dateOfBirth}
                      onChange={(e) => setDateOfBirth(e.target.value)}
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Initial Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="milking">Milking</option>
                      <option value="dry">Dry</option>
                      <option value="treatment">Treatment</option>
                      <option value="young">Young</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Sire Information</label>
                    <input
                      type="text"
                      value={sireInfo}
                      onChange={(e) => setSireInfo(e.target.value)}
                      placeholder="Bull code or pedigree details"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Dam Tag Number</label>
                    <input
                      type="text"
                      value={damTagNumber}
                      onChange={(e) => setDamTagNumber(e.target.value)}
                      placeholder="Dam registration tag"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Operational Notes</label>
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    rows={3}
                    placeholder="Physical marks, initial weights, pedigree logs..."
                    className="w-full p-3 bg-paper border border-rule rounded-none text-xs font-semibold focus:outline-none focus:border-moss"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary h-11 uppercase font-mono tracking-wider rounded-none"
                >
                  {submitting ? "Saving to Registry..." : "Commit Individual Record"}
                </button>
              </form>
            ) : (
              <form onSubmit={handleRegisterGroupSubmit} className="space-y-4 font-sans">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Group Code *</label>
                    <input
                      type="text"
                      value={groupCode}
                      onChange={(e) => setGroupCode(e.target.value)}
                      placeholder="e.g. FLOCK-002"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Group Name *</label>
                    <input
                      type="text"
                      value={groupName}
                      onChange={(e) => setGroupName(e.target.value)}
                      placeholder="e.g. Layer Flock B"
                      className="input-field"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Group Species</label>
                    <select
                      value={groupSpecies}
                      onChange={(e) => setGroupSpecies(e.target.value as any)}
                      className="input-field"
                    >
                      <option value="poultry">Poultry</option>
                      <option value="bees">Bees</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Breed / Variety *</label>
                    <input
                      type="text"
                      value={groupBreed}
                      onChange={(e) => setGroupBreed(e.target.value)}
                      placeholder="e.g. Hy-Line Brown"
                      className="input-field"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Head Count *</label>
                    <input
                      type="number"
                      value={groupCount}
                      onChange={(e) => setGroupCount(e.target.value)}
                      placeholder="e.g. 250"
                      className="input-field"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Date Acquired or Hatched *</label>
                  <input
                    type="date"
                    value={groupAcquiredDate}
                    onChange={(e) => setGroupAcquiredDate(e.target.value)}
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-mono font-bold text-ink uppercase tracking-wider mb-1">Group Notes</label>
                  <textarea
                    value={groupNotes}
                    onChange={(e) => setGroupNotes(e.target.value)}
                    rows={3}
                    placeholder="Feed regime details, source supplier, or colony details..."
                    className="w-full p-3 bg-paper border border-rule rounded-none text-xs font-semibold focus:outline-none focus:border-moss"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full btn-primary h-11 uppercase font-mono tracking-wider rounded-none"
                >
                  {submitting ? "Saving Group..." : "Commit Group Record"}
                </button>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
