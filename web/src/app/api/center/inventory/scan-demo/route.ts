import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "blood_center") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const blood_group = body?.blood_group;
  const rh = body?.rh;
  const component = body?.component;
  const quantity = Number(body?.quantity);

  const validGroups = new Set(["A", "B", "AB", "O"]);
  const validRh = new Set(["+", "-"]);
  const validComponents = new Set(["whole_blood", "red_cells", "platelets", "plasma"]);
  if (!validGroups.has(blood_group)) return NextResponse.json({ error: "Bad blood_group" }, { status: 400 });
  if (!validRh.has(rh)) return NextResponse.json({ error: "Bad rh" }, { status: 400 });
  if (!validComponents.has(component)) return NextResponse.json({ error: "Bad component" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: "Bad quantity" }, { status: 400 });

  const existing = await dbGet<{ id: string; quantity: number }>(
    `SELECT id, quantity FROM blood_inventory
     WHERE center_id = ? AND blood_group = ? AND rh = ? AND component = ?
     LIMIT 1`,
    [user.id, blood_group, rh, component],
  );

  const now = new Date().toISOString();
  if (existing) {
    await dbRun(`UPDATE blood_inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?`, [quantity, now, existing.id]);
  } else {
    await dbRun(
      `INSERT INTO blood_inventory (id, center_id, hospital_id, blood_group, rh, component, quantity, expiry_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), user.id, null, blood_group, rh, component, quantity, null, now, now],
    );
  }

  await persist();
  return NextResponse.json({ ok: true });
}

