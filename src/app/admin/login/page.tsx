import type { Metadata } from "next";
import AdminLoginPageClient from "@/components/admin/AdminLoginPageClient";

export const metadata: Metadata = {
  title: "后台登录",
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLoginPage() {
  return <AdminLoginPageClient />;
}
