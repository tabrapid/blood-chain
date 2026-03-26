"use client";

import { toast } from "sonner";
import { useState } from "react";

type Role = "donor" | "hospital" | "blood_center";

export default function RegisterForm() {
  const [role, setRole] = useState<Role>("donor");
  const [submitting, setSubmitting] = useState(false);

  // Donor fields
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O");
  const [rh, setRh] = useState("+");
  const [weightKg, setWeightKg] = useState<number | "">("");
  const [heightCm, setHeightCm] = useState<number | "">("");
  const [dob, setDob] = useState("");
  const [healthHistory, setHealthHistory] = useState("");

  // Hospital/Center fields
  const [orgName, setOrgName] = useState("");
  const [region, setRegion] = useState("");
  const [address, setAddress] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const payload: Record<string, unknown> = { role, phone, email: normalizedEmail, password };

      if (role === "donor") {
        payload.first_name = firstName;
        payload.last_name = lastName;
        payload.blood_group = bloodGroup;
        payload.rh = rh;
        payload.weight_kg = weightKg === "" ? null : weightKg;
        payload.height_cm = heightCm === "" ? null : heightCm;
        payload.dob = dob ? dob : null;
        payload.health_history = healthHistory ? { raw: healthHistory } : {};
      } else {
        payload.name = orgName;
        payload.region = region;
        payload.address = address;
      }

      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Register xatoligi");

      toast.success("Register yakunlandi. Endi login qiling.");
      const loginUrl = `/login?email=${encodeURIComponent(normalizedEmail)}&role=${encodeURIComponent(role)}`;
      window.location.href = loginUrl;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Register xatoligi";
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="w-full max-w-2xl">
      <div className="rounded-2xl border border-slate-200/80 bg-white/80 p-6 shadow-[0_18px_36px_-28px_rgba(15,23,42,0.8)] backdrop-blur-md dark:border-slate-700 dark:bg-slate-900/70">
        <h2 className="text-xl font-semibold">Register</h2>
        <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
          Role tanlang va kerakli ma’lumotlarni kiriting.
        </p>

        <form onSubmit={onSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium">Role</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value as Role)}
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
            >
              <option value="donor">Donor</option>
              <option value="hospital">Hospital</option>
              <option value="blood_center">Blood Center</option>
            </select>
          </div>

          {role === "donor" ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium">Ism</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  required
                  placeholder="Masalan: Ali"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Familiya</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  required
                  placeholder="Masalan: Karimov"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Telefon</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+998..."
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="you@email.com"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Qon guruhi</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="O">O</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Rh faktor</label>
                <select
                  value={rh}
                  onChange={(e) => setRh(e.target.value)}
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <option value="+">+</option>
                  <option value="-">-</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Vazn (kg)</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={weightKg}
                  onChange={(e) => setWeightKg(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="70"
                  type="number"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Bo‘y (cm)</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={heightCm}
                  onChange={(e) => setHeightCm(e.target.value === "" ? "" : Number(e.target.value))}
                  placeholder="170"
                  type="number"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Tug‘ilgan sana</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={dob}
                  onChange={(e) => setDob(e.target.value)}
                  placeholder="YYYY-MM-DD"
                  type="date"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Sog‘liq tarixi / tahlillar</label>
                <textarea
                  className="min-h-[90px] w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={healthHistory}
                  onChange={(e) => setHealthHistory(e.target.value)}
                  placeholder="Gemoglobin, infeksiya testlari va h.k. (demo)"
                />
              </div>
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Nomi</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  required
                  placeholder="Masalan: Toshkent Hospital"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Hudud</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  required
                  placeholder="Toshkent"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium">Manzil</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  required
                  placeholder="Ko‘cha, uy"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Kontakt raqam</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+998..."
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium">Email</label>
                <input
                  className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  type="email"
                  placeholder="you@email.com"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-sm font-medium">Password</label>
            <input
              className="w-full rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              required
              placeholder="••••••••"
            />
          </div>

          <button
            disabled={submitting}
            className="flex h-11 w-full items-center justify-center rounded-xl bg-gradient-to-r from-emerald-600 to-teal-500 text-sm font-semibold text-white shadow-[0_14px_30px_-16px_rgba(5,150,105,0.95)] hover:brightness-105 disabled:opacity-60"
          >
            {submitting ? "Yaratilmoqda..." : "Create account"}
          </button>

          <p className="text-center text-xs text-slate-500 dark:text-slate-400">
            Akkaunt yaratgandan keyin `Login` orqali kiring.
          </p>
        </form>
      </div>
    </div>
  );
}

