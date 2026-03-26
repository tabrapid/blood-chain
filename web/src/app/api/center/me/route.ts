import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll } from "@/lib/db/sqlite";
import { dbGet } from "@/lib/db/sqlite";

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "blood_center") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const center = await dbGet<{
    id: string;
    email: string | null;
    name: string | null;
    region: string | null;
    address: string | null;
  }>(`SELECT id, email, name, region, address FROM users WHERE id = ? LIMIT 1`, [user.id]);

  const inventory = await dbAll<{
    id: string;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number;
    expiry_date: string | null;
  }>(
    `SELECT id, blood_group, rh, component, quantity, expiry_date FROM blood_inventory WHERE center_id = ? ORDER BY created_at DESC LIMIT 100`,
    [user.id],
  );

  const claimed = await dbAll<{
    id: string;
    hospital_id: string | null;
    center_id: string | null;
    status: string;
    donor_approved: number;
    delivery_status: string;
    delivery_eta_demo_minutes: number | null;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number | null;
  }>(
    `SELECT id, hospital_id, center_id, status, donor_approved, delivery_status, delivery_eta_demo_minutes,
            blood_group, rh, component, quantity
     FROM emergency_requests
     WHERE center_id = ?
     ORDER BY created_at DESC
     LIMIT 50`,
    [user.id],
  );

  const unassigned = await dbAll<{
    id: string;
    hospital_id: string | null;
    center_id: string | null;
    status: string;
    donor_approved: number;
    delivery_status: string;
    delivery_eta_demo_minutes: number | null;
    blood_group: string;
    rh: string | null;
    component: string;
    quantity: number | null;
  }>(
    `SELECT id, hospital_id, center_id, status, donor_approved, delivery_status, delivery_eta_demo_minutes,
            blood_group, rh, component, quantity
     FROM emergency_requests
     WHERE center_id IS NULL AND status = 'pending_center'
     ORDER BY created_at DESC
     LIMIT 50`,
    [],
  );

  const leaderboard = await dbAll<{
    id: string;
    first_name: string | null;
    last_name: string | null;
    total_donated_liters: number;
    points: number;
  }>(
    `SELECT id, first_name, last_name, total_donated_liters, points
     FROM users
     WHERE role = 'donor'
     ORDER BY total_donated_liters DESC, points DESC
     LIMIT 10`,
    [],
  );

  const donationQueue = await dbAll<{
    id: string;
    donor_id: string;
    slot_time: string;
    status: string;
    first_name: string | null;
    last_name: string | null;
    blood_group: string | null;
    rh: string | null;
  }>(
    `SELECT s.id, s.donor_id, s.slot_time, s.status, u.first_name, u.last_name, u.blood_group, u.rh
     FROM donor_slots s
     JOIN users u ON u.id = s.donor_id
     WHERE s.center_id = ? AND s.status IN ('queued_for_center', 'booked', 'confirmed', 'arrived')
     ORDER BY s.created_at ASC
     LIMIT 50`,
    [user.id],
  );

  return NextResponse.json({
    center,
    inventory: inventory.map((r) => ({
      id: r.id,
      blood_group: r.blood_group,
      rh: r.rh,
      component: r.component,
      quantity: r.quantity,
      expiry_date: r.expiry_date,
    })),
    claimed_requests: claimed.map((r) => ({
      id: r.id,
      hospital_id: r.hospital_id,
      center_id: r.center_id,
      status: r.status,
      donor_approved: r.donor_approved === 1,
      delivery_status: r.delivery_status,
      delivery_eta_demo_minutes: r.delivery_eta_demo_minutes,
      blood_group: r.blood_group,
      component: r.component,
      quantity: r.quantity,
    })),
    unassigned_requests: unassigned.map((r) => ({
      id: r.id,
      hospital_id: r.hospital_id,
      center_id: r.center_id,
      status: r.status,
      donor_approved: r.donor_approved === 1,
      delivery_status: r.delivery_status,
      delivery_eta_demo_minutes: r.delivery_eta_demo_minutes,
      blood_group: r.blood_group,
      component: r.component,
      quantity: r.quantity,
    })),
    leaderboard: leaderboard.map((d) => ({
      id: d.id,
      first_name: d.first_name,
      last_name: d.last_name,
      total_donated_liters: d.total_donated_liters ?? 0,
      points: d.points,
    })),
    donation_queue: donationQueue.map((r) => ({
      id: r.id,
      donor_id: r.donor_id,
      slot_time: r.slot_time,
      status: r.status,
      donor_name: `${r.first_name ?? "Donor"} ${r.last_name ?? ""}`.trim(),
      blood_group: r.blood_group,
      rh: r.rh,
    })),
  });
}

