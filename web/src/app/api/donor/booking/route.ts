import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const centerId = typeof body?.center_id === "string" ? body.center_id : null;
  const slotTime = typeof body?.slot_time === "string" ? body.slot_time : null;
  const feeling = typeof body?.feeling === "string" ? body.feeling.trim() : "";

  if (!centerId || !slotTime) return NextResponse.json({ error: "center_id va slot_time kerak" }, { status: 400 });

  const center = await dbGet<{ id: string }>(`SELECT id FROM users WHERE id = ? AND role = 'blood_center' LIMIT 1`, [centerId]);
  if (!center) return NextResponse.json({ error: "Center topilmadi" }, { status: 404 });

  const now = new Date().toISOString();
  await dbRun(
    `INSERT INTO donor_slots (id, donor_id, center_id, slot_time, status, eta_demo_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), user.id, center.id, new Date(slotTime).toISOString(), "queued_for_center", 10, now, now],
  );

  if (feeling) {
    await dbRun(
      `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
      [randomUUID(), user.id, "questionnaire", `Anketa: ${feeling}`, 0, now],
    );
  }

  await persist();
  return NextResponse.json({ ok: true });
}
