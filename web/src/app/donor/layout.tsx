import LogoutButton from "@/components/auth/LogoutButton";
import SidebarNav from "@/components/ui/SidebarNav";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireAuth";

export default async function DonorLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (user.role !== "donor") redirect("/");

  return (
    <div className="app-shell">
      <header className="app-topbar sticky top-0 z-10 bg-blue-500/60 backdrop-blur-xl shadow-lg">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-400 shadow-md" />
            <div>
              <div className="text-sm font-semibold text-white drop-shadow">Donor Workspace</div>
              <div className="text-xs text-blue-100 drop-shadow">Shaxsiy panel</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="app-card h-fit">
          <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Donor Menyu</div>
          <SidebarNav
            items={[
              { href: "/donor", label: "Dashboard", icon: "home" },
              { href: "/donor/health", label: "Salomatlik", icon: "health" },
              { href: "/donor/booking", label: "Booking", icon: "award" },
              { href: "/donor/map", label: "Xarita", icon: "map" },
              { href: "/donor/rewards", label: "Bonuslar", icon: "rewards" },
              { href: "/donor/profile", label: "Qon analizi", icon: "profile" },
              { href: "/donor/settings", label: "Sozlamalar", icon: "settings" },
              { href: "/login", label: "Chiqish", icon: "logout" },
            ]}
          />
        </aside>
        <section className="space-y-4">
          {/* ...existing code... */}
          {children}
        </section>
      </main>
    </div>
  );
}

