import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll, dbGet, dbRun } from "@/lib/db/sqlite";

const TEST_FIELDS: Record<string, string[]> = {
  cbc: ["hemoglobin", "rbc", "wbc", "plt", "esr", "mcv", "mch", "mchc"],
  biochemistry: ["glucose", "alt", "ast", "creatinine", "urea", "cholesterol", "bilirubin"],
  hormonal: ["tsh", "t3", "t4", "insulin", "sex_hormones"],
  infection: ["hiv", "hepatitis_b", "hepatitis_c", "syphilis", "bacterial_markers", "antibodies"],
  coagulation: ["prothrombin", "inr", "fibrinogen"],
};

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "hospital") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const requests = await dbAll<{
    id: string;
    donor_id: string;
    donor_name: string | null;
    donor_blood_group: string | null;
    test_type: string | null;
    scheduled_at: string;
    note: string | null;
    status: string;
    requested_at: string;
  }>(
    `SELECT
      lr.id, lr.donor_id, lr.test_type, lr.scheduled_at, lr.note, lr.status, lr.requested_at,
      (SELECT TRIM(COALESCE(u.first_name, 'Donor') || ' ' || COALESCE(u.last_name, '')) FROM users u WHERE u.id = lr.donor_id) AS donor_name,
      (SELECT u.blood_group FROM users u WHERE u.id = lr.donor_id) AS donor_blood_group
     FROM lab_requests lr
     WHERE lr.hospital_id = ?
     ORDER BY lr.requested_at DESC
     LIMIT 50`,
    [user.id],
  );

  return NextResponse.json({ requests });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "hospital") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    action?: "approve" | "reject" | "save_result";
    request_id?: string;
    test_type?: string;
    values?: Record<string, string | number>;
    hemoglobin?: number;
    blood_pressure?: string;
    leukocytes?: number;
    platelets?: number;
    hiv?: string;
    hepatitis_b?: string;
    hepatitis_c?: string;
    syphilis?: string;
  };

  if (!body.action || !body.request_id) {
    return NextResponse.json({ error: "action va request_id majburiy" }, { status: 400 });
  }

  const reqRow = await dbGet<{ id: string; donor_id: string; status: string; test_type: string | null }>(
    `SELECT id, donor_id, status, test_type FROM lab_requests WHERE id = ? LIMIT 1`,
    [body.request_id],
  );
  if (!reqRow) return NextResponse.json({ error: "Request topilmadi" }, { status: 404 });

  const now = new Date().toISOString();

  if (body.action === "approve") {
    await dbRun(`UPDATE lab_requests SET status = 'approved', processed_at = ? WHERE id = ?`, [now, body.request_id]);
    await dbRun(
      `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, 'lab_request_approved', ?, 0, ?)`,
      [randomUUID(), reqRow.donor_id, "Qon analiz so'rovingiz tasdiqlandi", now],
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "reject") {
    await dbRun(`UPDATE lab_requests SET status = 'rejected', processed_at = ? WHERE id = ?`, [now, body.request_id]);
    await dbRun(
      `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, 'lab_request_rejected', ?, 0, ?)`,
      [randomUUID(), reqRow.donor_id, "Qon analiz so'rovingiz rad etildi", now],
    );
    return NextResponse.json({ ok: true });
  }

  if (body.action === "save_result") {
    const testType = reqRow.test_type ?? body.test_type ?? "cbc";
    const required = TEST_FIELDS[testType] ?? [];
    const values = body.values ?? {};
    const requiredFields = required.map((k) => values[k]);
    if (requiredFields.some((v) => v === undefined || v === null || v === "")) {
      return NextResponse.json({ error: "Analiz formadagi barcha majburiy maydonlarni to'ldiring" }, { status: 400 });
    }
    const detailsJson = JSON.stringify(values);
    await dbRun(
      `INSERT INTO lab_results (id, request_id, donor_id, hospital_id, test_type, details_json, hemoglobin, blood_pressure, leukocytes, platelets, hiv, hepatitis_b, hepatitis_c, syphilis, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        randomUUID(),
        body.request_id,
        reqRow.donor_id,
        user.id,
        testType,
        detailsJson,
        Number(values.hemoglobin ?? body.hemoglobin ?? 0) || null,
        String(values.blood_pressure ?? body.blood_pressure ?? ""),
        Number(values.wbc ?? values.leukocytes ?? body.leukocytes ?? 0) || null,
        Number(values.plt ?? values.platelets ?? body.platelets ?? 0) || null,
        String(values.hiv ?? body.hiv ?? ""),
        String(values.hepatitis_b ?? body.hepatitis_b ?? ""),
        String(values.hepatitis_c ?? body.hepatitis_c ?? ""),
        String(values.syphilis ?? body.syphilis ?? ""),
        now,
      ],
    );
    await dbRun(`UPDATE lab_requests SET status = 'completed', processed_at = ? WHERE id = ?`, [now, body.request_id]);
    await dbRun(
      `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, 'lab_result_ready', ?, 0, ?)`,
      [randomUUID(), reqRow.donor_id, "Sizning qon analiz natijalaringiz tayyor", now],
    );
    return NextResponse.json({ ok: true });
  }

  return NextResponse.json({ error: "Noto'g'ri action" }, { status: 400 });
}

