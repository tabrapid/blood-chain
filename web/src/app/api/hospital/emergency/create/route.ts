import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbRun, persist } from "@/lib/db/sqlite";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "hospital") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));

  const blood_group = body?.blood_group;
  const component = body?.component;
  const quantity = Number(body?.quantity);
  const target = body?.target === "donor" || body?.target === "center" ? body.target : null;

  const validGroups = new Set(["A", "B", "AB", "O"]);
  const validComponents = new Set(["whole_blood", "red_cells", "platelets", "plasma"]);
  if (!validGroups.has(blood_group)) return NextResponse.json({ error: "Bad blood_group" }, { status: 400 });
  if (!validComponents.has(component)) return NextResponse.json({ error: "Bad component" }, { status: 400 });
  if (!Number.isFinite(quantity) || quantity <= 0) return NextResponse.json({ error: "Bad quantity" }, { status: 400 });
  if (!target) return NextResponse.json({ error: "Bad target" }, { status: 400 });

  const status = target === "donor" ? "waiting_donor" : "pending_center";
  const deliveryStatus = target === "donor" ? "waiting_donor" : "pending";

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
      user.id,
      null,
      null,
      blood_group,
      null,
      component,
      quantity,
      status,
      0,
      deliveryStatus,
      60,
      new Date().toISOString(),
      new Date().toISOString(),
    ],
  );

  await persist();
  return NextResponse.json({ ok: true, target });
}

