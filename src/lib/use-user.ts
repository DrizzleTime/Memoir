"use client";

import { useState, useEffect } from "react";
import type { UserResponse } from "@/types";
import {
  clearStoredAdminSession,
  getStoredAdminToken,
  getStoredAdminUser,
} from "@/lib/admin-session";

interface UseUserResult {
  user: UserResponse | null;
  token: string | null;
  isLoading: boolean;
}

export function useUser(): UseUserResult {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      queueMicrotask(() => {
        setIsLoading(false);
      });
      return;
    }

    const storedToken = getStoredAdminToken();
    const storedUser = getStoredAdminUser();

    if (storedToken && storedUser) {
      queueMicrotask(() => {
        setUser(storedUser);
        setToken(storedToken);
      });
    } else if (storedToken || storedUser) {
      clearStoredAdminSession();
    }

    queueMicrotask(() => {
      setIsLoading(false);
    });
  }, []);

  return { user, token, isLoading };
}
