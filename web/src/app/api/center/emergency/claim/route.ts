import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbRun, persist } from "@/lib/db/sqlite";

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "blood_center") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const id = typeof body?.id === "string" ? body.id : null;
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  await dbRun(`UPDATE emergency_requests SET center_id = ?, status = 'assigned' WHERE id = ?`, [user.id, id]);
  await persist();
  return NextResponse.json({ ok: true });
}

