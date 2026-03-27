import LogoutButton from "@/components/auth/LogoutButton";
import SidebarNav from "@/components/ui/SidebarNav";
import { redirect } from "next/navigation";
import { requireUser } from "@/lib/auth/requireAuth";

export default async function HospitalLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const user = await requireUser();
  if (!user) redirect("/login");
  if (user.role !== "hospital") redirect("/");

  return (
    <div className="app-shell">
      <header className="app-topbar sticky top-0 z-10">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-cyan-500" />
            <div>
              <div className="text-sm font-semibold text-slate-900 dark:text-slate-100">Hospital Workspace</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Tezkor buyurtmalar paneli</div>
            </div>
          </div>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto grid w-full max-w-7xl gap-4 px-4 py-6 md:grid-cols-[260px_minmax(0,1fr)]">
        <aside className="app-card h-fit">
          <div className="mb-3 text-sm font-semibold text-slate-900 dark:text-slate-100">Hospital Menyu</div>
          <SidebarNav
            items={[
              { href: "/hospital", label: "Dashboard", icon: "home" },
              { href: "/hospital/orders", label: "Buyurtmalar", icon: "award" },
              { href: "/hospital/tracking", label: "Tracking", icon: "map" },
              { href: "/hospital/history", label: "Tarix", icon: "profile" },
              { href: "/hospital/settings", label: "Sozlamalar", icon: "settings" },
              { href: "/login", label: "Chiqish", icon: "logout" },
            ]}
          />
        </aside>
        <section className="space-y-4">{children}</section>
      </main>
    </div>
  );
}

