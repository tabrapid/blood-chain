"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";

type DonorStats = {
  total_donations: number;
  points: number;
  level: number;
  streak_days: number;
  badges: string[];
  rank: number;
  total_donors: number;
};

export default function DonorRewardsPage() {
  const [stats, setStats] = useState<DonorStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch("/api/donor/me", { cache: "no-store" });
        const json = await res.json();
        if (!res.ok) throw new Error(json?.error ?? "Statistika yuklanmadi");
        setStats({
          total_donations: json.total_donated_liters || 0,
          points: json.points || 0,
          level: Math.floor((json.points || 0) / 100) + 1,
          streak_days: json.streak_days || 0,
          badges: json.badges || [],
          rank: json.rank || 0,
          total_donors: json.total_donors || 0,
        });
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : "Statistika yuklanmadi";
        toast.error(message);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  if (loading) {
    return <div className="animate-pulse rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">Yuklanmoqda...</div>;
  }

  const levelProgress = stats ? ((stats.points % 100) / 100) * 100 : 0;
  const nextLevelPoints = stats ? ((stats.level) * 100) : 100;

  return (
    <div className="space-y-4">
      <h1>Bonus va Gamification</h1>

      {/* Level va Points */}
      <div className="app-card">
        <h3>🎯 Daraja va Ballar</h3>
        <div className="mt-3 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Daraja {stats?.level || 1}</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">{stats?.points || 0} ball</span>
          </div>
          <div className="w-full bg-zinc-200 rounded-full h-2 dark:bg-zinc-700">
            <div className="bg-blue-500 h-2 rounded-full transition-all duration-300" style={{ width: `${levelProgress}%` }}></div>
          </div>
          <p className="text-xs text-zinc-600 dark:text-zinc-300">Keyingi darajaga {nextLevelPoints - (stats?.points || 0)} ball kerak</p>
        </div>
      </div>

      {/* Streak */}
      <div className="app-card">
        <h3>🔥 Davomiylik Seriyasi</h3>
        <div className="mt-3">
          <div className="text-center">
            <div className="text-3xl font-bold text-orange-500">{stats?.streak_days || 0}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">ketma-ket kun</p>
          </div>
          <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-300">Har 3 oyda muntazam qon topshirish uchun bonus ball!</p>
        </div>
      </div>

      {/* Badges */}
      <div className="app-card">
        <h3>🏅 Yutuqlar va Unvonlar</h3>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <div className={`rounded-xl p-3 text-sm text-center ${stats?.badges?.includes('bronze') ? 'bg-[#CD7F32] text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            🥉 Bronza Donor<br/>
            <span className="text-xs">1-marta donor</span>
          </div>
          <div className={`rounded-xl p-3 text-sm text-center ${stats?.badges?.includes('silver') ? 'bg-[#C0C0C0] text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            🥈 Kumush Donor<br/>
            <span className="text-xs">5-marta donor</span>
          </div>
          <div className={`rounded-xl p-3 text-sm text-center ${stats?.badges?.includes('gold') ? 'bg-[#FFD700] text-zinc-900' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            🥇 Oltin Donor<br/>
            <span className="text-xs">10+ marta donor</span>
          </div>
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className={`rounded-xl p-3 text-sm text-center ${stats?.badges?.includes('hero') ? 'bg-red-500 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            🦸 Qahramon Donor<br/>
            <span className="text-xs">Favqulodda holatda yordam</span>
          </div>
          <div className={`rounded-xl p-3 text-sm text-center ${stats?.badges?.includes('champion') ? 'bg-purple-500 text-white' : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'}`}>
            👑 Chempion Donor<br/>
            <span className="text-xs">50+ marta donor</span>
          </div>
        </div>
      </div>

      {/* Leaderboard */}
      <div className="app-card">
        <h3>📊 Donorlar Reytingi</h3>
        <div className="mt-3">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Sizning o'rningiz</span>
            <span className="text-sm text-zinc-600 dark:text-zinc-300">#{stats?.rank || 0} / {stats?.total_donors || 0}</span>
          </div>
          <div className="text-center py-4">
            <div className="text-2xl font-bold text-blue-500">#{stats?.rank || 0}</div>
            <p className="text-xs text-zinc-600 dark:text-zinc-300">jami donorlar ichida</p>
          </div>
        </div>
      </div>

      {/* Rewards */}
      <div className="app-card">
        <h3>🎁 Mukofotlar va Sovg'alar</h3>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-zinc-200 bg-[#E8F5E8] p-3 dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100">
            <div className="font-medium">🛍️ Hamkor Do'kon Chegirmalari</div>
            <p className="text-xs mt-1">Kafe, restoran va do'konlarda chegirma</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-[#FFF3E0] p-3 dark:border-zinc-700 dark:bg-orange-950/30 dark:text-orange-100">
            <div className="font-medium">🎫 Lotereya</div>
            <p className="text-xs mt-1">Har donor avtomatik ravishda qatnashadi</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-[#E3F2FD] p-3 dark:border-zinc-700 dark:bg-blue-950/30 dark:text-blue-100">
            <div className="font-medium">📜 Sertifikat</div>
            <p className="text-xs mt-1">CV yoki rezyumega qo'shish uchun</p>
          </div>
        </div>
        <button className="btn-success mt-4 w-full">🎁 Bonus Do'konini Ochish</button>
      </div>

      {/* Social Impact */}
      <div className="app-card">
        <h3>❤️ Ijtimoiy Ta'sir</h3>
        <div className="mt-3 space-y-3">
          <div className="text-center">
            <div className="text-2xl font-bold text-red-500">{(stats?.total_donations || 0) * 3}</div>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">insonni qutqargan qoningiz</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-[#FCE4EC] p-3 dark:border-zinc-700 dark:bg-pink-950/30 dark:text-pink-100">
            <div className="font-medium">💝 Haqiqiy Hikoyalar</div>
            <p className="text-xs mt-1">Qutqarilgan bemorlarning minnatdorchilik xatlari</p>
          </div>
        </div>
      </div>

      {/* Referal */}
      <div className="app-card">
        <h3>👥 Do'st Taklif Qilish</h3>
        <div className="mt-3">
          <p className="text-sm text-zinc-600 dark:text-zinc-300 mb-3">Do'stingizni olib kelgan donor bonus ball oladi!</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Do'stingizni taklif qiling..."
              className="app-input h-12 flex-1"
              readOnly
              value="Taklif havolasi: bloodchain.uz/invite/ABC123"
            />
            <button className="btn-primary px-4">📤 Ulashish</button>
          </div>
        </div>
      </div>

      {/* Events */}
      <div className="app-card">
        <h3>🎉 Tadbirlar va Challenge'lar</h3>
        <div className="mt-3 space-y-3">
          <div className="rounded-xl border border-zinc-200 bg-[#F3E5F5] p-3 dark:border-zinc-700 dark:bg-purple-950/30 dark:text-purple-100">
            <div className="font-medium">🏃 Donorlar Haftaligi</div>
            <p className="text-xs mt-1">Maxsus bonuslar va tadbirlar</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-[#E8F5E8] p-3 dark:border-zinc-700 dark:bg-green-950/30 dark:text-green-100">
            <div className="font-medium">🏆 Universitetlar O'rtasida Musobaqa</div>
            <p className="text-xs mt-1">Eng ko'p donor bo'lgan talabalar guruhi g'olib</p>
          </div>
        </div>
      </div>
    </div>
  );
}
