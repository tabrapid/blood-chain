import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll } from "@/lib/db/sqlite";

function pseudoDistance(id: string) {
  let sum = 0;
  for (const ch of id) sum += ch.charCodeAt(0);
  return (sum % 12) + 1;
}

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const centers = await dbAll<{
    id: string;
    name: string | null;
    region: string | null;
    address: string | null;
  }>(`SELECT id, name, region, address FROM users WHERE role = 'blood_center' ORDER BY created_at DESC LIMIT 30`, []);

  const queueRows = await dbAll<{ center_id: string; cnt: number }>(
    `SELECT center_id, COUNT(*) as cnt
     FROM donor_slots
     WHERE status IN ('queued_for_center', 'booked', 'confirmed', 'arrived')
     GROUP BY center_id`,
    [],
  );
  const queueMap = new Map(queueRows.map((r) => [r.center_id, Number(r.cnt)]));

  return NextResponse.json({
    centers: centers.map((c) => ({
      ...c,
      distance_km: pseudoDistance(c.id),
      queue_load: queueMap.get(c.id) ?? 0,
      rating: 4 + ((pseudoDistance(c.id) % 10) / 10),
    })),
  });
}
