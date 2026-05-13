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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await axiosInstance.post("/api/auth/login", formData);
      const user = res.data;
      if (user.status === "pending") {
        setError("Your account is currently pending admin approval.");
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
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-emerald-600/10 rounded-full blur-[100px] pointer-events-none"></div>
      
      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-center text-white">Welcome Back</h2>
        <p className="text-gray-400 text-center mb-8">Sign in to your premium dashboard</p>
        
        {successMessage && <div className="p-3 mb-6 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 rounded-lg text-sm text-center">{successMessage}</div>}
        {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
            <input 
              type="email" name="email" placeholder="john@example.com" 
              className="input-emerald" 
              value={formData.email} onChange={handleChange} required 
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Password</label>
            <input 
              type="password" name="password" placeholder="••••••••" 
              className="input-emerald" 
              value={formData.password} onChange={handleChange} required 
            />
          </div>

          <button type="submit" className="btn-emerald w-full mt-6 py-3" disabled={loading}>
            {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : "Log In"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Don't have an account? <Link href="/signup" className="text-emerald-400 hover:text-emerald-300 transition-colors ml-1 font-medium">Sign up here</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="flex min-h-[80vh] items-center justify-center"><div className="w-8 h-8 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div></div>}>
      <LoginForm />
    </Suspense>
  );
}
