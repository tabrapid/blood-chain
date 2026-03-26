import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { dbGet, dbRun, persist } from "@/lib/db/sqlite";

async function createUser(email: string, password: string, role: string, firstName?: string, lastName?: string, name?: string) {
  const existing = await dbGet<{ id: string }>(`SELECT id FROM users WHERE email = ? LIMIT 1`, [email]);
  if (existing) return;

  const id = randomUUID();
  const passwordHash = await bcrypt.hash(password, 10);
  const now = new Date().toISOString();

  await dbRun(
    `INSERT INTO users (
      id, role, email, passwordHash, phone,
      first_name, last_name, blood_group, rh, weight_kg, height_cm, dob,
      health_history,
      total_donated_liters, badges, points, last_donation_date,
      name, region, address,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      id,
      role,
      email,
      passwordHash,
      null,
      firstName || null,
      lastName || null,
      role === "donor" ? "A" : null,
      role === "donor" ? "+" : null,
      role === "donor" ? 70 : null,
      role === "donor" ? 175 : null,
      role === "donor" ? "1990-01-01" : null,
      "{}",
      0,
      "[]",
      0,
      null,
      name || null,
      null,
      null,
      now,
      now,
    ],
  );
}

export async function POST() {
  try {
    await createUser("torabek@gmail.com", "torabek", "donor", "Torabek", "Test");
    await createUser("donor@example.com", "password", "donor", "John", "Doe");
    await createUser("hospital@example.com", "password", "hospital", undefined, undefined, "City Hospital");
    await createUser("center@example.com", "password", "blood_center", undefined, undefined, "Blood Center");

    await persist();
    return NextResponse.json({ message: "Users seeded" });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Failed to seed" }, { status: 500 });
  }
}