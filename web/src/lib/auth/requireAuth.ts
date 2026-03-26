import { getSessionFromRequest } from "@/lib/auth/session";
import { dbGet } from "@/lib/db/sqlite";

export type UserRole = "donor" | "hospital" | "blood_center";
export type Rh = "+" | "-";
export type BloodGroup = "A" | "B" | "AB" | "O";

export async function requireUser() {
  const session = await getSessionFromRequest();
  if (!session) return null;

  const user = await dbGet<{
    id: string;
    role: UserRole;
    blood_group: BloodGroup | null;
    rh: Rh | null;
    points: number;
  }>(
    `SELECT id, role, blood_group, rh, points FROM users WHERE id = ? LIMIT 1`,
    [session.userId],
  );

  return user ?? null;
}

