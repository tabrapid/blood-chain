"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

type NavItem = { href: string; label: string };

export default function SidebarNav({ items }: { items: NavItem[] }) {
  const pathname = usePathname();
  const mounted = useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false
  );

  if (!mounted) {
    return <nav className="space-y-2" aria-hidden />;
  }

  return (
    <nav className="space-y-2">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block rounded-xl px-3 py-2 text-sm font-medium transition ${
              active
                ? "bg-[linear-gradient(135deg,#ffe1e6,#fff)] text-[#b91c33] shadow-sm dark:bg-[linear-gradient(135deg,rgba(136,19,55,0.45),rgba(15,23,42,0.7))] dark:text-rose-200"
                : "text-slate-700 hover:bg-white/70 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
