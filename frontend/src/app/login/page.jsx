"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import axiosInstance from "../../lib/axios";
import Link from "next/link";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const successMessage = searchParams.get("message");

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [checking, setChecking] = useState(true);

  // Redirect already-logged-in users
  useEffect(() => {
    axiosInstance.get("/api/auth/me")
      .then((res) => {
        const u = res.data;
        if (u?.status === "approved") {
          router.replace(u.role === "admin" ? "/admin" : "/dashboard");
        } else {
          setChecking(false);
        }
      })
      .catch(() => setChecking(false));
  }, [router]);

  if (checking) return (
    <div className="flex min-h-[80vh] items-center justify-center">
      <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
    </div>
  );

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axiosInstance.post("/api/auth/login", formData);
      const user = res.data;
      if (user.status === "pending") {
        setError("Your account is pending admin approval.");
      } else if (user.role === "admin") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (err) {
      setError(err.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center relative">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-panel corner-bracket w-full max-w-md p-8 relative z-10 animate-fade-up">

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase mb-3">
            AUTH / SIGN_IN
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Access your command center</p>
        </div>

        {successMessage && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 rounded text-xs font-mono">
            <span className="mt-0.5">✓</span> {successMessage}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-red-500/8 border border-red-500/20 text-red-400 rounded text-xs font-mono">
            <span className="mt-0.5">✗</span> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
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
              type="password" name="password" placeholder="••••••••"
              className="input-emerald font-mono text-sm"
              value={formData.password} onChange={handleChange} required
            />
          </div>

          <button type="submit" className="btn-emerald w-full py-3 mt-2" disabled={loading}>
            {loading
              ? <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
              : "Authenticate →"}
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/5 text-center text-xs text-slate-600 font-mono">
          No account?{" "}
          <Link href="/signup" className="text-emerald-500 hover:text-emerald-400 transition-colors">
            Request access
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[80vh] items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    }>
      <LoginForm />
    </Suspense>
  );
}
