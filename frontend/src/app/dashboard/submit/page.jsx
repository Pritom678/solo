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
    <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] py-10 relative z-10 w-full">
      <div className="max-w-2xl w-full mx-auto">
        {/* Back + header */}
        <div className="mb-8 text-center sm:text-left flex flex-col sm:items-start items-center">
          <Link href="/dashboard" className="inline-flex items-center gap-1.5 text-[10px] font-mono text-slate-400 hover:text-emerald-400 transition-all uppercase tracking-widest mb-6 border border-white/10 hover:border-emerald-500/30 px-3 py-1.5 rounded-full bg-white/[0.02] hover:bg-emerald-500/5">
            ← Back to Dashboard
          </Link>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[10px] font-mono text-emerald-500/70 tracking-widest uppercase">Projects / New</p>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight">Submit Project<span className="text-emerald-400">.</span></h1>
          <p className="text-slate-400 text-sm mt-3 font-medium max-w-md text-center sm:text-left leading-relaxed">
            Submit your project details and optional proposal PDF for administrative review.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-3 p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-xs font-mono backdrop-blur-sm animate-fade-up">
            <span className="mt-0.5 w-4 h-4 bg-red-500/20 flex items-center justify-center rounded-full text-[10px] flex-shrink-0">✗</span> 
            <span>{error}</span>
          </div>
        )}

        <div className="glass-panel corner-bracket p-8 sm:p-10 relative overflow-hidden shadow-2xl shadow-emerald-900/10">
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
          <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-64 h-64 bg-blue-500/10 blur-[80px] rounded-full pointer-events-none" />

          <form onSubmit={handleSubmit} className="space-y-7 relative z-10">

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                Project Title <span className="text-emerald-500">*</span>
              </label>
              <input type="text" name="title" className="input-emerald text-sm py-3 px-4 w-full" value={formData.title} onChange={handleChange} required placeholder="e.g. Brand Identity Redesign" />
            </div>

            <div>
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                Description <span className="text-emerald-500">*</span>
              </label>
              <textarea name="description" rows="4" className="input-emerald text-sm py-3 px-4 w-full resize-none" value={formData.description} onChange={handleChange} required placeholder="Describe the project scope, deliverables, and any specific requirements..." />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Total Revenue ($) <span className="text-emerald-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-mono text-sm">$</span>
                  <input type="number" name="revenue" min="0" step="0.01" className="input-emerald font-mono text-sm py-3 pl-8 pr-4 w-full" value={formData.revenue} onChange={handleChange} required placeholder="0.00" />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                  Deadline <span className="text-emerald-500">*</span>
                </label>
                <input type="date" name="deadline" className="input-emerald font-mono text-sm py-3 px-4 w-full" value={formData.deadline} onChange={handleChange} required />
              </div>
            </div>

            {/* File upload */}
            <div className="pt-2">
              <label className="block text-[10px] font-mono font-bold text-slate-400 uppercase tracking-widest mb-2">
                Proposal PDF <span className="text-slate-500 normal-case font-normal ml-1 border border-white/10 rounded px-1.5 py-0.5 bg-white/[0.02]">Optional, Max 10 MB</span>
              </label>
              <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all duration-300 group ${
                file
                  ? "border-emerald-500/40 bg-emerald-500/[0.08] shadow-[0_0_20px_rgba(16,185,129,0.1)]"
                  : "border-dashed border-white/10 bg-white/[0.01] hover:border-emerald-500/40 hover:bg-emerald-500/[0.04]"
              }`}>
                <div className={`w-12 h-12 rounded-lg flex items-center justify-center flex-shrink-0 transition-colors ${
                  file ? "bg-red-500/15 border border-red-500/30 text-red-400" : "bg-white/5 border border-white/10 text-slate-400 group-hover:text-emerald-400 group-hover:bg-emerald-500/10 group-hover:border-emerald-500/30"
                }`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  {file ? (
                    <>
                      <p className="text-emerald-400 text-sm font-mono font-bold truncate">{file.name}</p>
                      <p className="text-slate-500 text-[10px] font-mono mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB · Ready to upload</p>
                    </>
                  ) : (
                    <>
                      <p className="text-slate-300 text-sm font-medium group-hover:text-emerald-300 transition-colors">Click to upload or drag and drop</p>
                      <p className="text-slate-500 text-[10px] font-mono mt-1">PDF documents only</p>
                    </>
                  )}
                </div>
                {file && (
                  <button type="button" onClick={(e) => { e.preventDefault(); setFile(null); }}
                    className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-red-500/20 text-slate-500 hover:text-red-400 transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
                <input type="file" accept=".pdf" onChange={handleFileChange} className="hidden" />
              </label>
            </div>

            <div className="pt-4">
              <button type="submit" className="btn-emerald w-full py-4 text-sm font-bold tracking-wider hover:-translate-y-1 shadow-[0_0_30px_rgba(16,185,129,0.15)] hover:shadow-[0_0_40px_rgba(16,185,129,0.3)] transition-all duration-300 rounded-lg flex items-center justify-center gap-2" disabled={loading}>
                {loading ? (
                  <>
                    <span className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" />
                    <span>Submitting...</span>
                  </>
                ) : (
                  <>
                    <span>Submit Project for Review</span>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
