"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Calendar, ChartLine, LayoutDashboard, Plus, Settings, Wallet, PiggyBank } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { cn } from "@/utils/cn";

const links = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/transactions", label: "Transactions", icon: Wallet },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/forecast", label: "Forecast", icon: ChartLine },
  { href: "/wishlist", label: "Wishlist", icon: PiggyBank },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const mobileLinks = links.filter((link) => !["/transactions", "/settings"].includes(link.href));
  const leftLinks = mobileLinks.filter((link) => ["/dashboard", "/calendar"].includes(link.href));
  const rightLinks = mobileLinks.filter((link) => ["/forecast", "/wishlist"].includes(link.href));
  const allPrefetchRoutes = links.map((link) => link.href);

  useEffect(() => {
    const prefetchAll = () => {
      allPrefetchRoutes.forEach((href) => {
        if (href !== pathname) {
          router.prefetch(href);
        }
      });
    };

    if (typeof window === "undefined") {
      return;
    }

    if ("requestIdleCallback" in window) {
      const callbackId = window.requestIdleCallback(prefetchAll);
      return () => window.cancelIdleCallback(callbackId);
    }

    const timeoutId = globalThis.setTimeout(prefetchAll, 200);
    return () => globalThis.clearTimeout(timeoutId);
  }, [allPrefetchRoutes, pathname, router]);

  const handlePrefetch = (href: string) => {
    router.prefetch(href);
  };

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-3 pb-28 pt-3 sm:px-4 md:flex-row md:gap-6 md:px-6 md:pb-8 md:pt-6">
      <aside className="hidden w-72 shrink-0 md:block">
        <div className="glass-panel sticky top-6 rounded-[2rem] border border-border p-5">
          <div className="mb-8 space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-muted-foreground">Finance Controller</p>
            <h2 className="text-2xl font-semibold tracking-tight">Control your money with less friction.</h2>
          </div>
          <nav className="space-y-2">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onMouseEnter={() => handlePrefetch(link.href)}
                onTouchStart={() => handlePrefetch(link.href)}
                className={cn(
                  "press-feedback flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition",
                  pathname === link.href ? "bg-primary text-primary-foreground shadow-lg" : "hover:bg-muted/70",
                )}
              >
                <link.icon className="h-4 w-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
      </aside>

      <div className="flex-1">
        <header className="glass-panel sticky top-3 z-20 mb-5 rounded-[1.75rem] border border-border px-4 py-4 md:static md:mb-6 md:px-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground">Personal Finance</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight md:text-3xl">Cash flow in one place.</h1>
            </div>
            <ThemeToggle />
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-1 md:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                prefetch
                onMouseEnter={() => handlePrefetch(link.href)}
                onTouchStart={() => handlePrefetch(link.href)}
                className={cn(
                  "press-feedback whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition",
                  pathname === link.href ? "bg-primary text-primary-foreground" : "bg-muted/70 text-foreground",
                )}
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-4 hidden items-center justify-between md:flex">
            <p className="text-sm text-muted-foreground">Track balances, upcoming bills, and purchase plans across every screen size.</p>
            <Link
              href="/settings"
              prefetch
              onMouseEnter={() => handlePrefetch("/settings")}
              onTouchStart={() => handlePrefetch("/settings")}
              className="press-feedback inline-flex h-11 items-center gap-2 rounded-2xl border border-border bg-card/70 px-4 text-sm font-semibold hover:bg-muted/70"
            >
              <Settings className="h-4 w-4" />
              Account
            </Link>
          </div>
        </header>
        <div className="page-grid">
          {children}
        </div>
      </div>

      <nav className="glass-panel fixed inset-x-3 bottom-3 z-30 flex items-center rounded-[1.75rem] border border-border px-2 py-2 shadow-[0_28px_60px_-28px_rgba(15,23,42,0.5)] md:hidden">
        <div className="flex min-w-0 flex-1 items-center justify-around gap-1">
          {leftLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              onMouseEnter={() => handlePrefetch(link.href)}
              onTouchStart={() => handlePrefetch(link.href)}
              className={cn(
                "press-feedback flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                pathname === link.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>

        <Link
          href="/transactions"
          prefetch
          onMouseEnter={() => handlePrefetch("/transactions")}
          onTouchStart={() => handlePrefetch("/transactions")}
          className="press-feedback mx-1 flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_18px_45px_-20px_color-mix(in_srgb,var(--primary)_90%,transparent)]"
          aria-label="Add transaction"
          title="Add transaction"
        >
          <Plus className="h-6 w-6" />
        </Link>

        <div className="flex min-w-0 flex-1 items-center justify-around gap-1">
          {rightLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              prefetch
              onMouseEnter={() => handlePrefetch(link.href)}
              onTouchStart={() => handlePrefetch(link.href)}
              className={cn(
                "press-feedback flex min-w-0 flex-col items-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium",
                pathname === link.href ? "text-primary" : "text-muted-foreground",
              )}
            >
              <link.icon className="h-4 w-4 shrink-0" />
              <span className="truncate">{link.label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </div>
  );
}
