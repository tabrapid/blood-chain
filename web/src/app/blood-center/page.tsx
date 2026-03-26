"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

type InventoryRow = {
  id: string;
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number;
  expiry_date: string | null;
};

type EmergencyRow = {
  id: string;
  hospital_id: string | null;
  center_id: string | null;
  status: string;
  donor_approved: boolean;
  delivery_status: string;
  delivery_eta_demo_minutes: number | null;
  blood_group: string | null;
  component: string | null;
  quantity: number | null;
};

type LeaderRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  total_donated_liters: number;
  points: number;
};

type QueueRow = {
  id: string;
  donor_id: string;
  slot_time: string;
  status: string;
  donor_name: string;
  blood_group: string | null;
  rh: string | null;
};

export default function BloodCenterDashboard() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [claimedRequests, setClaimedRequests] = useState<EmergencyRow[]>([]);
  const [unassignedRequests, setUnassignedRequests] = useState<EmergencyRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [donationQueue, setDonationQueue] = useState<QueueRow[]>([]);
  const [centerInfo, setCenterInfo] = useState<{ id: string; email: string | null; name: string | null } | null>(null);
  const [loading, setLoading] = useState(true);

  // Chart data calculations must be after inventory is defined
  const bloodGroupData = inventory.reduce((acc, item) => {
    const key = `${item.blood_group}${item.rh || ""}`;
    acc[key] = (acc[key] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(bloodGroupData).map(([group, qty]) => ({ group, qty }));

  const componentData = inventory.reduce((acc, item) => {
    acc[item.component] = (acc[item.component] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(componentData).map(([component, qty]) => ({ name: component, value: qty }));

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  // QR scan demo (UI)
  const [scanBloodGroup, setScanBloodGroup] = useState("O");
  const [scanRh, setScanRh] = useState("+");
  const [scanComponent, setScanComponent] = useState("whole_blood");
  const [scanQty, setScanQty] = useState(1);
  const [donateComponentBySlot, setDonateComponentBySlot] = useState<Record<string, string>>({});
  const [donateQtyBySlot, setDonateQtyBySlot] = useState<Record<string, number>>({});

  async function fetchAll(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const res = await fetch("/api/center/me", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");

      setCenterInfo(json?.center ?? null);
      setInventory(json.inventory ?? []);
      setClaimedRequests(json.claimed_requests ?? []);
      setUnassignedRequests(json.unassigned_requests ?? []);
      setLeaderboard(json.leaderboard ?? []);
      setDonationQueue(json.donation_queue ?? []);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Ma’lumot yuklanmadi";
      toast.error(message);
    } finally {
      if (showLoader) setLoading(false);
    }
  }

  useEffect(() => {
    fetchAll(true);
    const onFocus = () => {
      if (document.visibilityState === "visible") fetchAll(false);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, []);

  async function claimRequest(reqId: string) {
    try {
      const res = await fetch("/api/center/emergency/claim", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: reqId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Claim xatoligi");
      toast.success("Request claim qilindi.");
      await fetchAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Claim xatoligi";
      toast.error(message);
    }
  }

  async function startDelivery(req: EmergencyRow) {
    try {
      const res = await fetch("/api/center/delivery/start", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: req.id }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Delivery start xatoligi");

      toast.message("Delivery boshlab yuborildi (demo).");
      await fetchAll();

      // Demo timer (client-side), finalize endpoint server-side finalize qiladi
      window.setTimeout(async () => {
        try {
          const fin = await fetch("/api/center/delivery/finalize", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ id: req.id }),
          });
          const finJson = await fin.json().catch(() => ({}));
          if (!fin.ok) throw new Error(finJson?.error ?? "Finalize xatoligi");
          toast.success("Delivered (demo).");
          await fetchAll();
        } catch (e: unknown) {
          const message = e instanceof Error ? e.message : "Finalize xatoligi";
          toast.error(message);
        }
      }, 22000);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Delivery start xatoligi";
      toast.error(message);
    }
  }

  async function simulateDonorScan() {
    try {
      const res = await fetch("/api/center/inventory/scan-demo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          blood_group: scanBloodGroup,
          rh: scanRh,
          component: scanComponent,
          quantity: scanQty,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "QR scan xatoligi");
      toast.success("QR scan demo: inventory updated.");
      await fetchAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "QR scan xatoligi";
      toast.error(message);
    }
  }

  async function completeDonation(slot: QueueRow) {
    try {
      const component = donateComponentBySlot[slot.id] ?? "whole_blood";
      const quantity = donateQtyBySlot[slot.id] ?? 1;
      const res = await fetch("/api/center/donations/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slot_id: slot.id,
          component,
          quantity,
          blood_group: slot.blood_group ?? "O",
          rh: slot.rh ?? "+",
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Donated xatoligi");
      toast.success("Donation yakunlandi, inventory va donor statistikasi yangilandi.");
      await fetchAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Donated xatoligi";
      toast.error(message);
    }
  }

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-800" />
      </div>
    );
  }

  const totalUnits = inventory.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const expiringSoon = inventory.filter((r) => {
    if (!r.expiry_date) return false;
    const diff = new Date(r.expiry_date).getTime() - Date.now();
    return diff > 0 && diff <= 48 * 60 * 60 * 1000;
  });

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-fuchsia-100 bg-gradient-to-r from-fuchsia-700 via-purple-600 to-rose-600 p-5 text-white shadow-lg dark:border-fuchsia-900">
        <div className="text-xl font-semibold">🧑‍💼 Qon markazi boshqaruv paneli</div>
        {centerInfo ? (
          <div className="mt-1 text-sm text-white/90">
            Siz kirgan markaz: <span className="font-semibold">{centerInfo.name ?? "Center"}</span> · <span className="font-mono">{centerInfo.id.slice(0, 8)}</span>
          </div>
        ) : null}
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
          <div className="rounded-xl bg-white/95 px-3 py-2 text-fuchsia-700">Donorlar: {leaderboard.length}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-fuchsia-700">Bugungi navbat: {donationQueue.length}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-fuchsia-700">Zaxira birlik: {totalUnits}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-fuchsia-700">SOS: {unassignedRequests.length + claimedRequests.length}</div>
        </div>
      </section>

      {/* Inventory Charts */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold mb-2">Qon guruhi bo'yicha zaxira</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold mb-2">Komponent bo'yicha taqsimot</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Total units</h3>
          <div className="mt-3 text-2xl font-semibold">{totalUnits}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Inventory total quantity (demo).</p>

          <div className="mt-4 rounded-xl bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
            <div className="font-medium">Critical alerts / SOS</div>
            <div className="mt-2 text-zinc-600 dark:text-zinc-300">
              {unassignedRequests.length ? `${unassignedRequests.length} ta yangi SOS/Request` : "Hozircha critical emas."}
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900 md:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Emergency Requests</h3>

          <div className="mt-3">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Unassigned (claim)</div>
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {unassignedRequests.length ? (
                unassignedRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">{r.blood_group} · {r.component}</div>
                        <div className="mt-1 text-zinc-600 dark:text-zinc-300">Qty: {r.quantity ?? "-"}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => claimRequest(r.id)}
                        className="rounded-xl bg-zinc-900 px-3 py-2 text-sm text-white hover:bg-zinc-800"
                      >
                        Claim
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Hozircha unassigned request yo‘q.</div>
              )}
            </div>
          </div>

          <div className="mt-5">
            <div className="text-sm font-medium text-zinc-700 dark:text-zinc-200">Claimed (tracking)</div>
            <div className="mt-2 max-h-64 space-y-2 overflow-y-auto">
              {claimedRequests.length ? (
                claimedRequests.map((r) => (
                  <div key={r.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-sm">
                        <div className="font-medium">{r.blood_group} · {r.component}</div>
                        <div className="mt-1 text-zinc-600 dark:text-zinc-300">
                          Status: {r.delivery_status} · ETA demo: {r.delivery_eta_demo_minutes ?? 0} min
                        </div>
                      </div>
                      {r.delivery_status === "pending" && (
                        <button
                          type="button"
                          onClick={() => startDelivery(r)}
                          className="rounded-xl bg-emerald-600 px-3 py-2 text-sm text-white hover:bg-emerald-700"
                        >
                          Start delivery
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-zinc-600 dark:text-zinc-300">Claimed request yo‘q.</div>
              )}
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Donor navbati (center queue)</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {donationQueue.length ? (
            donationQueue.map((q) => (
              <div key={q.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm">
                    <div className="font-medium">{q.donor_name}</div>
                    <div className="text-zinc-600 dark:text-zinc-300">
                      {q.blood_group ?? "-"}
                      {q.rh ?? ""} · slot: {new Date(q.slot_time).toLocaleString("uz-UZ")} · {q.status}
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <select
                      value={donateComponentBySlot[q.id] ?? "whole_blood"}
                      onChange={(e) => setDonateComponentBySlot((p) => ({ ...p, [q.id]: e.target.value }))}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    >
                      <option value="whole_blood">whole_blood</option>
                      <option value="red_cells">red_cells</option>
                      <option value="platelets">platelets</option>
                      <option value="plasma">plasma</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={donateQtyBySlot[q.id] ?? 1}
                      onChange={(e) => setDonateQtyBySlot((p) => ({ ...p, [q.id]: Number(e.target.value) }))}
                      className="rounded-lg border border-zinc-200 px-2 py-1 text-sm dark:border-zinc-700 dark:bg-zinc-900"
                    />
                    <button
                      type="button"
                      onClick={() => completeDonation(q)}
                      className="rounded-lg bg-emerald-600 px-3 py-1 text-sm text-white hover:bg-emerald-700"
                    >
                      Donated
                    </button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Hozircha donor navbati yo&apos;q.</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Inventory</h3>
          <div className="mt-3 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="text-xs text-zinc-500">
                  <th className="py-2">Group</th>
                  <th className="py-2">Rh</th>
                  <th className="py-2">Component</th>
                  <th className="py-2">Quantity</th>
                </tr>
              </thead>
              <tbody>
                {inventory.length ? (
                  inventory.map((r) => (
                    <tr key={r.id} className="border-t border-zinc-200 dark:border-zinc-800">
                      <td className="py-2 font-medium">{r.blood_group}</td>
                      <td className="py-2">{r.rh}</td>
                      <td className="py-2">{r.component}</td>
                      <td className="py-2 font-semibold">{r.quantity}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4} className="py-4 text-zinc-600 dark:text-zinc-300">
                      Inventory yo‘q (QR scan demo bilan qo‘shishingiz mumkin).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 rounded-xl bg-zinc-50 p-4 dark:bg-zinc-800">
            <h4 className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">Donor QR scan (demo)</h4>
            <div className="mt-3 grid gap-3 sm:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Group</label>
                <select value={scanBloodGroup} onChange={(e) => setScanBloodGroup(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="O">O</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Rh</label>
                <select value={scanRh} onChange={(e) => setScanRh(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Component</label>
                <select value={scanComponent} onChange={(e) => setScanComponent(e.target.value)} className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950">
                  <option value="whole_blood">whole_blood</option>
                  <option value="red_cells">red_cells</option>
                  <option value="platelets">platelets</option>
                  <option value="plasma">plasma</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-zinc-600">Qty</label>
                <input
                  type="number"
                  min={1}
                  value={scanQty}
                  onChange={(e) => setScanQty(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
              </div>
            </div>
            <button
              type="button"
              onClick={simulateDonorScan}
              className="mt-3 flex h-11 w-full items-center justify-center rounded-xl bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-100"
            >
              Scan & update stock
            </button>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Leaderboard</h3>
          <div className="mt-3 space-y-2">
            {leaderboard.length ? (
              leaderboard.map((d, idx) => (
                <div key={d.id} className="flex items-center justify-between gap-3 rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="text-sm">
                    <div className="font-medium">
                      #{idx + 1} {d.first_name ?? "Donor"} {d.last_name ?? ""}
                    </div>
                    <div className="text-xs text-zinc-500">{d.total_donated_liters ?? 0} L donated</div>
                  </div>
                  <div className="text-sm font-semibold">{d.points ?? 0}</div>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">Hozircha top donorlar yo‘q.</div>
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">⏳ Expiry monitoring</h3>
          <div className="mt-3 space-y-2 text-sm">
            {expiringSoon.length ? (
              expiringSoon.slice(0, 6).map((item) => {
                const hours = Math.max(1, Math.round((new Date(item.expiry_date ?? "").getTime() - Date.now()) / 3600000));
                return (
                  <div key={item.id} className={`rounded-lg p-2 ${hours <= 24 ? "bg-rose-100 text-rose-700 dark:bg-rose-950/40" : "bg-amber-100 text-amber-700 dark:bg-amber-950/40"}`}>
                    {item.blood_group}
                    {item.rh ?? ""} · {item.component} · {hours} soat
                  </div>
                );
              })
            ) : (
              <div>48 soat ichida tugaydigan mahsulot yo&apos;q.</div>
            )}
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">👥 Donor management</h3>
          <div className="mt-3 rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800">
            Filterlar: qon guruhi, faol donorlar, vaqtinchalik blok list (UI demo).
          </div>
          <div className="mt-3 text-sm">Faol donorlar: {leaderboard.length} ta</div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">📈 Analytics & AI</h3>
          <div className="mt-3 rounded-lg bg-fuchsia-50 p-3 text-sm dark:bg-fuchsia-950/30">
            AI tavsiya: Avgust oyida O- va platelets zaxirasini oldindan oshiring.
          </div>
          <button className="mt-3 w-full rounded-lg border px-3 py-2 text-sm">Auto report (PDF/Excel) demo</button>
        </div>
      </section>
    </div>
  );
}

