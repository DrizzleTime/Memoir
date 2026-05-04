"use client";

import { Suspense, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { PageFooter, PageMain, PageTransition, TopLoadingBar } from "@/components/ui";
import { VisitTracker } from "@/components/VisitTracker";

interface RootLayoutShellProps {
  children: ReactNode;
  siteName: string;
}

export function RootLayoutShell({ children, siteName }: RootLayoutShellProps) {
  const pathname = usePathname();
  const isInstallPage = pathname === "/install";
  const isAdminPage = pathname === "/admin" || pathname.startsWith("/admin/");

  return (
    <>
      <Suspense fallback={null}>
        <TopLoadingBar />
      </Suspense>
      <Suspense fallback={null}>
        <VisitTracker />
      </Suspense>
      {isInstallPage || isAdminPage ? (
        children
      ) : (
        <>
          <PageMain>
            <Suspense fallback={children}>
              <PageTransition>{children}</PageTransition>
            </Suspense>
          </PageMain>
          <PageFooter>
            © {new Date().getFullYear()} {siteName} ·{" "}
            <Link
              href="/feed"
              className="rounded-[2px] transition-colors hover:text-sky-700 focus-visible:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-sky-700"
            >
              Feed
            </Link>
          </PageFooter>
        </>
      )}
    </>
  );
}
