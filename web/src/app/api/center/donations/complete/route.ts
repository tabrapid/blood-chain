import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

const validComponents = new Set(["whole_blood", "red_cells", "platelets", "plasma"]);
const validGroups = new Set(["A", "B", "AB", "O"]);
const validRh = new Set(["+", "-"]);

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "blood_center") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const slotId = typeof body?.slot_id === "string" ? body.slot_id : null;
  const component = typeof body?.component === "string" ? body.component : null;
  const quantity = Number(body?.quantity);
  const bloodGroup = typeof body?.blood_group === "string" ? body.blood_group : null;
  const rh = typeof body?.rh === "string" ? body.rh : null;

  if (!slotId) return NextResponse.json({ error: "slot_id required" }, { status: 400 });
  if (!component || !validComponents.has(component)) return NextResponse.json({ error: "Bad component" }, { status: 400 });
  if (!bloodGroup || !validGroups.has(bloodGroup)) return NextResponse.json({ error: "Bad blood_group" }, { status: 400 });
  if (!rh || !validRh.has(rh)) return NextResponse.json({ error: "Bad rh" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: "Bad quantity" }, { status: 400 });

  const slot = await dbGet<{ id: string; donor_id: string; status: string }>(
    `SELECT id, donor_id, status FROM donor_slots WHERE id = ? AND center_id = ? LIMIT 1`,
    [slotId, user.id],
  );
  if (!slot) return NextResponse.json({ error: "Slot topilmadi" }, { status: 404 });
  if (String(slot.status).toLowerCase().includes("completed")) {
    return NextResponse.json({ error: "Slot allaqachon yakunlangan" }, { status: 409 });
  }

  const donor = await dbGet<{ id: string; points: number; total_donated_liters: number }>(
    `SELECT id, points, total_donated_liters FROM users WHERE id = ? LIMIT 1`,
    [slot.donor_id],
  );
  if (!donor) return NextResponse.json({ error: "Donor topilmadi" }, { status: 404 });

  const now = new Date().toISOString();
  const existing = await dbGet<{ id: string }>(
    `SELECT id FROM blood_inventory WHERE center_id = ? AND blood_group = ? AND rh = ? AND component = ? LIMIT 1`,
    [user.id, bloodGroup, rh, component],
  );

  if (existing) {
    await dbRun(`UPDATE blood_inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?`, [quantity, now, existing.id]);
  } else {
    await dbRun(
      `INSERT INTO blood_inventory (id, center_id, hospital_id, component, blood_group, rh, quantity, expiry_date, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [randomUUID(), user.id, null, component, bloodGroup, rh, quantity, null, now, now],
    );
  }

  const addedPoints = Math.round(quantity * 100);
  const newTotal = Number(donor.total_donated_liters ?? 0) + quantity;
  const newPoints = Number(donor.points ?? 0) + addedPoints;
  const badges: string[] = [];
  if (newTotal >= 10) badges.push("Platinum");
  else if (newTotal >= 5) badges.push("Gold");
  else if (newTotal >= 2) badges.push("Silver");
  else badges.push("Bronze");

  await dbRun(
    `UPDATE users
     SET total_donated_liters = ?, points = ?, badges = ?, last_donation_date = ?, updated_at = ?
     WHERE id = ?`,
    [newTotal, newPoints, JSON.stringify(badges), now, now, donor.id],
  );

  await dbRun(
    `UPDATE donor_slots SET status = 'completed', updated_at = ?, eta_demo_minutes = 0 WHERE id = ?`,
    [now, slot.id],
  );

  await dbRun(
    `INSERT INTO donor_donations (id, donor_id, center_id, hospital_id, blood_group, rh, component, liters, donation_status, donated_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [randomUUID(), donor.id, user.id, null, bloodGroup, rh, component, quantity, "completed", now, now],
  );

  await dbRun(
    `INSERT INTO notifications (id, user_id, type, message, read, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
    [randomUUID(), donor.id, "donation", `Qon topshirish yakunlandi: ${quantity}L (${bloodGroup}${rh} ${component})`, 0, now],
  );

  await persist();
  return NextResponse.json({ ok: true });
}
