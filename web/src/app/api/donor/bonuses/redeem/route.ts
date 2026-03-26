import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

const rewardCost: Record<string, number> = {
  pharmacy_5: 120,
  gym_1day: 180,
  cafe_10: 90,
};

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const code = typeof body?.code === "string" ? body.code : "";
  const cost = rewardCost[code];
  if (!cost) return NextResponse.json({ error: "Promo kodi noto'g'ri" }, { status: 400 });

  const donor = await dbGet<{ points: number }>(`SELECT points FROM users WHERE id = ? LIMIT 1`, [user.id]);
  const points = Number(donor?.points ?? 0);
  if (points < cost) return NextResponse.json({ error: "Ball yetarli emas" }, { status: 400 });

  await dbRun(`UPDATE users SET points = points - ?, updated_at = ? WHERE id = ?`, [cost, new Date().toISOString(), user.id]);
  await persist();
  return NextResponse.json({ ok: true, remain_points: points - cost });
}
