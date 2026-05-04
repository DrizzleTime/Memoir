import type { Metadata } from "next";
import { redirect } from "next/navigation";
import AdminLayoutShell from "@/components/admin/AdminLayoutShell";
import { isInstalled } from "@/lib/install";

export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
    googleBot: {
      index: false,
      follow: false,
    },
  },
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isInstalled()) {
    redirect("/install");
  }

  return <AdminLayoutShell>{children}</AdminLayoutShell>;
}
