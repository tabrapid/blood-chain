import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";
import { randomUUID } from "crypto";

export async function POST() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const center = await dbGet<{ id: string }>(`SELECT id FROM users WHERE role = 'blood_center' LIMIT 1`, []);
  if (!center) return NextResponse.json({ error: "Blood center topilmadi" }, { status: 400 });

  const bloodGroup = user.blood_group ?? "O";

  await dbRun(
    `
    INSERT INTO emergency_requests (
      id, hospital_id, center_id, donor_id,
      blood_group, rh, component, quantity,
      status, donor_approved,
      delivery_status, delivery_eta_demo_minutes,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `,
    [
      randomUUID(),
      null,
      center.id,
      user.id,
      bloodGroup,
      null, // rh delivery start paytida aniqlanadi
      "whole_blood",
      1,
      "pending",
      0,
      "pending",
      60,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );

  await persist();
  return NextResponse.json({ ok: true });
}

