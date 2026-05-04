import { redirect } from "next/navigation";
import { isInstalled } from "@/lib/install";

export function ensureInstalled() {
  if (!isInstalled()) {
    redirect("/install");
  }
}
