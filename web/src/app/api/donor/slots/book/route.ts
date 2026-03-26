import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";
import { randomUUID } from "crypto";

export async function POST() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const center = await dbGet<{ id: string }>(`SELECT id FROM users WHERE role = 'blood_center' ORDER BY created_at ASC LIMIT 1`, []);
  if (!center) return NextResponse.json({ error: "Blood center topilmadi" }, { status: 400 });

  const slotTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  const etaMinutes = 5;

  await dbRun(
    `INSERT INTO donor_slots (id, donor_id, center_id, slot_time, status, eta_demo_minutes, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), user.id, center.id, slotTime, "queued_for_center", etaMinutes, new Date().toISOString(), new Date().toISOString()],
  );

  await dbRun(
    `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), user.id, "donation", "So'rovingiz blood center navbatiga yuborildi.", 0, new Date().toISOString()],
  );

  await persist();
  return NextResponse.json({ ok: true });
}

