
"use client";
import { useEffect, useMemo, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

// Blood center stocks chart data
// ...existing code...
import { toast } from "sonner";

type InventoryRow = {
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number;
  expiry_date: string | null;
};

type EmergencyRow = {
  id: string;
  status: string;
  donor_approved: boolean;
  delivery_status: string;
  delivery_eta_demo_minutes: number | null;
  center_id: string | null;
  donor_id: string | null;
  donor_name: string | null;
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number | null;
  created_at: string;
  updated_at: string;
};

type CenterStockRow = {
  center_id: string;
  center_name: string | null;
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number;
};

type LabIncomingRow = {
  id: string;
  donor_id: string;
  donor_name: string | null;
  donor_blood_group: string | null;
  test_type: string | null;
  scheduled_at: string;
  note: string | null;
  status: string;
  requested_at: string;
};

const TEST_TYPE_LABELS: Record<string, string> = {
  cbc: "Umumiy qon tahlili (UQT / CBC)",
  biochemistry: "Biokimyoviy qon tahlili",
  hormonal: "Gormonal tahlil",
  infection: "Infeksiyalar uchun qon tahlili",
  coagulation: "Qon ivish tizimi (koagulogramma)",
};

const TEST_FIELDS: Record<string, Array<{ key: string; label: string; type: "text" | "number" | "select"; options?: string[] }>> = {
  cbc: [
    { key: "hemoglobin", label: "Gemoglobin (g/L)", type: "number" },
    { key: "rbc", label: "Eritrotsitlar (RBC)", type: "number" },
    { key: "wbc", label: "Leykotsitlar (WBC)", type: "number" },
    { key: "plt", label: "Trombotsitlar (PLT)", type: "number" },
    { key: "esr", label: "ESR (SOE)", type: "number" },
    { key: "mcv", label: "MCV", type: "number" },
    { key: "mch", label: "MCH", type: "number" },
    { key: "mchc", label: "MCHC", type: "number" },
  ],
  biochemistry: [
    { key: "glucose", label: "Glyukoza", type: "number" },
    { key: "alt", label: "ALT", type: "number" },
    { key: "ast", label: "AST", type: "number" },
    { key: "creatinine", label: "Kreatinin", type: "number" },
    { key: "urea", label: "Mochevina", type: "number" },
    { key: "cholesterol", label: "Xolesterin", type: "number" },
    { key: "bilirubin", label: "Bilirubin", type: "number" },
  ],
  hormonal: [
    { key: "tsh", label: "TSH", type: "number" },
    { key: "t3", label: "T3", type: "number" },
    { key: "t4", label: "T4", type: "number" },
    { key: "insulin", label: "Insulin", type: "number" },
    { key: "sex_hormones", label: "Jinsiy gormonlar (izoh)", type: "text" },
  ],
  infection: [
    { key: "hiv", label: "HIV", type: "select", options: ["Negative", "Positive"] },
    { key: "hepatitis_b", label: "Gepatit B", type: "select", options: ["Negative", "Positive"] },
    { key: "hepatitis_c", label: "Gepatit C", type: "select", options: ["Negative", "Positive"] },
    { key: "syphilis", label: "Sifilis", type: "select", options: ["Negative", "Positive"] },
    { key: "bacterial_markers", label: "Bakterial markerlar", type: "text" },
    { key: "antibodies", label: "Antitanachalar", type: "text" },
  ],
  coagulation: [
    { key: "prothrombin", label: "Protrombin", type: "number" },
    { key: "inr", label: "INR", type: "number" },
    { key: "fibrinogen", label: "Fibrinogen", type: "number" },
  ],
};

export default function HospitalDashboard() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [requests, setRequests] = useState<EmergencyRow[]>([]);
  const [centerStocks, setCenterStocks] = useState<CenterStockRow[]>([]);
  const [labRequests, setLabRequests] = useState<LabIncomingRow[]>([]);
  const [loading, setLoading] = useState(true);

  const [group, setGroup] = useState("O");
  const [component, setComponent] = useState("whole_blood");
  const [quantity, setQuantity] = useState(1);
  const [selectedLabRequestId, setSelectedLabRequestId] = useState("");
  const [labSubmitting, setLabSubmitting] = useState(false);
  const [labValues, setLabValues] = useState<Record<string, string>>({});

  // Blood center stocks chart data for charts
  const centerBarData = centerStocks.reduce((acc, item) => {
    const key = `${item.center_name ?? item.center_id.slice(0, 6)}-${item.blood_group}${item.rh || ""}`;
    acc[key] = (acc[key] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const centerBarDataArr = Object.entries(centerBarData).map(([group, qty]) => ({ group, qty }));

  const centerComponentData = centerStocks.reduce((acc, item) => {
    acc[item.component] = (acc[item.component] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);
  const centerPieData = Object.entries(centerComponentData).map(([component, qty]) => ({ name: component, value: qty }));
  const CENTER_COLORS = ["#1976d2", "#388e3c", "#fbc02d", "#d32f2f"];

  function predictDemand() {
    const now = new Date();
    const month = now.getMonth() + 1;
    if (month === 8 && group === "O") return "Avgust oyida O- qonga talab 20% oshadi (demo predictor).";
    return "Yaqin oylar uchun talab normal. Kritikal guruhlar monitoring qilinadi (demo).";
  }

  async function fetchAll(showLoader = false) {
    if (showLoader) setLoading(true);
    try {
      const [res, labRes] = await Promise.all([
        fetch("/api/hospital/me", { cache: "no-store" }),
        fetch("/api/hospital/lab-requests", { cache: "no-store" }),
      ]);
      const json = await res.json();
      const labJson = await labRes.json().catch(() => ({ requests: [] }));
      if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");
      if (!labRes.ok) throw new Error(labJson?.error ?? "Lab so'rovlar yuklanmadi");
      setInventory(json.inventory ?? []);
      setRequests(json.requests ?? []);
      setCenterStocks(json.center_stocks ?? []);
      setLabRequests(labJson.requests ?? []);
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

  async function createEmergency(target: "donor" | "center") {
    try {
      const res = await fetch("/api/hospital/emergency/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blood_group: group, component, quantity, target }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Emergency request xatoligi");
      toast.success(target === "donor" ? "Donorlarga SOS yuborildi." : "Blood centerlarga request yuborildi.");
      await fetchAll();
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Emergency request xatoligi";
      toast.error(message);
    }
  }

  async function handleLabAction(action: "approve" | "reject", requestId: string) {
    setLabSubmitting(true);
    try {
      const res = await fetch("/api/hospital/lab-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, request_id: requestId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Lab request update xatoligi");
      toast.success(action === "approve" ? "So'rov tasdiqlandi" : "So'rov rad etildi");
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLabSubmitting(false);
    }
  }

  async function saveLabResult() {
    if (!selectedLabRequestId) return toast.error("Avval request tanlang");
    setLabSubmitting(true);
    try {
      const res = await fetch("/api/hospital/lab-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_result",
          request_id: selectedLabRequestId,
          test_type: selectedTestType,
          values: labValues,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Saqlash xatoligi");
      toast.success("Analiz natijalari yuborildi");
      setSelectedLabRequestId("");
      setLabValues({});
      await fetchAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setLabSubmitting(false);
    }
  }

  const critical = useMemo(() => inventory.filter((r) => (r.quantity ?? 0) <= 5), [inventory]);
  const enRouteCount = useMemo(() => requests.filter((r) => r.delivery_status === "en_route").length, [requests]);
  const totalUnits = useMemo(() => inventory.reduce((sum, r) => sum + (Number(r.quantity) || 0), 0), [inventory]);
  const selectedLabRequest = useMemo(
    () => labRequests.find((r) => r.id === selectedLabRequestId) ?? null,
    [labRequests, selectedLabRequestId],
  );
  const selectedTestType = selectedLabRequest?.test_type ?? "cbc";
  const selectedFields = useMemo(() => TEST_FIELDS[selectedTestType] ?? [], [selectedTestType]);

  useEffect(() => {
    if (!selectedLabRequestId) return;
    setLabValues((prev) => {
      const next = { ...prev };
      for (const field of selectedFields) {
        if (next[field.key] !== undefined && next[field.key] !== "") continue;
        if (field.type === "select") {
          next[field.key] = field.options?.[0] ?? "";
        }
      }
      return next;
    });
  }, [selectedLabRequestId, selectedFields]);

  if (loading) {
    return (
      <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#E8F5E8]">
        <div className="h-5 w-48 rounded bg-zinc-200 dark:bg-zinc-700" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-blue-100 bg-gradient-to-r from-blue-600 to-cyan-600 p-5 text-white shadow-lg dark:border-blue-900">
        <div className="text-xl font-semibold">🏥 Hospital real-time panel</div>
        <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
          <div className="rounded-xl bg-white/95 px-3 py-2 text-blue-700">🩸 Jami zaxira: {totalUnits}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-blue-700">🚚 Yo&apos;lda: {enRouteCount}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-blue-700">🚨 Kritik: {critical.length}</div>
        </div>
      </section>

      {/* Inventory Charts */}
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold mb-2">Qon guruhi bo'yicha zaxira</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <BarChart data={Object.entries(inventory.reduce((acc, item) => {
                const key = `${item.blood_group}${item.rh || ""}`;
                acc[key] = (acc[key] || 0) + item.quantity;
                return acc;
              }, {} as Record<string, number>)).map(([group, qty]) => ({ group, qty }))}>
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
                <Pie data={Object.entries(inventory.reduce((acc, item) => {
                  acc[item.component] = (acc[item.component] || 0) + item.quantity;
                  return acc;
                }, {} as Record<string, number>)).map(([component, qty]) => ({ name: component, value: qty }))} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {Object.entries(inventory.reduce((acc, item) => {
                    acc[item.component] = (acc[item.component] || 0) + item.quantity;
                    return acc;
                  }, {} as Record<string, number>)).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={["#8884d8", "#82ca9d", "#ffc658", "#ff7300"][index % 4]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#F3E5F5] md:col-span-1">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Qon zaxirasi</h3>
          <div className="mt-3 text-2xl font-semibold">{inventory.length}</div>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-300">Inventory recordlar soni (demo).</p>

          <div className="mt-4 rounded-xl bg-[#FFF3E0] p-3 text-sm dark:bg-orange-950/30 dark:text-orange-100">
            <div className="font-medium">Kritikal guruhlar</div>
            <div className="mt-2 space-y-1 text-zinc-700 dark:text-zinc-200">
              {critical.length ? (
                critical.slice(0, 6).map((c, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-2">
                    <span>
                      {c.blood_group}
                      {c.rh ? c.rh : ""} · {c.component}
                    </span>
                    <span className="font-semibold">{c.quantity}</span>
                  </div>
                ))
              ) : (
                <div className="text-zinc-600 dark:text-zinc-300">Hozircha kritik emas.</div>
              )}
            </div>
            <div className="mt-3 text-zinc-700 dark:text-zinc-200">
              Yo&apos;lda kelayotgan emergency: <span className="font-semibold">{enRouteCount}</span>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-[#E8F5E8] md:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">AI Predictor</h3>
          <div className="mt-2 rounded-xl bg-[#FFF3E0] p-4 text-sm dark:bg-orange-950/30 dark:text-orange-100">{predictDemand()}</div>

          <div className="mt-4 rounded-xl border border-zinc-200 bg-[#F3E5F5] p-4 dark:border-zinc-700 dark:bg-purple-950/30 dark:text-purple-100">
            <div className="font-semibold text-sm text-zinc-700 dark:text-zinc-200">📦 Digital order</div>
            <div className="mt-3 grid gap-3 sm:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium">Qon guruhi</label>
                <select
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100"
                >
                  <option value="O">O</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Komponent</label>
                <select
                  value={component}
                  onChange={(e) => setComponent(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100"
                >
                  <option value="whole_blood">Butun qon</option>
                  <option value="red_cells">Qizil qon tanachasi</option>
                  <option value="platelets">Trombotsitlar</option>
                  <option value="plasma">Plazma</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Miqdor</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="w-full rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100"
                />
              </div>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => createEmergency("donor")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-rose-600 text-white hover:bg-rose-700"
              >
                Donorga so&apos;rov yuborish
              </button>
              <button
                type="button"
                onClick={() => createEmergency("center")}
                className="flex h-11 w-full items-center justify-center rounded-xl bg-blue-600 text-white hover:bg-blue-700"
              >
                Blood centerga so&apos;rov yuborish
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-[#FFF8E1] p-5 shadow-sm dark:border-zinc-700 dark:bg-yellow-950/30 dark:text-yellow-100">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Orders / Requests</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {requests.length ? (
            requests.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-xl border border-zinc-300 bg-white/90 p-3 dark:border-zinc-600 dark:bg-zinc-800/50 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <div className="text-sm font-medium">
                    {r.blood_group} · {r.component}
                  </div>
                  <div className="mt-1 text-xs text-zinc-500">
                    Kanal: {r.status === "waiting_donor" || r.status === "donor_en_route" ? "Donor" : "Blood center"}
                  </div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">
                    Qty: {r.quantity ?? "-"} · ETA demo: {r.delivery_eta_demo_minutes ?? 0} min · Donor: {r.donor_name ?? "-"}
                  </div>
                  {r.delivery_status === "en_route" && (
                    <div className="mt-2">
                      <div className="h-2 w-full rounded-full bg-zinc-200 dark:bg-zinc-700">
                        <div
                          className="h-2 rounded-full bg-blue-600"
                          style={{
                            width: `${Math.min(
                              100,
                              Math.max(
                                5,
                                Math.round(
                                  ((Date.now() - new Date(r.updated_at).getTime()) /
                                    Math.max(1, (r.delivery_eta_demo_minutes ?? 1) * 60_000)) *
                                    100,
                                ),
                              ),
                            )}%`,
                          }}
                        />
                      </div>
                      <div className="mt-1 text-xs text-zinc-500">Demo map progress (1 daqiqa atrofida)</div>
                    </div>
                  )}
                </div>
                <div className="text-sm">
                  <div className="font-semibold">{r.status}</div>
                  <div className="text-zinc-600 dark:text-zinc-300">{r.delivery_status}</div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-sm text-zinc-600 dark:text-zinc-300">Hozircha emergency request yo‘q.</div>
          )}
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-[#F3E5F5] p-5 shadow-sm dark:border-zinc-700 dark:bg-purple-950/30 dark:text-purple-100">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">📥 Incoming Requests (Qon analiz)</h3>
          <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
            {labRequests.length ? (
              labRequests.map((r) => (
                <div key={r.id} className="rounded-xl border border-zinc-200 p-3 dark:border-zinc-800">
                  <div className="text-sm font-semibold">{r.donor_name ?? "Donor"} · {r.donor_blood_group ?? "-"}</div>
                  <div className="text-xs text-zinc-500">Turi: {TEST_TYPE_LABELS[r.test_type ?? ""] ?? (r.test_type ?? "-")}</div>
                  <div className="text-sm text-zinc-600 dark:text-zinc-300">{new Date(r.scheduled_at).toLocaleString("uz-UZ")}</div>
                  <div className="text-xs text-zinc-500">Holati: {r.status}</div>
                  {r.note ? <div className="mt-1 text-xs text-zinc-600 dark:text-zinc-300">Izoh: {r.note}</div> : null}
                  <div className="mt-2 flex gap-2">
                    <button disabled={labSubmitting || r.status !== "pending"} onClick={() => handleLabAction("approve", r.id)} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">Approve</button>
                    <button disabled={labSubmitting || r.status !== "pending"} onClick={() => handleLabAction("reject", r.id)} className="rounded-lg bg-rose-600 px-3 py-1.5 text-xs text-white disabled:opacity-50">Reject</button>
                    <button disabled={r.status !== "approved"} onClick={() => setSelectedLabRequestId(r.id)} className="rounded-lg border px-3 py-1.5 text-xs">Analiz kiritish</button>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-sm text-zinc-600 dark:text-zinc-300">Yangi analiz so&apos;rovlari yo&apos;q.</div>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-zinc-200 bg-[#FFF3E0] p-5 shadow-sm dark:border-zinc-700 dark:bg-orange-950/30 dark:text-orange-100">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">📋 Analiz kiritish formasi</h3>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <select value={selectedLabRequestId} onChange={(e) => setSelectedLabRequestId(e.target.value)} className="rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100 sm:col-span-2">
              <option value="">Request tanlang</option>
              {labRequests.filter((r) => r.status === "approved").map((r) => (
                <option key={r.id} value={r.id}>{r.donor_name ?? "Donor"} · {TEST_TYPE_LABELS[r.test_type ?? ""] ?? r.test_type ?? "-"} · {new Date(r.scheduled_at).toLocaleString("uz-UZ")}</option>
              ))}
            </select>
            {selectedFields.map((f) =>
              f.type === "select" ? (
                <select
                  key={f.key}
                  value={labValues[f.key] ?? (f.options?.[0] ?? "")}
                  onChange={(e) => setLabValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  className="rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100"
                >
                  {(f.options ?? []).map((o) => (
                    <option key={o} value={o}>{o}</option>
                  ))}
                </select>
              ) : (
                <input
                  key={f.key}
                  value={labValues[f.key] ?? ""}
                  onChange={(e) => setLabValues((p) => ({ ...p, [f.key]: e.target.value }))}
                  placeholder={f.label}
                  type={f.type}
                  className="rounded-xl border border-zinc-200 bg-[#E3F2FD] px-3 py-2 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100"
                />
              ),
            )}
          </div>
          <button disabled={labSubmitting} onClick={saveLabResult} className="mt-4 w-full rounded-xl bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60">
            Saqlash va yuborish
          </button>
        </div>
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-[#E8F5E8] p-5 shadow-sm dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100 lg:col-span-2">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">🚚 Logistika tracking</h3>
          <div className="mt-3 rounded-xl border border-red-200 bg-[#FFEBEE] p-4 text-sm dark:border-red-700 dark:bg-red-950/30 dark:text-red-100">
            <div>Demo map: transportlar yo&apos;lda ko&apos;rsatiladi, ETA avtomatik yangilanadi.</div>
            <div className="mt-2 font-semibold text-red-800 dark:text-red-200">Haydovchi: Azizbek S. · Tel: +998 ** *** ** ** · ETA: 18 min</div>
          </div>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-[#FFF3E0] p-5 shadow-sm dark:border-zinc-700 dark:bg-orange-950/30 dark:text-orange-100">
          <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">🧾 Tezkor tekshiruv</h3>
          <div className="mt-3 rounded-xl bg-[#F3E5F5] p-3 text-sm dark:bg-purple-950/30 dark:text-purple-100">
            QR scan orqali donor info va qon mosligi tekshiruv moduli (demo).
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-[#E8F5E8] p-5 shadow-sm dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100">
        <h3 className="text-sm font-semibold text-zinc-700 dark:text-zinc-200">Blood center zaxiralari (DB)</h3>
        <div className="mt-3 overflow-auto">
          {/* Blood center stocks charts */}
          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-200">Markaz + guruh bo'yicha</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                  <BarChart data={centerBarDataArr}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="group" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="qty" fill="#1976d2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
            <div className="rounded-2xl border bg-white p-4 shadow-sm dark:bg-zinc-900">
              <h4 className="font-semibold mb-2 text-zinc-700 dark:text-zinc-200">Komponent bo'yicha</h4>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
                  <PieChart>
                    <Pie data={centerPieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#1976d2" dataKey="value">
                      {centerPieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CENTER_COLORS[index % CENTER_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="text-xs text-zinc-500">
                <th className="py-2">Center</th>
                <th className="py-2">Group</th>
                <th className="py-2">Rh</th>
                <th className="py-2">Component</th>
                <th className="py-2">Qty</th>
              </tr>
            </thead>
            <tbody>
              {centerStocks.length ? (
                centerStocks.map((s, idx) => (
                  <tr key={`${s.center_id}-${idx}`} className="border-t border-zinc-200 dark:border-zinc-800">
                    <td className="py-2">{s.center_name ?? s.center_id.slice(0, 6)}</td>
                    <td className="py-2">{s.blood_group}</td>
                    <td className="py-2">{s.rh}</td>
                    <td className="py-2">{s.component}</td>
                    <td className="py-2 font-semibold">{s.quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-3 text-zinc-600 dark:text-zinc-300">
                    Center zaxiralari hozircha topilmadi.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

