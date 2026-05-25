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
  const [showPassword, setShowPassword] = useState(false);

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
    <div className="flex min-h-[80vh] items-center justify-center relative px-4 py-8">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/6 rounded-full blur-[120px] pointer-events-none" />

      <div className="glass-panel corner-bracket scanline noise-overlay w-full max-w-md p-8 relative z-10 animate-fade-up">
        {/* Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 rounded font-mono text-[9px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          SECURE_LINK
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase mb-3">
            AUTH / REGISTER
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight">Create account</h2>
          <p className="text-slate-500 text-sm mt-1">Join the network — pending admin approval</p>
        </div>

        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-red-500/8 border border-red-500/20 text-red-400 rounded text-xs font-mono animate-fade-up">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="min. 6 characters"
                className="input-emerald font-mono text-sm pr-10"
                value={formData.password}
                onChange={handleChange}
                required
                minLength="6"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-emerald-400 transition-colors focus:outline-none cursor-pointer"
              >
                {showPassword ? (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.815 7.815 3 3m-3-3-3.671-3.671m0-3.955a3 3 0 0 0-4.243-4.243m0 6.072 3.671 3.671m-3.671-3.671a3 3 0 0 1-3.671-3.671" />
                  </svg>
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
                  </svg>
                )}
              </button>
            </div>
          </div>

          <button type="submit" className="btn-emerald w-full py-3 mt-2" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Creating Account...</span>
              </span>
            ) : (
              "Create Account →"
            )}
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
