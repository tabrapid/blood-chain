import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { randomUUID } from "crypto";
import { dbAll, dbRun } from "@/lib/db/sqlite";

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "hospital") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const enRoute = await dbAll<{
    id: string;
    updated_at: string;
    delivery_eta_demo_minutes: number | null;
    hospital_id: string | null;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number;
  }>(
    `SELECT id, updated_at, delivery_eta_demo_minutes, hospital_id, blood_group, rh, component, quantity
     FROM emergency_requests
     WHERE hospital_id = ? AND delivery_status = 'en_route'`,
    [user.id],
  );

  const nowMs = Date.now();
  for (const row of enRoute) {
    const start = new Date(row.updated_at).getTime();
    const etaMs = Math.max(1, Number(row.delivery_eta_demo_minutes ?? 1)) * 60 * 1000;
    if (nowMs - start < etaMs) continue;

    const existing = await dbAll<{ id: string }>(
      `SELECT id FROM blood_inventory
       WHERE hospital_id = ? AND blood_group = ? AND rh = ? AND component = ?
       LIMIT 1`,
      [user.id, row.blood_group, row.rh, row.component],
    );
    if (existing[0]) {
      await dbRun(`UPDATE blood_inventory SET quantity = quantity + ?, updated_at = ? WHERE id = ?`, [row.quantity, new Date().toISOString(), existing[0].id]);
    } else {
      await dbRun(
        `INSERT INTO blood_inventory (id, center_id, hospital_id, component, blood_group, rh, quantity, expiry_date, created_at, updated_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [randomUUID(), null, user.id, row.component, row.blood_group, row.rh ?? "+", row.quantity, null, new Date().toISOString(), new Date().toISOString()],
      );
    }

    await dbRun(
      `UPDATE emergency_requests
       SET status = 'completed', delivery_status = 'delivered', updated_at = ?
       WHERE id = ?`,
      [new Date().toISOString(), row.id],
    );
  }

  const inventory = await dbAll<{
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number;
    expiry_date: string | null;
  }>(
    `SELECT blood_group, rh, component, quantity, expiry_date FROM blood_inventory WHERE hospital_id = ? ORDER BY created_at DESC`,
    [user.id],
  );

  const requests = await dbAll<{
    id: string;
    status: string;
    donor_approved: number;
    delivery_status: string;
    delivery_eta_demo_minutes: number | null;
    center_id: string | null;
    donor_id: string | null;
    donor_name: string | null;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number | null;
    created_at: string;
    updated_at: string;
  }>(
    `SELECT
      id, status, donor_approved, delivery_status, delivery_eta_demo_minutes,
      center_id, donor_id, blood_group, rh, component, quantity, created_at, updated_at,
      (SELECT TRIM(COALESCE(u.first_name, 'Donor') || ' ' || COALESCE(u.last_name, '')) FROM users u WHERE u.id = emergency_requests.donor_id) AS donor_name
     FROM emergency_requests
     WHERE hospital_id = ?
     ORDER BY created_at DESC
     LIMIT 30`,
    [user.id],
  );

  const centerStocks = await dbAll<{
    center_id: string;
    center_name: string | null;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number;
  }>(
    `SELECT bi.center_id, u.name as center_name, bi.blood_group, bi.rh, bi.component, bi.quantity
     FROM blood_inventory bi
     JOIN users u ON u.id = bi.center_id
     WHERE bi.center_id IS NOT NULL AND bi.quantity > 0
     ORDER BY bi.updated_at DESC
     LIMIT 120`,
    [],
  );

  return NextResponse.json({
    inventory,
    requests: requests.map((r) => ({
      id: r.id,
      status: r.status,
      donor_approved: r.donor_approved === 1,
      delivery_status: r.delivery_status,
      delivery_eta_demo_minutes: r.delivery_eta_demo_minutes,
      center_id: r.center_id,
      donor_id: r.donor_id,
      donor_name: r.donor_name,
      blood_group: r.blood_group,
      rh: r.rh,
      component: r.component,
      quantity: r.quantity,
      created_at: r.created_at,
      updated_at: r.updated_at,
    })),
    center_stocks: centerStocks,
  });
}

