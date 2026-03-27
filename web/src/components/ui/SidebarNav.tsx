"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";
import { Home, User, HeartPulse, Hospital, Award, Map, Settings, LogOut } from "lucide-react";

const ICONS: Record<string, JSX.Element> = {
  home: <Home className="w-5 h-5 mr-2" aria-hidden="true" />,
  profile: <User className="w-5 h-5 mr-2" aria-hidden="true" />,
  health: <HeartPulse className="w-5 h-5 mr-2" aria-hidden="true" />,
  hospital: <Hospital className="w-5 h-5 mr-2" aria-hidden="true" />,
  rewards: <Award className="w-5 h-5 mr-2" aria-hidden="true" />,
  map: <Map className="w-5 h-5 mr-2" aria-hidden="true" />,
  settings: <Settings className="w-5 h-5 mr-2" aria-hidden="true" />,
  logout: <LogOut className="w-5 h-5 mr-2" aria-hidden="true" />,
};

type NavItem = { href: string; label: string; icon?: keyof typeof ICONS };

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
    <nav className="space-y-2" aria-label="Sidebar navigation">
      {items.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-400 focus-visible:ring-offset-2 dark:focus-visible:ring-rose-600 ${
              active
                ? "bg-gradient-to-r from-rose-100 to-white text-rose-700 shadow-sm dark:bg-gradient-to-r dark:from-rose-900/40 dark:to-zinc-900 dark:text-rose-200"
                : "text-slate-700 hover:bg-slate-100 hover:text-rose-700 dark:text-slate-300 dark:hover:bg-slate-800/50 dark:hover:text-rose-200"
            }`}
          >
            {item.icon && ICONS[item.icon]}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
