import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll, dbRun, persist } from "@/lib/db/sqlite";

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const posts = await dbAll<{
    id: string;
    user_id: string;
    content: string;
    likes_count: number;
    created_at: string;
    first_name: string | null;
    last_name: string | null;
  }>(
    `SELECT p.id, p.user_id, p.content, p.likes_count, p.created_at, u.first_name, u.last_name
     FROM community_posts p
     JOIN users u ON u.id = p.user_id
     ORDER BY p.created_at DESC
     LIMIT 50`,
    [],
  );

  return NextResponse.json({
    posts: posts.map((p) => ({
      ...p,
      author: `${p.first_name ?? "Donor"} ${p.last_name ?? ""}`.trim(),
    })),
  });
}

export async function POST(req: Request) {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json().catch(() => ({}));
  const content = typeof body?.content === "string" ? body.content.trim() : "";
  const action = typeof body?.action === "string" ? body.action : "create";
  const postId = typeof body?.post_id === "string" ? body.post_id : null;

  if (action === "like") {
    if (!postId) return NextResponse.json({ error: "post_id kerak" }, { status: 400 });
    await dbRun(`UPDATE community_posts SET likes_count = likes_count + 1 WHERE id = ?`, [postId]);
    await persist();
    return NextResponse.json({ ok: true });
  }

  if (!content) return NextResponse.json({ error: "Post matni bo'sh" }, { status: 400 });
  await dbRun(
    `INSERT INTO community_posts (id, user_id, content, likes_count, created_at) VALUES (?, ?, ?, ?, ?)`,
    [randomUUID(), user.id, content, 0, new Date().toISOString()],
  );
  await persist();
  return NextResponse.json({ ok: true });
}
