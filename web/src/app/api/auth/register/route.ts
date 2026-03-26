import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

const RegisterSchema = z.object({
  role: z.enum(["donor", "hospital", "blood_center"]),
  email: z.preprocess(
    (v) => (typeof v === "string" ? v.trim().toLowerCase() : v),
    z.string().email(),
  ),
  password: z.string().min(6),
  phone: z.string().optional().nullable(),

  // Donor
  first_name: z.string().optional().nullable(),
  last_name: z.string().optional().nullable(),
  blood_group: z.enum(["A", "B", "AB", "O"]).optional().nullable(),
  rh: z.enum(["+", "-"]).optional().nullable(),
  weight_kg: z.number().optional().nullable(),
  height_cm: z.number().optional().nullable(),
  dob: z.string().optional().nullable(),
  health_history: z.unknown().optional(),

  // Hospital / Center
  name: z.string().optional().nullable(),
  region: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const data = RegisterSchema.parse(body);
    const email = data.email;

    const existing = await dbGet<{ id: string }>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
    if (existing) return NextResponse.json({ error: "Email already used" }, { status: 409 });

    const now = new Date().toISOString();
    const id = randomUUID();
    const passwordHash = await bcrypt.hash(data.password, 10);

    const isDonor = data.role === "donor";

    await dbRun(
      `
      INSERT INTO users (
        id, role, email, passwordHash, phone,
        first_name, last_name, blood_group, rh, weight_kg, height_cm, dob,
        health_history,
        total_donated_liters, badges, points, last_donation_date,
        name, region, address,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        id,
        data.role,
        email,
        passwordHash,
        data.phone ?? null,
        isDonor ? data.first_name ?? null : null,
        isDonor ? data.last_name ?? null : null,
        isDonor ? data.blood_group ?? null : null,
        isDonor ? data.rh ?? null : null,
        isDonor ? (data.weight_kg ?? null) : null,
        isDonor ? (data.height_cm ?? null) : null,
        isDonor ? (data.dob ?? null) : null,
        isDonor ? (data.health_history ? JSON.stringify(data.health_history) : null) : null,
        0,
        "[]",
        0,
        null,
        isDonor ? null : data.name ?? null,
        isDonor ? null : data.region ?? null,
        isDonor ? null : data.address ?? null,
        now,
        now,
      ],
    );

    await persist();
    return NextResponse.json({ ok: true, user: { id, role: data.role, email } });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Register xatoligi";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

