import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll, dbGet } from "@/lib/db/sqlite";

type LabResultRow = {
  id: string;
  donor_id: string;
  test_type: string | null;
  details_json: string | null;
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

function parseDetails(row: LabResultRow) {
  if (!row.details_json) return {};
  try {
    return JSON.parse(row.details_json) as Record<string, string | number>;
  } catch {
    return {};
  }
}

function localAnalyze(current: LabResultRow, previous: LabResultRow | null) {
  const notes: string[] = [];
  const d = parseDetails(current);
  const p = previous ? parseDetails(previous) : {};
  const type = current.test_type ?? "infection";

  if (type === "cbc") {
    const hb = Number(d.hemoglobin ?? current.hemoglobin ?? 0);
    if (hb < 120) notes.push("Gemoglobin normadan past bo'lishi mumkin.");
    const wbc = Number(d.wbc ?? current.leukocytes ?? 0);
    if (wbc > 11) notes.push("Leykotsitlar oshgan, yallig'lanish ehtimoli bor.");
  }
  if (type === "biochemistry") {
    const glucose = Number(d.glucose ?? 0);
    if (glucose > 6.1) notes.push("Glyukoza yuqori, qand nazorati kerak.");
    const alt = Number(d.alt ?? 0);
    const ast = Number(d.ast ?? 0);
    if (alt > 45 || ast > 40) notes.push("ALT/AST yuqori, jigar faoliyatini tekshirish tavsiya etiladi.");
  }
  if (type === "hormonal") {
    if (d.tsh !== undefined) notes.push("TSH/T3/T4 natijalari gormonal balans bilan birga baholanadi.");
  }
  if (type === "infection") {
    if (String(d.hiv ?? current.hiv ?? "").toLowerCase() === "positive") notes.push("HIV natijasi Positive ko'rsatilgan.");
    if (String(d.hepatitis_b ?? current.hepatitis_b ?? "").toLowerCase() === "positive") notes.push("Gepatit B natijasi Positive ko'rsatilgan.");
    if (String(d.hepatitis_c ?? current.hepatitis_c ?? "").toLowerCase() === "positive") notes.push("Gepatit C natijasi Positive ko'rsatilgan.");
    if (String(d.syphilis ?? current.syphilis ?? "").toLowerCase() === "positive") notes.push("Sifilis natijasi Positive ko'rsatilgan.");
  }
  if (type === "coagulation") {
    const inr = Number(d.inr ?? 0);
    if (inr > 1.3) notes.push("INR ko'rsatkichi yuqori bo'lishi mumkin.");
  }

  const ch = Number(d.hemoglobin ?? current.hemoglobin ?? 0);
  const ph = Number(p.hemoglobin ?? previous?.hemoglobin ?? 0);
  if (ph > 0 && ch > 0) {
    const pct = Math.round(((ch - ph) / ph) * 100);
    notes.push(`Oxirgi analizga nisbatan gemoglobin ${pct > 0 ? "+" : ""}${pct}% o'zgargan.`);
  }

  if (!notes.length) notes.push("Ko'rsatkichlar umumiy bahoda normal diapazonda.");

  return `AI xulosa (local fallback):\n- ${notes.join("\n- ")}\n\nTavsiya:\n- Temirga boy ovqatlar (qizil go'sht, dukkaklilar, ismaloq)\n- Yetarli uyqu va suyuqlik\n- 2-4 hafta ichida qayta analiz`;
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as { result_id?: string };
  if (!body.result_id) return NextResponse.json({ error: "result_id kerak" }, { status: 400 });

  const current = await dbGet<LabResultRow>(
    `SELECT id, donor_id, test_type, details_json, created_at, hemoglobin, blood_pressure, leukocytes, platelets, hiv, hepatitis_b, hepatitis_c, syphilis
     FROM lab_results WHERE id = ? AND donor_id = ? LIMIT 1`,
    [body.result_id, user.id],
  );
  if (!current) return NextResponse.json({ error: "Natija topilmadi" }, { status: 404 });

  const prevRows = await dbAll<LabResultRow>(
    `SELECT id, donor_id, test_type, details_json, created_at, hemoglobin, blood_pressure, leukocytes, platelets, hiv, hepatitis_b, hepatitis_c, syphilis
     FROM lab_results
     WHERE donor_id = ? AND id != ?
     ORDER BY created_at DESC
     LIMIT 1`,
    [user.id, current.id],
  );
  const previous = prevRows[0] ?? null;

  const token = process.env.HF_API_TOKEN;
  const model = process.env.HF_CHAT_MODEL ?? "openai/gpt-oss-120b:fastest";

  if (!token) {
    return NextResponse.json({ analysis: localAnalyze(current, previous), source: "local_fallback_no_token" });
  }

  const prompt = [
    "You are a medical assistant. Analyze donor blood lab results safely and concisely.",
    `Test type: ${current.test_type ?? "unknown"}`,
    "Compare with normal ranges and previous result if provided.",
    "Output in Uzbek language with: 1) Normativ baho 2) Trend 3) Xulosa 4) Tavsiya.",
    `Current: ${JSON.stringify(current)}`,
    `Previous: ${JSON.stringify(previous)}`,
  ].join("\n");

  try {
    const res = await fetch("https://router.huggingface.co/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          {
            role: "system",
            content:
              "You are a medical assistant. Give safe, concise medical analysis in Uzbek with sections: Normativ baho, Trend, Xulosa, Tavsiya.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.2,
      }),
      cache: "no-store",
    });

    const json = (await res.json().catch(() => null)) as
      | { choices?: Array<{ message?: { content?: string } }>; error?: { message?: string } }
      | null;

    const generated = json?.choices?.[0]?.message?.content;
    if (!res.ok || !generated) {
      return NextResponse.json({ analysis: localAnalyze(current, previous), source: "local_fallback_hf_error" });
    }

    return NextResponse.json({ analysis: generated.trim(), source: "huggingface_router_chat" });
  } catch {
    return NextResponse.json({ analysis: localAnalyze(current, previous), source: "local_fallback_network" });
  }
}

