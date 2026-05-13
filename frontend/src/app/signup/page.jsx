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

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await axiosInstance.post("/api/auth/signup", formData);
      router.push("/login?message=Account created. Please wait for admin approval.");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] items-center justify-center relative">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-600/10 rounded-full blur-[120px] pointer-events-none"></div>

      <div className="glass-panel w-full max-w-md p-8 relative z-10">
        <h2 className="text-3xl font-bold mb-2 text-center text-white">Create Account</h2>
        <p className="text-gray-400 text-center mb-8">Join the exclusive network</p>
        
        {error && <div className="p-3 mb-6 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm text-center">{error}</div>}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">Full Name</label>
            <input 
              type="text" name="fullName" placeholder="John Doe" 
              className="input-emerald" 
              value={formData.fullName} onChange={handleChange} required 
            />
          </div>

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
              value={formData.password} onChange={handleChange} required minLength="6"
            />
          </div>

          <button type="submit" className="btn-emerald w-full mt-6 py-3" disabled={loading}>
            {loading ? <span className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin"></span> : "Sign Up"}
          </button>
        </form>

        <div className="text-center mt-6 text-sm text-gray-400">
          Already have an account? <Link href="/login" className="text-emerald-400 hover:text-emerald-300 transition-colors ml-1 font-medium">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
