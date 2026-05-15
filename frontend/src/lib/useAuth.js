"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axiosInstance from "./axios";

/**
 * useAuth — fetches the current user and optionally enforces a required role.
 *
 * @param {string|null} requiredRole - "admin" | "user" | null (no role check)
 * @returns {{ user: object|null, loading: boolean }}
 */
export function useAuth(requiredRole = null) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axiosInstance
      .get("/api/auth/me")
      .then((res) => {
        const fetchedUser = res.data;

        // Block pending/rejected users from protected pages
        if (fetchedUser.status === "pending" || fetchedUser.status === "rejected") {
          router.replace("/login");
          return;
        }

        // Enforce role if specified
        if (requiredRole && fetchedUser.role !== requiredRole) {
          router.replace("/dashboard");
          return;
        }

        setUser(fetchedUser);
      })
      .catch(() => {
        router.replace("/login");
      })
      .finally(() => {
        setLoading(false);
      });
  }, [router, requiredRole]);

  return { user, loading };
}
