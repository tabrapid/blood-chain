import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { dbGet } from "@/lib/db/sqlite";
import { createSessionCookie } from "@/lib/auth/session";

const LoginSchema = z.object({
  role: z.enum(["donor", "hospital", "blood_center"]),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email(),
  ),
  password: z.string().min(6),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = LoginSchema.parse(body);
    const email = data.email;

    const user = await dbGet<{
      id: string;
      role: string;
      passwordHash: string;
    }>(`SELECT id, role, passwordHash FROM users WHERE email = ? LIMIT 1`, [email]);

    if (!user) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    if (user.role !== data.role) return NextResponse.json({ error: "Role mos kelmadi" }, { status: 403 });

    const ok = await bcrypt.compare(data.password, user.passwordHash);
    if (!ok) return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });

    await createSessionCookie({ userId: user.id, role: data.role });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Login xatoligi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

