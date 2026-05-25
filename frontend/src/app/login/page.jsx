"use client";

import { useState, useEffect, Suspense } from "react";
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
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Load remembered email on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("rememberedEmail");
    if (savedEmail) {
      setFormData((prev) => ({ ...prev, email: savedEmail }));
      setRememberMe(true);
    }
  }, []);

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
      if (rememberMe) {
        localStorage.setItem("rememberedEmail", formData.email);
      } else {
        localStorage.removeItem("rememberedEmail");
      }
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
    <div className="flex min-h-[80vh] items-center justify-center relative px-4 py-8">
      {/* Ambient */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/6 rounded-full blur-[100px] pointer-events-none" />

      <div className="glass-panel corner-bracket scanline noise-overlay w-full max-w-md p-8 relative z-10 animate-fade-up">
        {/* Status Indicator */}
        <div className="absolute top-4 right-4 flex items-center gap-1.5 px-2 py-0.5 bg-emerald-950/40 border border-emerald-500/20 rounded font-mono text-[9px] text-emerald-400">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          SECURE_LINK
        </div>

        {/* Header */}
        <div className="mb-8">
          <p className="text-[10px] font-mono text-emerald-500/60 tracking-widest uppercase mb-3">
            AUTH / SIGN_IN
          </p>
          <h2 className="text-2xl font-black text-white tracking-tight">Welcome back</h2>
          <p className="text-slate-500 text-sm mt-1">Access your command center</p>
        </div>

        {successMessage && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-emerald-500/8 border border-emerald-500/20 text-emerald-400 rounded text-xs font-mono animate-fade-up">
            <span className="mt-0.5">✓</span> {successMessage}
          </div>
        )}
        {error && (
          <div className="flex items-start gap-2 p-3 mb-6 bg-red-500/8 border border-red-500/20 text-red-400 rounded text-xs font-mono animate-fade-up">
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
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="••••••••"
                className="input-emerald font-mono text-sm pr-10"
                value={formData.password}
                onChange={handleChange}
                required
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

          {/* Remember Me & Forgot Password */}
          <div className="flex items-center justify-between text-xs font-mono pt-1">
            <label className="flex items-center gap-2 text-slate-400 hover:text-slate-300 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-3.5 h-3.5 rounded border border-emerald-500/30 bg-black/40 checked:bg-emerald-500 checked:border-emerald-500 text-emerald-500 focus:ring-0 focus:ring-offset-0 focus:outline-none transition-all duration-200 accent-emerald-500 cursor-pointer"
              />
              <span>Remember link</span>
            </label>
            <span className="text-slate-600 hover:text-emerald-500 transition-colors cursor-not-allowed select-none">
              Forgot credentials?
            </span>
          </div>

          <button type="submit" className="btn-emerald w-full py-3 mt-2" disabled={loading}>
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                <span>Decrypting credentials...</span>
              </span>
            ) : (
              "Authenticate →"
            )}
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
