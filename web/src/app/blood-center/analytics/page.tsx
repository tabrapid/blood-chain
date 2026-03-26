"use client";

import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from "recharts";
import { toast } from "sonner";

type InventoryRow = {
  id: string;
  blood_group: string;
  rh: string | null;
  component: string;
  quantity: number;
  expiry_date: string | null;
};

type DonorRow = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  total_donated_liters: number;
  points: number;
};

export default function CenterAnalyticsPage() {
  const [inventory, setInventory] = useState<InventoryRow[]>([]);
  const [leaderboard, setLeaderboard] = useState<DonorRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await fetch("/api/center/me", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Yuklab bo‘lmadi");
        setInventory(json.inventory ?? []);
        setLeaderboard(json.leaderboard ?? []);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Ma’lumot yuklanmadi";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  // Prepare data for charts
  const bloodGroupData = inventory.reduce((acc, item) => {
    const key = `${item.blood_group}${item.rh || ""}`;
    acc[key] = (acc[key] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const barData = Object.entries(bloodGroupData).map(([group, qty]) => ({ group, qty }));

  const componentData = inventory.reduce((acc, item) => {
    acc[item.component] = (acc[item.component] || 0) + item.quantity;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(componentData).map(([component, qty]) => ({ name: component, value: qty }));

  const COLORS = ["#8884d8", "#82ca9d", "#ffc658", "#ff7300"];

  const totalUnits = inventory.reduce((s, r) => s + (Number(r.quantity) || 0), 0);
  const expiringSoon = inventory.filter((r) => {
    if (!r.expiry_date) return false;
    const diff = new Date(r.expiry_date).getTime() - Date.now();
    return diff > 0 && diff <= 7 * 24 * 60 * 60 * 1000; // 7 days
  }).length;

  const aiInsights = [
    `Jami zaxira: ${totalUnits} birlik. ${expiringSoon} ta tez orada muddati tugaydi.`,
    `Eng ko'p ${Object.keys(bloodGroupData).length > 0 ? Object.keys(bloodGroupData).reduce((a, b) => bloodGroupData[a] > bloodGroupData[b] ? a : b) : "Noma'lum"} guruhi.`,
    `Donorlar soni: ${leaderboard.length}. Eng faol donor ${leaderboard[0]?.first_name || "Noma'lum"}.`,
  ];

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-[#E8F5E8]">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      <h1>Analytics & AI</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-card">
          <h3>Qon guruhi bo'yicha zaxira</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="qty" fill="#8884d8" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="app-card">
          <h3>Komponent bo'yicha taqsimot</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" labelLine={false} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} outerRadius={80} fill="#8884d8" dataKey="value">
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="app-card">
        <h3>AI Insights</h3>
        <div className="mt-3 space-y-2">
          {aiInsights.map((insight, i) => (
            <div key={i} className="rounded-lg bg-zinc-50 p-3 text-sm dark:bg-zinc-800 dark:text-zinc-200">{insight}</div>
          ))}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="app-card">
          <h3>Donor leaderboard</h3>
          <div className="mt-3 space-y-2 max-h-64 overflow-y-auto">
            {leaderboard.slice(0, 10).map((donor, i) => (
              <div key={donor.id} className="flex justify-between rounded-lg bg-zinc-50 p-2 text-sm dark:bg-zinc-800">
                <span>{i + 1}. {donor.first_name} {donor.last_name}</span>
                <span>{donor.total_donated_liters}L · {donor.points}pts</span>
              </div>
            ))}
          </div>
        </div>

        <div className="app-card">
          <h3>Trend analysis</h3>
          <div className="mt-3 h-64">
            <ResponsiveContainer width="100%" height="100%" minWidth={200} minHeight={200}>
              <LineChart data={barData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="group" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="qty" stroke="#8884d8" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
