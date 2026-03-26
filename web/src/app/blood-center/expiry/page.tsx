"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type InventoryRow = {
  id: string;
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number;
  expiry_date: string | null;
};

export default function CenterExpiryPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/center/me", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");
        setInventory(json.inventory ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ma’lumot yuklanmadi";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const now = Date.now();
  const expiring48h = inventory.filter((r) => {
    if (!r.expiry_date) return false;
    const diff = new Date(r.expiry_date).getTime() - now;
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  });

  const expiring24h = inventory.filter((r) => {
    if (!r.expiry_date) return false;
    const diff = new Date(r.expiry_date).getTime() - now;
    return diff > 0 && diff <= 24 * 60 * 60 * 1000;
  });

  const expired = inventory.filter((r) => {
    if (!r.expiry_date) return false;
    return new Date(r.expiry_date).getTime() <= now;
  });

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Expiry Monitoring</h1>
      <div className="app-card">
        <h3>Yaroqlilik nazorati</h3>
        <div className="mt-3 space-y-3 text-sm">
          <div className="rounded-lg bg-[#FFF9C4] p-3 dark:bg-yellow-950/30 dark:text-yellow-100">
            <div className="font-semibold">48 soat qolganlar (warning): {expiring48h.length} ta</div>
            <div className="mt-2 space-y-1">
              {expiring48h.slice(0, 5).map((item) => (
                <div key={item.id}>{item.blood_group}{item.rh} · {item.component} · {item.quantity} birlik</div>
              ))}
            </div>
          </div>
          <div className="rounded-lg bg-[#FFCDD2] p-3 dark:bg-red-950/30 dark:text-red-100">
            <div className="rounded-lg bg-[#FFCDD2] p-3 dark:bg-red-950/30 dark:text-red-100">
              <div className="font-semibold">24 soat qolganlar (critical): {expiring24h.length} ta</div>
              <div className="mt-2 space-y-1">
                {expiring24h.slice(0, 5).map((item) => (
                  <div key={item.id}>{item.blood_group}{item.rh} · {item.component} · {item.quantity} birlik</div>
                ))}
              </div>
            </div>
          </div>
          {expired.length > 0 && (
            <div className="rounded-lg bg-red-100 p-3 dark:bg-red-950/50 dark:text-red-200">
              <div className="font-semibold">Muddati tugaganlar: {expired.length} ta</div>
              <div className="mt-2 space-y-1">
                {expired.slice(0, 5).map((item) => (
                  <div key={item.id}>{item.blood_group}{item.rh} · {item.component} · {item.quantity} birlik</div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
