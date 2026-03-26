"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type Center = {
  id: string;
  name: string | null;
  region: string | null;
  address: string | null;
  distance_km: number;
  queue_load: number;
  rating: number;
};

export default function DonorMapPage() {
  const [centers, setCenters] = useState<Center[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/donor/centers", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");
        setCenters(json.centers ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ma’lumot yuklanmadi";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Xarita</h1>
      <div className="app-card">
        <h3>Yaqin markazlar</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">Jonli bandlik darajasi va navigatsiya bu sahifada ko&apos;rinadi.</p>
        <div className="mt-4 max-h-64 overflow-y-auto space-y-3">
          {centers.map((c) => (
            <div key={c.id} className="rounded-xl bg-[#E3F2FD] p-4 text-sm dark:bg-blue-950/30 dark:text-blue-100">
              <div className="font-medium">{c.name ?? "Noma’lum"}</div>
              <div className="text-xs text-zinc-600 dark:text-zinc-300">{c.region ?? ""} · {c.address ?? ""}</div>
              <div className="mt-1 flex justify-between text-xs">
                <span>{c.distance_km} km · Navbat: {c.queue_load}</span>
                <span>⭐ {c.rating.toFixed(1)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
