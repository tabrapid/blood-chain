import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { dbGet, dbRun, persist } from "./src/lib/db/sqlite.js";

async function seed() {
  // Check if user exists
  const existing = await dbGet<{ id: string }>(`SELECT id FROM users WHERE email = ? LIMIT 1`, ["torabek@gmail.com"]);
  if (existing) {
    console.log("User already exists");
    return;
  }

  // Create user
  const id = randomUUID();
  const passwordHash = await bcrypt.hash("torabek", 10);
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
      "donor",
      "torabek@gmail.com",
      passwordHash,
      null,
      "Torabek",
      "Test",
      "A",
      "+",
      70,
      175,
      "1990-01-01",
      "{}",
      0,
      "[]",
      0,
      null,
      null,
      null,
      null,
      now,
      now,
    ],
  );

  await persist();
  console.log("User created");
}

seed().catch(console.error);