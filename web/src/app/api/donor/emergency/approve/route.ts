import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const reqRow = await dbGet<{ donor_id: string | null; blood_group: string | null; component: string | null; quantity: number | null }>(
    `SELECT donor_id, blood_group, component, quantity FROM emergency_requests WHERE id = ? LIMIT 1`,
    [id],
  );
  if (!reqRow) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (reqRow.donor_id && reqRow.donor_id !== user.id) {
    return NextResponse.json({ error: "Already accepted by another donor" }, { status: 409 });
  }

  if (user.blood_group && reqRow.blood_group && user.blood_group !== reqRow.blood_group) {
    return NextResponse.json({ error: "Blood group mos emas" }, { status: 403 });
  }

  await dbRun(
    `UPDATE emergency_requests
     SET donor_approved = 1,
         donor_id = ?,
         status = 'donor_en_route',
         delivery_status = 'en_route',
         delivery_eta_demo_minutes = 1,
         rh = COALESCE(rh, ?),
         updated_at = ?
     WHERE id = ?`,
    [user.id, user.rh ?? null, new Date().toISOString(), id],
  );
  await persist();
  return NextResponse.json({ ok: true });
}

