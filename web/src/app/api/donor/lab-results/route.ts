import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth/requireAuth";
import { dbAll } from "@/lib/db/sqlite";

export async function GET() {
  const user = await requireUser();
  if (!user || user.role !== "donor") return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const results = await dbAll<{
    id: string;
    request_id: string;
    test_type: string | null;
    details_json: string | null;
    hospital_name: string | null;
    created_at: string;
    hemoglobin: number | null;
    blood_pressure: string | null;
    leukocytes: number | null;
    platelets: number | null;
    hiv: string | null;
    hepatitis_b: string | null;
    hepatitis_c: string | null;
    syphilis: string | null;
  }>(
    `SELECT
      lr.id, lr.request_id, lr.test_type, lr.details_json, lr.created_at, lr.hemoglobin, lr.blood_pressure, lr.leukocytes, lr.platelets,
      lr.hiv, lr.hepatitis_b, lr.hepatitis_c, lr.syphilis,
      (SELECT u.name FROM users u WHERE u.id = lr.hospital_id) AS hospital_name
     FROM lab_results lr
     WHERE lr.donor_id = ?
     ORDER BY lr.created_at DESC
     LIMIT 30`,
    [user.id],
  );

  return NextResponse.json({
    results: results.map((r) => ({
      ...r,
      details: (() => {
        if (!r.details_json) return {};
        try {
          return JSON.parse(r.details_json);
        } catch {
          return {};
        }
      })(),
    })),
  });
}

