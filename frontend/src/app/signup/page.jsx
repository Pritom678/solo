"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "../../lib/axios";
import Link from "next/link";

export default function SignupPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ fullName: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await axiosInstance.post("/api/auth/signup", formData);
      router.push("/login?message=Account created. Awaiting admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel corner-bracket w-full max-w-md p-8 relative z-10 animate-fade-up">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase mb-3">
            AUTH / REGISTER
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight">Create account</h2>
          <p className="text-slate-500 text-sm mt-1">Join the network — pending admin approval</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-red-500/8 border border-red-500/20 text-red-400 rounded text-xs font-mono">
            <span className="mt-0.5">✗</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Full Name
            </label>
            <input
              type="text" name="fullName" placeholder="John Doe"
              className="input-emerald font-mono text-sm"
              value={formData.fullName} onChange={handleChange} required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Email Address
            </label>
            <input
              type="email" name="email" placeholder="you@example.com"
              className="input-emerald font-mono text-sm"
              value={formData.email} onChange={handleChange} required
            />
          </div>

          <div>
            <label className="block text-[10px] font-mono font-bold text-slate-500 uppercase tracking-widest mb-1.5">
              Password
            </label>
            <input
              type="password" name="password" placeholder="min. 6 characters"
              className="input-emerald font-mono text-sm"
              value={formData.password} onChange={handleChange} required minLength="6"
            />
          </div>

          <button type="submit" className="btn-emerald w-full py-3 mt-2" disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : "Create Account →"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-600 font-mono">
          Already registered?{" "}
          <Link href="/login" className="text-emerald-500 hover:text-emerald-400 transition-colors">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  );
}
