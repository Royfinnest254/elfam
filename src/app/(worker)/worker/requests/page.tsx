"use client";

import React, { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "../../../../../convex/_generated/api";
import { FileText, Plus } from "lucide-react";

export default function WorkerRequestsPage() {
  const requests = useQuery(api.records.listRequests, {});
  const createRequestMutation = useMutation(api.records.createRequest);

  const [modalOpen, setModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<"supplies" | "maintenance" | "other">("supplies");
  const [details, setDetails] = useState("");

  const [statusMsg, setStatusMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (requests === undefined) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center text-[#6B7280] text-sm">
        Loading requests ledger...
      </div>
    );
  }

  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatusMsg(null);
    setErrorMsg(null);

    if (!title.trim()) {
      setErrorMsg("Request title is required.");
      return;
    }
    if (!details.trim()) {
      setErrorMsg("Request details are required.");
      return;
    }

    setSubmitting(true);
    try {
      await createRequestMutation({
        title: title.trim(),
        category,
        details: details.trim(),
      });
      setStatusMsg("VERIFIED: Request successfully submitted to Manager review.");
      setTitle("");
      setCategory("supplies");
      setDetails("");
      setModalOpen(false);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Failed to submit request.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-8 pb-12">
      <header className="border-b border-[#DFE1E6] pb-6 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
        <div>
          <span className="label block mb-2 text-teal">
            Operations Support
          </span>
          <h1 className="text-3xl font-normal text-[#0F1B2D] tracking-tight">
            Requests & Support Issues
          </h1>
          <p className="body-small text-[#5E6C84] mt-1 uppercase tracking-wider font-semibold">
            Submit resource requests or report maintenance issues to management
          </p>
        </div>
        <button
          type="button"
          onClick={() => { setStatusMsg(null); setErrorMsg(null); setModalOpen(true); }}
          className="btn-primary"
        >
          <Plus className="h-4 w-4 mr-2 inline" />
          Create Request
        </button>
      </header>

      {/* Alerts */}
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

      {/* Requests Logs */}
      <div className="system-card p-6 space-y-4">
        <h3 className="text-lg font-normal text-[#0F1B2D] tracking-tight border-b border-[#DFE1E6] pb-4">
          All Requests
        </h3>
        {requests.length === 0 ? (
          <div className="py-16 text-center">
            <FileText className="h-10 w-10 text-[#D1D5DB] mx-auto mb-3" />
            <p className="text-sm text-[#6B7280]">No requests submitted yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#F4F5F7] border-b border-[#DFE1E6] text-[10px] font-semibold uppercase tracking-wider text-[#5E6C84]">
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Title / Purpose</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Description / Details</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Manager Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DFE1E6] text-xs font-medium text-[#0F1B2D]">
                {requests.map((req) => (
                  <tr key={req._id} className="hover:bg-[#F4F5F7]/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono text-[#5E6C84]">
                      {new Date(req.requestedAt).toLocaleDateString("en-GB")}
                    </td>
                    <td className="py-3.5 px-4 font-bold">{req.title}</td>
                    <td className="py-3.5 px-4">
                      <span className="status-badge text-[9px] text-teal border-teal/20 bg-teal/5 uppercase">
                        {req.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-normal text-[#5E6C84]">{req.details}</td>
                    <td className="py-3.5 px-4">
                      <span className={`status-badge text-[9px] border uppercase font-bold ${
                        req.status === "approved"
                          ? "text-teal border-teal/20 bg-teal/5"
                          : req.status === "rejected"
                          ? "text-alert border-alert/20 bg-alert/5"
                          : "text-[#C09E5A] border-[#C09E5A]/20 bg-[#C09E5A]/5"
                      }`}>
                        {req.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-normal text-[#5E6C84] italic">
                      {req.notes || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* New Request Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-[#091E42]/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white border-2 border-[#0F1B2D] w-full max-w-lg p-6 space-y-6 rounded-[6px]">
            <div className="flex justify-between items-start border-b border-[#DFE1E6] pb-3">
              <h2 className="text-xl font-normal text-[#0F1B2D]">Submit New Request</h2>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="text-[#5E6C84] hover:text-[#0F1B2D] text-lg font-bold"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleSubmitRequest} className="space-y-4">
              <div className="space-y-1">
                <label htmlFor="req-title" className="label text-[#5E6C84]">Title / Purpose *</label>
                <input
                  type="text"
                  id="req-title"
                  className="input-field"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Purchase extra mineral salt, Repair fence Block B"
                  required
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="req-cat" className="label text-[#5E6C84]">Category Group *</label>
                <select
                  id="req-cat"
                  className="input-field bg-white"
                  value={category}
                  onChange={(e) => setCategory(e.target.value as any)}
                >
                  <option value="supplies">Supplies Request</option>
                  <option value="maintenance">Maintenance Ticket</option>
                  <option value="other">Other Issue</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="req-details" className="label text-[#5E6C84]">Request Details *</label>
                <textarea
                  id="req-details"
                  className="input-field min-h-[100px] py-2"
                  value={details}
                  onChange={(e) => setDetails(e.target.value)}
                  placeholder="Explain exactly what is needed, quantity estimate, cost if known, and urgency details..."
                  required
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[#DFE1E6]">
                <button type="button" onClick={() => setModalOpen(false)} className="btn-secondary">Cancel</button>
                <button type="submit" disabled={submitting} className="btn-primary">
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
