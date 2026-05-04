"use client";

import React, { createContext, useContext, useCallback, useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import type { UserResponse } from "@/types";
import {
  clearStoredAdminSession,
  getStoredAdminToken,
  getStoredAdminUser,
  setStoredAdminSession,
} from "@/lib/admin-session";

interface AdminAuthContextType {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthContextType | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const storedToken = getStoredAdminToken();
    const storedUser = getStoredAdminUser();
    
    queueMicrotask(() => {
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(storedUser);
      }
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    if (!isLoading && !token && pathname !== "/admin/login") {
      router.push("/admin/login");
    }
  }, [isLoading, token, pathname, router]);

  const login = useCallback(async (username: string, password: string) => {
    const response = await fetch("/api/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "login", username, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "登录失败");
    }

    const data = await response.json();
    const accessToken = data.access_token;
    const userData = data.user;

    setStoredAdminSession(accessToken, userData);
    setToken(accessToken);
    setUser(userData);

    router.push("/admin");
  }, [router]);

  const logout = useCallback(() => {
    clearStoredAdminSession();
    setToken(null);
    setUser(null);
    router.push("/admin/login");
  }, [router]);

  return (
    <AdminAuthContext.Provider value={{ user, token, isLoading, login, logout }}>
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within AdminAuthProvider");
  }
  return context;
}

export function useAuthFetch() {
  const { token, logout } = useAdminAuth();

  return useCallback(
    async (url: string, options: RequestInit = {}) => {
      const headers = new Headers(options.headers);
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }

      const response = await fetch(url, { ...options, headers });

      if (response.status === 401) {
        logout();
        throw new Error("登录已过期，请重新登录");
      }

      return response;
    },
    [token, logout]
  );
}
