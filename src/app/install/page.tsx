import type { Metadata } from "next";
import { redirect } from "next/navigation";
import InstallPageClient from "@/components/install/InstallPageClient";
import { isInstalled } from "@/lib/install";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "安装 Memoir",
  robots: {
    index: false,
    follow: false,
  },
};

export default function InstallPage() {
  if (isInstalled()) {
    redirect("/");
  }

  return <InstallPageClient />;
}
