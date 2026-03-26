import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll, dbGet } from "@/lib/db/sqlite";

function toIsoDate(isoOrDate: string | null | undefined) {
  if (!isoOrDate) return null;
  try {
    const d = new Date(isoOrDate);
    return d.toISOString().slice(0, 10);
  } catch {
    return null;
  }
}

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profileRow = await dbGet<{
    first_name: string | null;
    last_name: string | null;
    blood_group: string | null;
    rh: string | null;
    total_donated_liters: number;
    badges: string | null;
    points: number;
    last_donation_date: string | null;
    dob: string | null;
  }>(`
    SELECT first_name, last_name, blood_group, rh, total_donated_liters, badges, points, last_donation_date, dob
    FROM users
    WHERE id = ?
    LIMIT 1
  `, [user.id]);

  const slots = await dbAll<{
    id: string;
    slot_time: string;
    status: string;
    eta_demo_minutes: number | null;
  }>(
    `SELECT id, slot_time, status, eta_demo_minutes FROM donor_slots WHERE donor_id = ? ORDER BY slot_time ASC LIMIT 20`,
    [user.id],
  );

  const events = await dbAll<{
    id: string;
    hemoglobin: number | null;
    infection_tests: string | null;
    measured_at: string;
  }>(
    `SELECT id, hemoglobin, infection_tests, measured_at FROM donor_health_events WHERE donor_id = ? ORDER BY measured_at DESC LIMIT 12`,
    [user.id],
  );

  const notifications = await dbAll<{
    id: string;
    type: string;
    message: string;
    read: number;
    created_at: string;
  }>(
    `SELECT id, type, message, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20`,
    [user.id],
  );

  const emergencies = await dbAll<{
    id: string;
    blood_group: string;
    component: string;
    quantity: number;
    status: string;
    donor_approved: number;
  }>(
    `SELECT id, blood_group, component, quantity, status, donor_approved
     FROM emergency_requests
     WHERE donor_id = ?
     ORDER BY created_at DESC
     LIMIT 20`,
    [user.id],
  );

  const emergencyFeed = await dbAll<{
    id: string;
    blood_group: string;
    component: string;
    quantity: number;
    status: string;
  }>(
    `SELECT id, blood_group, component, quantity, status
     FROM emergency_requests
     WHERE donor_id IS NULL
       AND blood_group = COALESCE((SELECT blood_group FROM users WHERE id = ?), '')
       AND status IN ('waiting_donor')
     ORDER BY created_at DESC
     LIMIT 20`,
    [user.id],
  );

  const donations = await dbAll<{
    id: string;
    blood_group: string | null;
    rh: string | null;
    component: string | null;
    liters: number;
    donated_at: string;
  }>(
    `SELECT id, blood_group, rh, component, liters, donated_at
     FROM donor_donations
     WHERE donor_id = ?
     ORDER BY donated_at DESC
     LIMIT 30`,
    [user.id],
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
     LIMIT 20`,
    [],
  );

  const donated = Number(profileRow?.total_donated_liters ?? 0);
  const level = donated >= 10 ? "Elite" : donated >= 5 ? "Advanced" : donated >= 2 ? "Intermediate" : "Beginner";

  const profile = profileRow
    ? {
        first_name: profileRow.first_name,
        last_name: profileRow.last_name,
        blood_group: profileRow.blood_group,
        rh: profileRow.rh,
        total_donated_liters: profileRow.total_donated_liters ?? null,
        points: profileRow.points ?? null,
        dob: profileRow.dob,
        badges: (() => {
          try {
            return JSON.parse(profileRow.badges ?? "[]");
          } catch {
            return [];
          }
        })(),
        last_donation_date: toIsoDate(profileRow.last_donation_date),
      }
    : null;

  return NextResponse.json({
    profile,
    donor_level: level,
    slots: slots.map((s) => ({
      id: s.id,
      slot_time: new Date(s.slot_time).toISOString(),
      status: s.status,
      eta_demo_minutes: s.eta_demo_minutes,
    })),
    events: events.map((e) => ({
      id: e.id,
      hemoglobin: e.hemoglobin,
      infection_tests: (() => {
        if (!e.infection_tests) return null;
        try {
          return JSON.parse(e.infection_tests);
        } catch {
          return null;
        }
      })(),
      measured_at: new Date(e.measured_at).toISOString(),
    })),
    notifications: notifications.map((n) => ({
      id: n.id,
      type: n.type,
      message: n.message,
      read: n.read === 1,
      created_at: n.created_at,
    })),
    emergencies: emergencies.map((r) => ({
      id: r.id,
      blood_group: r.blood_group,
      component: r.component,
      quantity: r.quantity,
      status: r.status,
      donor_approved: r.donor_approved === 1,
    })),
    emergency_feed: emergencyFeed,
    donations,
    donation_count: donations.length,
    leaderboard: leaderboard.map((r) => ({
      id: r.id,
      first_name: r.first_name,
      last_name: r.last_name,
      total_donated_liters: r.total_donated_liters ?? 0,
      points: r.points ?? 0,
    })),
  });
}

