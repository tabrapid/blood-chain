import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "blood_center") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const emergency = await dbGet<{
    id: string;
    hospital_id: string | null;
    center_id: string | null;
    blood_group: string;
    component: string;
    quantity: number;
    rh: string | null;
  }>(
    `SELECT id, hospital_id, center_id, blood_group, component, quantity, rh
     FROM emergency_requests
     WHERE id = ? AND center_id = ?
     LIMIT 1`,
    [id, user.id],
  );

  if (!emergency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (emergency.hospital_id) {
    if (!emergency.rh) return NextResponse.json({ error: "Emergency rh yo‘q" }, { status: 400 });

    const existing = await dbGet<{ id: string; quantity: number }>(
      `SELECT id, quantity
       FROM blood_inventory
       WHERE hospital_id = ? AND blood_group = ? AND component = ? AND rh = ?
       LIMIT 1`,
      [emergency.hospital_id, emergency.blood_group, emergency.component, emergency.rh],
    );

    if (existing) {
      await dbRun(
        `UPDATE blood_inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?`,
        [emergency.quantity, new Date().toISOString(), existing.id],
      );
    } else {
      await dbRun(
        `INSERT INTO blood_inventory (id, center_id, hospital_id, blood_group, rh, component, quantity, expiry_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          randomUUID(),
          null,
          emergency.hospital_id,
          emergency.blood_group,
          emergency.rh,
          emergency.component,
          emergency.quantity,
          null,
          new Date().toISOString(),
          new Date().toISOString(),
        ],
      );
    }
  }

  await dbRun(
    `UPDATE emergency_requests SET status = 'completed', delivery_status = 'delivered', updated_at = ? WHERE id = ?`,
    [new Date().toISOString(), emergency.id],
  );

  await persist();
  return NextResponse.json({ ok: true });
}

