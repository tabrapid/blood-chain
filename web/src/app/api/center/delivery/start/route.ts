import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist, getDb } from "@/lib/db/sqlite";

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
  }>(
    `SELECT id, hospital_id, center_id, blood_group, component, quantity
     FROM emergency_requests
     WHERE id = ? AND center_id = ?
     LIMIT 1`,
    [id, user.id],
  );

  if (!emergency) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const candidateInventory = await dbGet<{
    id: string;
    quantity: number;
    rh: string | null;
  }>(
    `SELECT id, quantity, rh
     FROM blood_inventory
     WHERE center_id = ? AND blood_group = ? AND component = ?
     ORDER BY quantity DESC
     LIMIT 1`,
    [user.id, emergency.blood_group, emergency.component],
  );

  if (!candidateInventory) return NextResponse.json({ error: "Inventory topilmadi" }, { status: 400 });
  if (Number(candidateInventory.quantity) < Number(emergency.quantity)) {
    return NextResponse.json({ error: "Inventory miqdori yetarli emas" }, { status: 400 });
  }

  const donorCandidate = await dbGet<{ id: string }>(
    `SELECT id FROM users WHERE role = 'donor' AND blood_group = ? ORDER BY points DESC LIMIT 1`,
    [emergency.blood_group],
  );

  // Transaction
  const d = await getDb();
  d.run("BEGIN");
  try {
    await dbRun(
      `UPDATE blood_inventory SET quantity = quantity - ?, updated_at = ? WHERE id = ?`,
      [emergency.quantity, new Date().toISOString(), candidateInventory.id],
    );

    await dbRun(
      `UPDATE emergency_requests
       SET status = 'en_route',
           donor_approved = 1,
           donor_id = ?,
           delivery_status = 'en_route',
           delivery_eta_demo_minutes = ?,
           rh = ?
       WHERE id = ?`,
      [
        donorCandidate?.id ?? null,
        Math.max(1, Math.round(0.35 * 60)),
        candidateInventory.rh,
        emergency.id,
      ],
    );

    d.run("COMMIT");
  } catch (e) {
    d.run("ROLLBACK");
    throw e;
  } finally {
    await persist();
  }

  return NextResponse.json({ ok: true });
}

