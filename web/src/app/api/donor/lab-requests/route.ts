import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll, dbRun } from "@/lib/db/sqlite";

const ALLOWED_TEST_TYPES = new Set(["cbc", "biochemistry", "hormonal", "infection", "coagulation"]);

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const hospitals = await dbAll<{ id: string; name: string | null; region: string | null; address: string | null }>(
    `SELECT id, name, region, address FROM users WHERE role = 'hospital' ORDER BY name ASC`,
    [],
  );

  const requests = await dbAll<{
    id: string;
    hospital_id: string;
    hospital_name: string | null;
    test_type: string | null;
    scheduled_at: string;
    note: string | null;
    status: string;
    requested_at: string;
    processed_at: string | null;
  }>(
    `SELECT
      lr.id, lr.hospital_id, lr.test_type, lr.scheduled_at, lr.note, lr.status, lr.requested_at, lr.processed_at,
      (SELECT u.name FROM users u WHERE u.id = lr.hospital_id) AS hospital_name
     FROM lab_requests lr
     WHERE lr.donor_id = ?
     ORDER BY lr.requested_at DESC
     LIMIT 30`,
    [user.id],
  );

  return NextResponse.json({ hospitals, requests });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = (await req.json().catch(() => ({}))) as {
    hospital_id?: string;
    scheduled_at?: string;
    test_type?: string;
    note?: string;
  };

  if (!body.hospital_id || !body.scheduled_at || !body.test_type) {
    return NextResponse.json({ error: "hospital_id, test_type va scheduled_at majburiy" }, { status: 400 });
  }
  if (!ALLOWED_TEST_TYPES.has(body.test_type)) {
    return NextResponse.json({ error: "Noto'g'ri test_type" }, { status: 400 });
  }

  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO lab_requests (id, donor_id, hospital_id, test_type, requested_at, scheduled_at, note, status, processed_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', NULL)`,
    [randomUUID(), user.id, body.hospital_id, body.test_type, now, body.scheduled_at, body.note?.trim() || null],
  );

  await dbRun(
    `INSERT INTO notifications (id, user_id, type, message, read, created_at)
     VALUES (?, ?, 'lab_request_incoming', ?, 0, ?)`,
    [randomUUID(), body.hospital_id, "Yangi qon analiz so'rovi keldi", now],
  );

  return NextResponse.json({ ok: true });
}

