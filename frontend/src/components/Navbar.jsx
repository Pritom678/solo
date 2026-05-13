"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import axiosInstance from "../lib/axios";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    checkUser();
  }, [pathname]); // Re-check user status when route changes

  const checkUser = async () => {
    try {
      const res = await axiosInstance.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      setUser(null);
    }
  };

  const handleLogout = async () => {
    try {
      await axiosInstance.post("/api/auth/logout");
      setUser(null);
      router.push("/login");
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <nav className="glass-panel mx-8 mt-6 mb-4 px-6 py-4 flex items-center justify-between z-50 rounded-2xl sticky top-6">
      <div className="flex-1">
        <Link href="/" className="text-2xl font-black tracking-tighter text-emerald-gradient">
          SOLO.
        </Link>
      </div>
      <div className="flex-none gap-4 items-center flex">
        {user ? (
          <>
            <Link href="/dashboard" className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors">Dashboard</Link>
            {user.role === "admin" && (
              <Link href="/admin" className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors">Admin</Link>
            )}
            <div className="h-4 w-px bg-gray-800 mx-2"></div>
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm text-emerald-400 font-bold">{user.fullName}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{user.role}</span>
            </div>
            <button onClick={handleLogout} className="btn-outline-emerald text-xs py-1.5 px-3">Sign Out</button>
          </>
        ) : (
          <>
            <Link href="/login" className="text-sm font-medium text-gray-300 hover:text-emerald-400 transition-colors">Log In</Link>
            <Link href="/signup" className="btn-emerald text-sm py-2 px-4 shadow-[0_0_15px_rgba(16,185,129,0.3)]">Sign Up</Link>
          </>
        )}
      </div>
    </nav>
  );
}
