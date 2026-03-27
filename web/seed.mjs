import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import prisma from "./src/lib/db/prisma.ts";

async function seed() {
  // Check if user exists
  const existing = await prisma.user.findUnique({ where: { email: "torabek@gmail.com" } });
  if (existing) {
    console.log("User already exists");
    return;
  }

  // Create user
  const id = randomUUID();
  const passwordHash = await bcrypt.hash("torabek", 10);
  const now = new Date();

  await prisma.user.create({
    data: {
      id,
      role: "donor",
      email: "torabek@gmail.com",
      passwordHash,
      firstName: "Torabek",
      lastName: "Test",
      bloodGroup: "A",
      rh: "+",
      weightKg: 70,
      heightCm: 175,
      dob: new Date("1990-01-01"),
      healthHistory: {},
      totalDonatedLiters: 0,
      badges: [],
      points: 0,
      createdAt: now,
      updatedAt: now,
    },
  });

  console.log("User created");
}

seed().catch(console.error);
