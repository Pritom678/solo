"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../../lib/axios";
import Link from "next/link";

export default function SubmitProject() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    revenue: "",
    deadline: "",
  });
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file.");
        setFile(null);
        e.target.value = null;
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be under 10MB.");
        setFile(null);
        e.target.value = null;
        return;
      }
      setError("");
      setFile(selectedFile);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const data = new FormData();
    data.append("title", formData.title);
    data.append("description", formData.description);
    data.append("revenue", formData.revenue);
    data.append("deadline", formData.deadline);
    if (file) {
      data.append("pdf", file);
    }

    try {
      await axiosInstance.post("/projects", data, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      router.push("/dashboard");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit project");
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto w-full pt-8 relative z-10">
      <div className="mb-8">
        <Link href="/dashboard" className="text-emerald-500 hover:text-emerald-400 text-sm flex items-center gap-2 mb-4">
          &larr; Back to Dashboard
        </Link>
        <h1 className="text-4xl font-black mb-2 text-white">Submit Project</h1>
        <p className="text-gray-400 font-medium">Create a new project for admin approval.</p>
      </div>

      {error && <div className="p-4 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm">{error}</div>}

      <div className="glass-panel p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Title</label>
            <input type="text" name="title" className="input-emerald" value={formData.title} onChange={handleChange} required />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Description</label>
            <textarea name="description" rows="3" className="input-emerald" value={formData.description} onChange={handleChange} required />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Total Revenue ($)</label>
              <input type="number" name="revenue" min="0" step="0.01" className="input-emerald" value={formData.revenue} onChange={handleChange} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">Requested Deadline</label>
              <input type="date" name="deadline" className="input-emerald" value={formData.deadline} onChange={handleChange} required />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Project Proposal (PDF)</label>
            <input
              type="file"
              accept=".pdf"
              onChange={handleFileChange}
              className="block w-full text-sm text-gray-400
                file:mr-4 file:py-2.5 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-emerald-500/10 file:text-emerald-400
                hover:file:bg-emerald-500/20 file:transition-colors cursor-pointer"
            />
          </div>

          <button type="submit" className="btn-emerald w-full py-4 mt-4" disabled={loading}>
            {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : "Submit for Approval"}
          </button>
        </form>
      </div>
    </div>
  );
}
