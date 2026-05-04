"use client";

import { useMemo } from "react";
import { RawImg } from "./RawImg";
import { md5 } from "@/lib/md5";

interface AvatarProps {
  email?: string | null;
  name?: string | null;
  size?: number;
}

export function Avatar({ email, name, size = 40 }: AvatarProps) {
  const avatarUrl = useMemo(() => {
    if (email) {
      const hash = md5(email.toLowerCase().trim());
      return `https://cn.cravatar.com/avatar/${hash}?d=identicon&s=${size * 2}`;
    }
    const seed = encodeURIComponent(name || "anonymous");
    return `https://api.dicebear.com/7.x/identicon/svg?seed=${seed}&size=${size * 2}`;
  }, [email, name, size]);

  const initial = (name || email || "?")[0].toUpperCase();

  return (
    <div
      className="shrink-0 rounded bg-neutral-200 overflow-hidden flex items-center justify-center text-neutral-500 font-bold"
      style={{ width: size, height: size }}
    >
      <RawImg
        src={avatarUrl}
        alt={name || "avatar"}
        width={size}
        height={size}
        className="w-full h-full object-cover"
        onError={(e) => {
          e.currentTarget.style.display = "none";
          e.currentTarget.parentElement!.textContent = initial;
        }}
      />
    </div>
  );
}
