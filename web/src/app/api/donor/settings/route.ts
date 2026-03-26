import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const row = await dbGet<{
    language: string;
    notifications_enabled: number;
    privacy_level: string;
  }>(`SELECT language, notifications_enabled, privacy_level FROM donor_settings WHERE user_id = ? LIMIT 1`, [user.id]);

  return NextResponse.json({
    language: row?.language ?? "uz",
    notifications_enabled: (row?.notifications_enabled ?? 1) === 1,
    privacy_level: row?.privacy_level ?? "standard",
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const language = typeof body?.language === "string" ? body.language : "uz";
  const notificationsEnabled = Boolean(body?.notifications_enabled);
  const privacyLevel = typeof body?.privacy_level === "string" ? body.privacy_level : "standard";
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO donor_settings (user_id, language, notifications_enabled, privacy_level, updated_at)
     VALUES (?, ?, ?, ?, ?)
     ON CONFLICT(user_id) DO UPDATE SET
       language = excluded.language,
       notifications_enabled = excluded.notifications_enabled,
       privacy_level = excluded.privacy_level,
       updated_at = excluded.updated_at`,
    [user.id, language, notificationsEnabled ? 1 : 0, privacyLevel, now],
  );

  await persist();
  return NextResponse.json({ ok: true });
}
