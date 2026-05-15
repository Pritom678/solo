"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../lib/axios";
import { useAuth } from "../../../lib/useAuth";
import Link from "next/link";

export default function SubmitProject() {
  const router = useRouter();
  const { loading: authLoading } = useAuth("user");
  const [formData, setFormData] = useState({ title: "", description: "", revenue: "", deadline: "" });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (authLoading) return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-7 h-7 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.type !== "application/pdf") {
      setError("Only PDF files are accepted.");
      e.target.value = null;
      return;
    }
    if (f.size > 10 * 1024 * 1024) {
      setError("File must be under 10 MB.");
      e.target.value = null;
      return;
    }
    setError("");
    setFile(f);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const data = new FormData();
    Object.entries(formData).forEach(([k, v]) => data.append(k, v));
    if (file) data.append("pdf", file);
    try {
      await axiosInstance.post("/projects", data, { headers: { "Content-Type": "multipart/form-data" } });
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit project");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-6 relative z-10">

      {/* Back + header */}
      <div className="mb-8">
        <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-500 hover:text-emerald-400 transition-colors uppercase tracking-widest mb-4">
          ← Back
        </Link>
        <p className="text-[10px] font-mono text-emerald-500/50 tracking-widest uppercase mb-2">Projects / New</p>
        <h1 className="text-2xl font-black text-white tracking-tight">Submit Project</h1>
        <p className="text-slate-500 text-sm mt-1">Submitted projects are reviewed before activation.</p>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 mb-6 bg-red-500/8 border border-red-500/20 text-red-400 rounded text-xs font-mono">
          <span>✗</span> {error}
        </div>
      )}

      <div className="glass-panel corner-bracket p-7">
        <form onSubmit={handleSubmit} className="space-y-5">

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Project Title</label>
            <input type="text" name="title" className="input-emerald" value={formData.title} onChange={handleChange} required placeholder="e.g. Brand Identity Redesign" />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Description</label>
            <textarea name="description" rows="3" className="input-emerald text-sm" value={formData.description} onChange={handleChange} required placeholder="Describe the project scope and deliverables..." />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Total Revenue ($)</label>
              <input type="number" name="revenue" min="0" step="0.01" className="input-emerald font-mono" value={formData.revenue} onChange={handleChange} required placeholder="0.00" />
            </div>
            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">Deadline</label>
              <input type="date" name="deadline" className="input-emerald font-mono" value={formData.deadline} onChange={handleChange} required />
            </div>
          </div>

          {/* File upload */}
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Proposal PDF <span className="text-slate-700 normal-case font-normal">(optional, max 10 MB)</span>
            </label>
            <label className={`flex items-center gap-3 p-4 rounded border cursor-pointer transition-colors ${
              file
                ? "border-emerald-500/30 bg-emerald-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-emerald-500/20 hover:bg-emerald-500/[0.03]"
            }`}>
              <div className="w-8 h-8 rounded bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-[10px] font-mono font-bold flex-shrink-0">
                PDF
              </div>
              <div className="flex-1 min-w-0">
                {file ? (
                  <>
                    <p className="text-emerald-400 text-xs font-mono font-bold truncate">{file.name}</p>
                    <p className="text-slate-600 text-[10px] font-mono">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                  </>
                ) : (
                  <>
                    <p className="text-slate-400 text-xs font-mono">Click to attach PDF</p>
                    <p className="text-slate-600 text-[10px] font-mono">PDF only · max 10 MB</p>
                  </>
                )}
              </div>
              {file && (
                <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}
                  className="text-slate-600 hover:text-red-400 transition-colors text-xs font-mono">✕</button>
              )}
              <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
            </label>
          </div>

          <button type="submit" className="btn-emerald w-full py-3 mt-2" disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : "Submit for Review →"}
          </button>
        </form>
      </div>
    </div>
  );
}
