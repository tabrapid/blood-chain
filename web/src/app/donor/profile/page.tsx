"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type Hospital = {
  id: string;
  name: string | null;
  region: string | null;
  address: string | null;
};
type Center = {
  id: string;
  name: string | null;
  region: string | null;
  address: string | null;
  distance_km: number;
  queue_load: number;
  rating: number;
};
type LabRequest = {
  id: string;
  hospital_id: string;
  hospital_name: string | null;
  test_type: string | null;
  scheduled_at: string;
  note: string | null;
  status: string;
  requested_at: string;
  processed_at: string | null;
};
type LabResult = {
  id: string;
  request_id: string;
  test_type: string | null;
  details?: Record<string, string | number>;
  hospital_name: string | null;
  created_at: string;
  hemoglobin: number | null;
  blood_pressure: string | null;
  leukocytes: number | null;
  platelets: number | null;
  hiv: string | null;
  hepatitis_b: string | null;
  hepatitis_c: string | null;
  syphilis: string | null;
};

const TEST_TYPES = [
  { id: "cbc", label: "Umumiy qon tahlili (UQT / CBC)" },
  { id: "biochemistry", label: "Biokimyoviy qon tahlili" },
  { id: "hormonal", label: "Gormonal tahlil" },
  { id: "infection", label: "Infeksiyalar uchun qon tahlili" },
  { id: "coagulation", label: "Qon ivish tizimi (koagulogramma)" },
] as const;

function markerOk(v: boolean) {
  return v ? "🟢" : "🔴";
}

export default function DonorProfilePage() {
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [centers, setCenters] = useState<Center[]>([]);
  const [requests, setRequests] = useState<LabRequest[]>([]);
  const [results, setResults] = useState<LabResult[]>([]);
  const [aiText, setAiText] = useState("");
  const [aiSource, setAiSource] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [analyzingId, setAnalyzingId] = useState<string | null>(null);
  const [expandedResultId, setExpandedResultId] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<
    Array<{ role: "user" | "assistant"; text: string }>
  >([
    {
      role: "assistant",
      text: "Salom! Men donor yordamchi botiman. Savolingizni yozing.",
    },
  ]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);
  const [selectedMapType, setSelectedMapType] = useState<"hospital" | "center">(
    "hospital",
  );
  const [selectedMapId, setSelectedMapId] = useState("");
  const [isChatOpen, setIsChatOpen] = useState(false);

  const [hospitalId, setHospitalId] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [note, setNote] = useState("");
  const [testType, setTestType] =
    useState<(typeof TEST_TYPES)[number]["id"]>("cbc");

  const loadAll = useCallback(async () => {
    const [reqRes, resultRes, centerRes] = await Promise.all([
      fetch("/api/donor/lab-requests", { cache: "no-store" }),
      fetch("/api/donor/lab-results", { cache: "no-store" }),
      fetch("/api/donor/centers", { cache: "no-store" }),
    ]);
    const reqJson = await reqRes
      .json()
      .catch(() => ({ hospitals: [], requests: [] }));
    const resultJson = await resultRes.json().catch(() => ({ results: [] }));
    const centerJson = await centerRes.json().catch(() => ({ centers: [] }));
    if (!reqRes.ok) throw new Error(reqJson?.error ?? "So'rovlar yuklanmadi");
    if (!resultRes.ok)
      throw new Error(resultJson?.error ?? "Natijalar yuklanmadi");
    if (!centerRes.ok)
      throw new Error(centerJson?.error ?? "Markazlar yuklanmadi");
    setHospitals(reqJson.hospitals ?? []);
    setRequests(reqJson.requests ?? []);
    setResults(resultJson.results ?? []);
    setCenters(centerJson.centers ?? []);
    if (!hospitalId && reqJson.hospitals?.[0]?.id)
      setHospitalId(reqJson.hospitals[0].id);
    if (!selectedMapId) {
      if (reqJson.hospitals?.[0]?.id) setSelectedMapId(reqJson.hospitals[0].id);
      else if (centerJson.centers?.[0]?.id) {
        setSelectedMapType("center");
        setSelectedMapId(centerJson.centers[0].id);
      }
    }
  }, [hospitalId, selectedMapId]);

  useEffect(() => {
    loadAll().catch((e) =>
      toast.error(e instanceof Error ? e.message : "Xatolik"),
    );
  }, [loadAll]);

  async function submitRequest() {
    if (!hospitalId || !scheduledAt)
      return toast.error("Shifoxona va sana/vaqtni tanlang");
    setSubmitting(true);
    try {
      const res = await fetch("/api/donor/lab-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          hospital_id: hospitalId,
          test_type: testType,
          scheduled_at: scheduledAt,
          note,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "So'rov yuborilmadi");
      toast.success("So'rov yuborildi");
      setNote("");
      setScheduledAt("");
      await loadAll();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Xatolik");
    } finally {
      setSubmitting(false);
    }
  }

  async function runAi(resultId: string) {
    setAnalyzingId(resultId);
    try {
      const res = await fetch("/api/donor/lab-results/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ result_id: resultId }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "AI analiz xatoligi");
      setAiText(json.analysis ?? "AI javob qaytarmadi");
      setAiSource(json.source ?? "unknown");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "AI xatoligi");
    } finally {
      setAnalyzingId(null);
    }
  }

  async function sendChat() {
    const q = chatInput.trim();
    if (!q) return;
    setChatMessages((p) => [...p, { role: "user", text: q }]);
    setChatInput("");
    setChatLoading(true);
    try {
      const res = await fetch("/api/donor/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: q }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json?.error ?? "Chatbot javobi olinmadi");
      setChatMessages((p) => [
        ...p,
        { role: "assistant", text: json.answer ?? "Javob topilmadi." },
      ]);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Chatbot xatoligi";
      setChatMessages((p) => [...p, { role: "assistant", text: msg }]);
    } finally {
      setChatLoading(false);
    }
  }

  const latest = useMemo(() => results[0] ?? null, [results]);
  const selectedMapItem = useMemo(() => {
    if (selectedMapType === "hospital")
      return hospitals.find((h) => h.id === selectedMapId) ?? null;
    return centers.find((c) => c.id === selectedMapId) ?? null;
  }, [selectedMapType, selectedMapId, hospitals, centers]);
  const mapQuery = useMemo(() => {
    if (!selectedMapItem) return "";
    return [
      selectedMapItem.name,
      selectedMapItem.region,
      selectedMapItem.address,
    ]
      .filter(Boolean)
      .join(", ");
  }, [selectedMapItem]);
  const hemoOk = (latest?.hemoglobin ?? 0) >= 120;
  const hivOk = (latest?.hiv ?? "").toLowerCase() === "negative";

  return (
    <div className="space-y-4">
      <h1>Profil</h1>

      <div className="app-card">
        <h3>Qon analiz topshirish</h3>
        <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-300">
          Shifoxonani tanlang va analiz so'rovini yuboring.
        </p>
        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <select
            value={testType}
            onChange={(e) =>
              setTestType(e.target.value as (typeof TEST_TYPES)[number]["id"])
            }
            className="app-input h-12"
          >
            {TEST_TYPES.map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
          <select
            value={hospitalId}
            onChange={(e) => setHospitalId(e.target.value)}
            className="app-input h-12"
          >
            {hospitals.map((h) => (
              <option key={h.id} value={h.id}>
                {h.name ?? "Hospital"} {h.region ? `· ${h.region}` : ""}
              </option>
            ))}
          </select>
          <input
            type="datetime-local"
            value={scheduledAt}
            onChange={(e) => setScheduledAt(e.target.value)}
            className="app-input h-12"
          />
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="app-input h-12"
            placeholder="Izoh (optional)"
          />
        </div>
        <button
          disabled={submitting}
          onClick={submitRequest}
          className="btn-primary mt-4 w-full"
        >
          {submitting ? "Yuborilmoqda..." : "So'rov yuborish"}
        </button>
      </div>

      <div className="app-card">
        <h3>So&apos;rovlar holati</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto text-sm">
          {requests.length ? (
            requests.map((r) => (
              <div
                key={r.id}
                className="rounded-xl border border-zinc-200 bg-[#F3E5F5] px-3 py-2 dark:border-zinc-700 dark:bg-purple-950/30 dark:text-purple-100"
              >
                <div className="font-medium">
                  {r.hospital_name ?? "Hospital"} ·{" "}
                  {new Date(r.scheduled_at).toLocaleString("uz-UZ")}
                </div>
                <div className="text-xs text-zinc-600 dark:text-zinc-400">
                  Tahlil turi:{" "}
                  {TEST_TYPES.find((t) => t.id === r.test_type)?.label ??
                    r.test_type ??
                    "-"}
                </div>
                <div className="text-zinc-700 dark:text-zinc-200">
                  Holati: <span className="font-semibold">{r.status}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="text-slate-600 dark:text-slate-300">
              Hozircha analiz so'rovi yo'q.
            </div>
          )}
        </div>
      </div>

      <div className="app-card">
        <h3>Analiz natijalari</h3>
        {!latest ? (
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
            Hali natija yo&apos;q.
          </p>
        ) : (
          <div className="mt-3 grid gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-zinc-200 bg-[#E8F5E8] p-3 text-sm dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100 md:col-span-2">
              Tahlil turi:{" "}
              <span className="font-semibold">
                {TEST_TYPES.find((t) => t.id === latest.test_type)?.label ??
                  latest.test_type ??
                  "-"}
              </span>
            </div>
            {(latest.details && Object.keys(latest.details).length
              ? Object.entries(latest.details)
              : [
                  ["hemoglobin", latest.hemoglobin ?? "-"],
                  ["blood_pressure", latest.blood_pressure ?? "-"],
                  ["wbc", latest.leukocytes ?? "-"],
                  ["plt", latest.platelets ?? "-"],
                  ["hiv", latest.hiv ?? "-"],
                ]
            ).map(([k, v]) => (
              <div
                key={k}
                className="rounded-xl border border-zinc-200 bg-[#FFF3E0] p-3 text-sm dark:border-zinc-700 dark:bg-orange-950/30 dark:text-orange-100"
              >
                {k}: {String(v)}
              </div>
            ))}
            {latest.test_type === "cbc" ? (
              <div className="rounded-xl border border-zinc-200 bg-[#E3F2FD] p-3 text-sm dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100">
                Gemoglobin holati: {markerOk(hemoOk)}{" "}
                {hemoOk ? "Me'yorida" : "Past"}
              </div>
            ) : null}
            {latest.test_type === "infection" ? (
              <div className="rounded-xl border border-zinc-200 bg-[#FCE4EC] p-3 text-sm dark:border-zinc-700 dark:bg-pink-950/30 dark:text-pink-100">
                HIV holati: {markerOk(hivOk)} {hivOk ? "Xavfsiz" : "Pozitiv"}
              </div>
            ) : null}
          </div>
        )}
        {latest ? (
          <button
            onClick={() => runAi(latest.id)}
            className="btn-secondary mt-4 w-full"
            disabled={Boolean(analyzingId)}
          >
            {analyzingId ? "AI analiz qilmoqda..." : "AI bilan analiz qilish"}
          </button>
        ) : null}
        {aiText ? (
          <div className="mt-3">
            <div className="mb-2 text-xs text-zinc-500 dark:text-zinc-400">
              AI manbasi: {aiSource || "noma'lum"}
            </div>
            <pre className="whitespace-pre-wrap rounded-xl border border-zinc-200 bg-[#F3E5F5] p-3 text-sm text-zinc-800 dark:border-zinc-700 dark:bg-purple-950/30 dark:text-purple-100">
              {aiText}
            </pre>
          </div>
        ) : null}
      </div>

      <div className="app-card">
        <h3>Oldingi analizlar (ro&apos;yxat)</h3>
        <div className="mt-3 max-h-64 space-y-2 overflow-y-auto">
          {results.length ? (
            results.map((r) => {
              const open = expandedResultId === r.id;
              return (
                <div
                  key={r.id}
                  className="rounded-xl border border-zinc-200 bg-[#E8F5E8] px-3 py-2 dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100"
                >
                  <button
                    type="button"
                    className="flex w-full items-center justify-between text-left text-sm"
                    onClick={() =>
                      setExpandedResultId((prev) =>
                        prev === r.id ? null : r.id,
                      )
                    }
                  >
                    <span className="font-medium">
                      {new Date(r.created_at).toLocaleString("uz-UZ")} ·{" "}
                      {TEST_TYPES.find((t) => t.id === r.test_type)?.label ??
                        r.test_type ??
                        "-"}
                    </span>
                    <span className="text-xs text-zinc-600 dark:text-zinc-400">
                      {open ? "Yopish" : "Ko'rish"}
                    </span>
                  </button>
                  {open ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {(r.details && Object.keys(r.details).length
                        ? Object.entries(r.details)
                        : Object.entries({
                            hemoglobin: r.hemoglobin ?? "-",
                            blood_pressure: r.blood_pressure ?? "-",
                            wbc: r.leukocytes ?? "-",
                            plt: r.platelets ?? "-",
                            hiv: r.hiv ?? "-",
                            hepatitis_b: r.hepatitis_b ?? "-",
                            hepatitis_c: r.hepatitis_c ?? "-",
                            syphilis: r.syphilis ?? "-",
                          })
                      ).map(([k, v]) => (
                        <div
                          key={k}
                          className="rounded-lg border border-zinc-200 bg-[#FFF3E0] px-2 py-1.5 text-xs dark:border-zinc-700 dark:bg-orange-950/30 dark:text-orange-100"
                        >
                          <span className="font-semibold">{k}</span>:{" "}
                          {String(v)}
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              );
            })
          ) : (
            <div className="text-sm text-slate-600 dark:text-slate-300">
              Hali analizlar ro&apos;yxati bo&apos;sh.
            </div>
          )}
        </div>
      </div>

      <div className="app-card">
        <h3>Shifoxona va qon markazlari xaritasi</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          <select
            value={selectedMapType}
            onChange={(e) => {
              const t = e.target.value as "hospital" | "center";
              setSelectedMapType(t);
              if (t === "hospital" && hospitals[0]?.id)
                setSelectedMapId(hospitals[0].id);
              if (t === "center" && centers[0]?.id)
                setSelectedMapId(centers[0].id);
            }}
            className="app-input h-12"
          >
            <option value="hospital">Shifoxonalar</option>
            <option value="center">Qon markazlari</option>
          </select>
          <select
            value={selectedMapId}
            onChange={(e) => setSelectedMapId(e.target.value)}
            className="app-input h-12 md:col-span-2"
          >
            {(selectedMapType === "hospital" ? hospitals : centers).map(
              (item) => (
                <option key={item.id} value={item.id}>
                  {item.name ??
                    (selectedMapType === "hospital"
                      ? "Hospital"
                      : "Center")}{" "}
                  {item.region ? `· ${item.region}` : ""}
                </option>
              ),
            )}
          </select>
        </div>
        {mapQuery ? (
          <div className="mt-3 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-700">
            <iframe
              title="location-map"
              src={`https://www.google.com/maps?q=${encodeURIComponent(mapQuery)}&output=embed`}
              className="h-[320px] w-full"
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        ) : (
          <div className="mt-3 text-sm text-slate-600 dark:text-slate-300">
            Xarita uchun manzil topilmadi.
          </div>
        )}
      </div>

      {isChatOpen && (
        <div className="fixed bottom-20 right-4 w-80 h-96 bg-[#E8F5E8] dark:bg-green-950/30 rounded-lg shadow-lg border border-zinc-200 dark:border-zinc-700 p-4 z-50 flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <h4 className="font-semibold text-zinc-800 dark:text-zinc-100">
              Donor Chatbot
            </h4>
            <button
              onClick={() => setIsChatOpen(false)}
              className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
            >
              ×
            </button>
          </div>
          <div className="flex-1 max-h-64 space-y-2 overflow-y-auto rounded-xl border border-zinc-200 bg-[#F3E5F5] p-3 dark:border-zinc-700 dark:bg-purple-950/30">
            {chatMessages.map((m, i) => (
              <div
                key={`${m.role}-${i}`}
                className={`rounded-lg px-3 py-2 text-sm ${m.role === "user" ? "ml-8 bg-[#E3F2FD] text-blue-900 dark:bg-blue-950/30 dark:text-blue-100" : "mr-8 bg-[#FCE4EC] text-pink-900 dark:bg-pink-950/30 dark:text-pink-100"}`}
              >
                {m.text}
              </div>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Savolingizni yozing..."
              className="app-input h-12 flex-1"
              onKeyDown={(e) => {
                if (e.key === "Enter") sendChat();
              }}
            />
            <button
              onClick={sendChat}
              disabled={chatLoading}
              className="btn-primary px-4"
            >
              {chatLoading ? "..." : "Yuborish"}
            </button>
          </div>
        </div>
      )}

      <div
        className="fixed bottom-4 right-4 w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white cursor-pointer z-50 shadow-lg hover:bg-blue-600 transition-colors"
        onClick={() => setIsChatOpen(!isChatOpen)}
      >
        💬
      </div>
    </div>
  );
}
