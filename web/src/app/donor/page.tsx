"use client";

import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { QRCodeSVG } from "qrcode.react";

type DonorMe = {
  profile: {
    first_name: string | null;
    last_name: string | null;
    blood_group: string | null;
    rh: string | null;
    total_donated_liters: number | null;
    points: number | null;
    last_donation_date: string | null;
    dob?: string | null;
  } | null;
  slots: Array<{ id: string; slot_time: string; status: string }>;
  notifications: Array<{ id: string; message: string }>;
  emergency_feed: Array<{ id: string; blood_group: string; component: string; quantity: number }>;
  donations: Array<{ id: string; blood_group: string | null; rh: string | null; component: string | null; liters: number; donated_at: string }>;
  leaderboard: Array<{ id: string; first_name: string | null; last_name: string | null; total_donated_liters: number; points: number }>;
  donation_count: number;
  donor_level: string;
};

type Center = { id: string; name: string | null; region: string | null; address: string | null; distance_km: number; queue_load: number; rating: number };
type Setting = { language: string; notifications_enabled: boolean; privacy_level: string };
type Post = { id: string; content: string; likes_count: number; author: string };
const DEFAULT_SETTINGS: Setting = { language: "uz", notifications_enabled: true, privacy_level: "standard" };

// Language translations
const translations = {
  uz: {
    // Menu and navigation
    personalPanel: "Shaxsiy panel",
    donorMenu: "Donor Menyu",
    dashboard: "Dashboard",
    health: "Salomatlik",
    booking: "Booking",
    map: "Xarita",
    rewards: "Bonus & Gamification",
    profile: "Profil",

    // Welcome and main messages
    welcome: "Xush kelibsiz",
    saveLifeMessage: "Siz bugun kimningdir hayotini saqlab qolishingiz mumkin ❤️",
    bloodGroup: "Qon guruhi",
    nextDonation: "Keyingi topshirish",
    days: "kun",
    lives: "hayot",
    streak: "Streak",

    // Emergency
    emergencyNeeded: "Sizning qon guruhingizga ehtiyoj bor",

    // Stats labels
    totalDonations: "Jami donorlik",
    litersDonated: "Topshirilgan litr",
    livesSaved: "Saqlangan hayotlar",
    bonusPoints: "Bonus ball",

    // Profile section
    fullName: "F.I.Sh",
    age: "Yosh",
    bloodType: "Qon guruhi",
    donationCount: "Topshirganlar soni",
    donorLevel: "Donor darajasi",
    donorId: "Donor ID + QR",

    // Health section
    healthCenter: "Salomatlik markazi",
    healthDescription: "Gemoglobin, infektsiya tekshiruvi va AI tavsiyalar bir joyda.",
    hemoglobin: "Gemoglobin",
    infectionScreening: "Infeksiya skrining",
    normal: "Me'yorida",
    aiAssistant: "AI yordamchi savolingizni kutmoqda.",

    // Booking section
    donateFlow: "Donate Flow + 📅 Booking",
    reminderActive: "Reminder faol",

    // Map section
    mapTitle: "Xarita (Centerlar)",
    selectedCenter: "Tanlangan markaz",
    occupancy: "Bandlik",
    queue: "Queue",
    distance: "Distance",
    open: "Ochiq",

    // Leaderboard
    ratingAndHistory: "Reyting va tarix",
    history: "Tarix",

    // Rewards shop
    rewardsShop: "Bonuslar do'koni",
    points: "Ball",

    // Community
    community: "Hamjamiyat",

    // Emergency
    sos: "SOS",
    noEmergency: "Hozircha emergency yo'q.",
    notifications: "Bildirishnomalar",

    // Gamification
    gamification: "Gamifikatsiya",
    unlocked: "Ochildi",
    locked: "Yopiq",

    // Settings
    settings: "Sozlamalar",
    language: "Til",
    privacy: "Maxfiylik",
    save: "Saqlash",
    standard: "Standard",
    private: "Shaxsiy",
    public: "Ommaviy",
    uzbek: "O'zbekcha",
    russian: "Русский",
    english: "English",
    settingsSaved: "Sozlamalar saqlandi",
    settingsNotSaved: "Sozlamalar saqlanmadi",
  },
  ru: {
    // Menu and navigation
    personalPanel: "Личный кабинет",
    donorMenu: "Меню донора",
    dashboard: "Панель управления",
    health: "Здоровье",
    booking: "Бронирование",
    map: "Карта",
    rewards: "Бонусы и Геймификация",
    profile: "Профиль",

    // Welcome and main messages
    welcome: "Добро пожаловать",
    saveLifeMessage: "Сегодня вы можете спасти чью-то жизнь ❤️",
    bloodGroup: "Группа крови",
    nextDonation: "Следующая сдача",
    days: "дней",
    lives: "жизней",
    streak: "Стрик",

    // Emergency
    emergencyNeeded: "Нужна ваша группа крови",

    // Stats labels
    totalDonations: "Всего донаций",
    litersDonated: "Сдано литров",
    livesSaved: "Спасенных жизней",
    bonusPoints: "Бонусные баллы",

    // Profile section
    fullName: "Ф.И.О",
    age: "Возраст",
    bloodType: "Группа крови",
    donationCount: "Количество сдач",
    donorLevel: "Уровень донора",
    donorId: "ID донора + QR",

    // Health section
    healthCenter: "Центр здоровья",
    healthDescription: "Гемоглобин, проверка инфекций и AI рекомендации в одном месте.",
    hemoglobin: "Гемоглобин",
    infectionScreening: "Скрининг инфекций",
    normal: "Нормально",
    aiAssistant: "AI помощник ждет вашего вопроса.",

    // Booking section
    donateFlow: "Процесс донации + 📅 Бронирование",
    reminderActive: "Напоминание активно",

    // Map section
    mapTitle: "Карта (Центры)",
    selectedCenter: "Выбранный центр",
    occupancy: "Загруженность",
    queue: "Очередь",
    distance: "Расстояние",
    open: "Открыт",

    // Leaderboard
    ratingAndHistory: "Рейтинг и история",
    history: "История",

    // Rewards shop
    rewardsShop: "Магазин бонусов",
    points: "Баллы",

    // Community
    community: "Сообщество",

    // Emergency
    sos: "SOS",
    noEmergency: "Пока нет экстренных ситуаций.",
    notifications: "Уведомления",

    // Gamification
    gamification: "Геймификация",
    unlocked: "Разблокировано",
    locked: "Заблокировано",

    // Settings
    settings: "Настройки",
    language: "Язык",
    privacy: "Конфиденциальность",
    save: "Сохранить",
    standard: "Стандартный",
    private: "Приватный",
    public: "Публичный",
    uzbek: "O'zbekcha",
    russian: "Русский",
    english: "English",
    settingsSaved: "Настройки сохранены",
    settingsNotSaved: "Настройки не сохранены",
  },
  en: {
    // Menu and navigation
    personalPanel: "Personal Panel",
    donorMenu: "Donor Menu",
    dashboard: "Dashboard",
    health: "Health",
    booking: "Booking",
    map: "Map",
    rewards: "Rewards & Gamification",
    profile: "Profile",

    // Welcome and main messages
    welcome: "Welcome",
    saveLifeMessage: "Today you can save someone's life ❤️",
    bloodGroup: "Blood Group",
    nextDonation: "Next Donation",
    days: "days",
    lives: "lives",
    streak: "Streak",

    // Emergency
    emergencyNeeded: "Your blood group is needed",

    // Stats labels
    totalDonations: "Total Donations",
    litersDonated: "Liters Donated",
    livesSaved: "Lives Saved",
    bonusPoints: "Bonus Points",

    // Profile section
    fullName: "Full Name",
    age: "Age",
    bloodType: "Blood Type",
    donationCount: "Donation Count",
    donorLevel: "Donor Level",
    donorId: "Donor ID + QR",

    // Health section
    healthCenter: "Health Center",
    healthDescription: "Hemoglobin, infection screening and AI recommendations all in one place.",
    hemoglobin: "Hemoglobin",
    infectionScreening: "Infection Screening",
    normal: "Normal",
    aiAssistant: "AI assistant is waiting for your question.",

    // Booking section
    donateFlow: "Donate Flow + 📅 Booking",
    reminderActive: "Reminder active",

    // Map section
    mapTitle: "Map (Centers)",
    selectedCenter: "Selected center",
    occupancy: "Occupancy",
    queue: "Queue",
    distance: "Distance",
    open: "Open",

    // Leaderboard
    ratingAndHistory: "Rating and History",
    history: "History",

    // Rewards shop
    rewardsShop: "Rewards Shop",
    points: "Points",

    // Community
    community: "Community",

    // Emergency
    sos: "SOS",
    noEmergency: "No emergency currently.",
    notifications: "Notifications",

    // Gamification
    gamification: "Gamification",
    unlocked: "Unlocked",
    locked: "Locked",

    // Settings
    settings: "Settings",
    language: "Language",
    privacy: "Privacy",
    save: "Save",
    standard: "Standard",
    private: "Private",
    public: "Public",
    uzbek: "O'zbekcha",
    russian: "Русский",
    english: "English",
    settingsSaved: "Settings saved",
    settingsNotSaved: "Settings not saved",
  },
};

function daysUntilNext(lastDonationDate: string | null) {
  if (!lastDonationDate) return 0;
  const next = new Date(lastDonationDate).getTime() + 60 * 24 * 60 * 60 * 1000;
  return Math.max(0, Math.ceil((next - Date.now()) / (24 * 60 * 60 * 1000)));
}

export default function DonorMegaDashboard() {
  const [me, setMe] = useState<DonorMe | null>(null);
  const [centers, setCenters] = useState<Center[]>([]);
  const [settings, setSettings] = useState<Setting>(DEFAULT_SETTINGS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [question, setQuestion] = useState("");
  const [assistantAnswer, setAssistantAnswer] = useState("");
  const [communityText, setCommunityText] = useState("");
  const [selectedCenter, setSelectedCenter] = useState("");
  const [slotTime, setSlotTime] = useState("");
  const [feeling, setFeeling] = useState("");
  const [reminderEnabled, setReminderEnabled] = useState(true);
  const CURRENT_YEAR = 2026;

  const loadAll = useCallback(async () => {
    const [meRes, centerRes, settingRes, commRes] = await Promise.all([
      fetch("/api/donor/me", { cache: "no-store" }),
      fetch("/api/donor/centers", { cache: "no-store" }),
      fetch("/api/donor/settings", { cache: "no-store" }),
      fetch("/api/donor/community", { cache: "no-store" }),
    ]);
    if (!meRes.ok) throw new Error("Donor data yuklanmadi");

    const meJson = await meRes.json();
    setMe(meJson);

    const centerJson = await centerRes.json().catch(() => ({ centers: [] }));
    setCenters(centerJson.centers ?? []);
    if (!selectedCenter && centerJson.centers?.[0]?.id) setSelectedCenter(centerJson.centers[0].id);

    setSettings(await settingRes.json().catch(() => DEFAULT_SETTINGS));
    setPosts((await commRes.json().catch(() => ({ posts: [] }))).posts ?? []);
  }, [selectedCenter]);

  useEffect(() => {
    const init = window.setTimeout(() => {
      loadAll().catch((e) => toast.error(e instanceof Error ? e.message : "Xatolik"));
    }, 0);
    const onFocus = () => {
      loadAll().catch(() => undefined);
    };
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.clearTimeout(init);
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadAll]);

  const totalDonated = Number(me?.profile?.total_donated_liters ?? 0);
  const livesSaved = Math.max(1, Math.round(totalDonated * 3));
  const nextDays = daysUntilNext(me?.profile?.last_donation_date ?? null);
  const age = (() => {
    const dob = me?.profile?.dob;
    if (!dob) return "-";
    const y = Number(dob.slice(0, 4));
    if (!Number.isFinite(y)) return "-";
    return String(Math.max(0, CURRENT_YEAR - y));
  })();
  const donationCount = me?.donation_count ?? 0;
  const streakDays = Math.min(30, Math.max(1, donationCount * 2));
  const badges = [
    { name: "Yangi donor", active: donationCount >= 1 },
    { name: "Qahramon 5x", active: donationCount >= 5 },
    { name: "Platina 15x", active: donationCount >= 15 },
  ];
  const selectedCenterRow = centers.find((c) => c.id === selectedCenter) ?? centers[0];

  async function bookDonation() {
    const res = await fetch("/api/donor/booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ center_id: selectedCenter, slot_time: slotTime, feeling }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(json?.error ?? "Booking xatoligi");
    toast.success(
      `Virtual navbat yaratildi: ${selectedCenterRow?.name ?? "Center"} (${selectedCenterRow?.region ?? "-"})`
    );
    setFeeling("");
    await loadAll();
  }

  async function acceptEmergency(id: string) {
    const res = await fetch("/api/donor/emergency/approve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(json?.error ?? "Emergency xatoligi");
    toast.success("Emergency qabul qilindi");
    await loadAll();
  }

  async function askAssistant() {
    const res = await fetch("/api/donor/assistant", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });
    setAssistantAnswer((await res.json().catch(() => ({}))).answer ?? "");
  }

  async function createPost() {
    const res = await fetch("/api/donor/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "create", content: communityText }),
    });
    if (!res.ok) return toast.error("Post yuborilmadi");
    setCommunityText("");
    await loadAll();
  }

  async function likePost(id: string) {
    await fetch("/api/donor/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "like", post_id: id }),
    });
    await loadAll();
  }

  async function redeem(code: string) {
    const res = await fetch("/api/donor/bonuses/redeem", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ code }),
    });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) return toast.error(json?.error ?? "Redeem xatoligi");
    toast.success(`Promokod olindi. Qolgan ball: ${json.remain_points}`);
    await loadAll();
  }

  async function saveSettings() {
    const res = await fetch("/api/donor/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(settings),
    });
    if (!res.ok) return toast.error(translations[settings.language as keyof typeof translations].settingsNotSaved);
    toast.success(translations[settings.language as keyof typeof translations].settingsSaved);
    // Force re-render with new language
    setSettings({ ...settings });
  }

  const t = translations[settings.language as keyof typeof translations] || translations.uz;

  if (!me) return <div className="rounded-xl border p-4">Yuklanmoqda...</div>;

  return (
    <div className="space-y-5">
      <section className="rounded-3xl border border-red-100 bg-gradient-to-r from-red-600 via-rose-500 to-red-500 p-5 text-white shadow-lg dark:border-red-900">
        <div className="text-xl font-semibold">{t.welcome}, {me.profile?.first_name ?? t.donorMenu}! {t.saveLifeMessage}</div>
        <div className="mt-3 flex flex-wrap gap-3 text-sm">
          <div className="rounded-xl bg-white/95 px-3 py-2 text-red-700">🩸 {me.profile?.blood_group ?? "-"} Rh{me.profile?.rh ?? "-"}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-red-700">⏳ {t.nextDonation}: {nextDays} {t.days}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-red-700">📊 {totalDonated}L · {livesSaved} {t.lives}</div>
          <div className="rounded-xl bg-white/95 px-3 py-2 text-red-700">🔥 {t.streak}: {streakDays} {t.days}</div>
          {me.emergency_feed.length > 0 && <div className="rounded-xl bg-rose-900 px-3 py-2 text-white">🚨 {t.emergencyNeeded}</div>}
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-2xl border bg-white p-4 dark:bg-zinc-900">
          <div className="text-xs text-slate-600 dark:text-slate-300">{t.totalDonations}</div>
          <div className="mt-2 text-2xl font-bold">{me.donation_count}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-zinc-900">
          <div className="text-xs text-slate-600 dark:text-slate-300">{t.litersDonated}</div>
          <div className="mt-2 text-2xl font-bold">{totalDonated}L</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-zinc-900">
          <div className="text-xs text-slate-600 dark:text-slate-300">{t.livesSaved}</div>
          <div className="mt-2 text-2xl font-bold">{livesSaved}</div>
        </div>
        <div className="rounded-2xl border bg-white p-4 dark:bg-zinc-900">
          <div className="text-xs text-slate-600 dark:text-slate-300">{t.bonusPoints}</div>
          <div className="mt-2 text-2xl font-bold">{me.profile?.points ?? 0}</div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">👤 {t.profile}</h3>
          <div className="mt-3 text-sm space-y-1">
            <div>{t.fullName}: {(me.profile?.first_name ?? "") + " " + (me.profile?.last_name ?? "")}</div>
            <div>{t.age}: {age}</div>
            <div>{t.bloodType}: {me.profile?.blood_group ?? "-"} Rh{me.profile?.rh ?? "-"}</div>
            <div>{t.donationCount}: {me.donation_count}</div>
            <div>{t.donorLevel}: {me.donor_level}</div>
          </div>
          <div className="mt-4">
            <div className="text-xs text-slate-600 dark:text-slate-300">{t.donorId}</div>
            <QRCodeSVG value={`DONOR:${me.profile?.first_name ?? "X"}:${me.profile?.blood_group ?? "-"}`} size={100} />
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">❤️ {t.healthCenter}</h3>
          <div className="mt-2 text-sm">{t.healthDescription}</div>
          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div className="rounded-lg bg-emerald-50 p-2 dark:bg-emerald-950/30">{t.hemoglobin}: <span className="font-semibold">13.8 g/dL</span></div>
            <div className="rounded-lg bg-sky-50 p-2 dark:bg-sky-950/30">{t.infectionScreening}: <span className="font-semibold">{t.normal}</span></div>
          </div>
          <div className="mt-3 rounded-lg bg-zinc-100 p-3 text-sm dark:bg-zinc-800">{assistantAnswer || t.aiAssistant}</div>
          <div className="mt-2 flex gap-2">
            <input value={question} onChange={(e) => setQuestion(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900" placeholder="Qon topshirgandan keyin nima yeyish kerak?" />
            <button onClick={askAssistant} className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white">{t.save}</button>
          </div>
          <button className="mt-3 rounded-lg border px-3 py-2 text-sm">📄 PDF eksport (demo)</button>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h3 className="font-semibold">🎯 Donate Flow + 📅 Booking</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select value={selectedCenter} onChange={(e) => setSelectedCenter(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900">
            {centers.map((c) => (
              <option key={c.id} value={c.id}>{c.name ?? "Center"} · {c.distance_km}km</option>
            ))}
          </select>
          <input type="datetime-local" value={slotTime} onChange={(e) => setSlotTime(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900" />
          <input value={feeling} onChange={(e) => setFeeling(e.target.value)} className="rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900" placeholder="Mini anketa: holatingiz" />
          <button onClick={bookDonation} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Band qilish</button>
        </div>
        <label className="mt-3 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={reminderEnabled} onChange={(e) => setReminderEnabled(e.target.checked)} />
          🔔 Reminder faol
        </label>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">🗺️ Xarita (Centerlar)</h3>
          {selectedCenterRow ? (
            <div className="mt-3 rounded-lg border border-blue-100 bg-blue-50 p-3 text-sm dark:border-blue-900 dark:bg-blue-950/30">
              📍 Tanlangan markaz: <span className="font-semibold">{selectedCenterRow.name ?? "Center"}</span> · Bandlik: {selectedCenterRow.queue_load}/100
            </div>
          ) : null}
          <div className="mt-3 space-y-2 text-sm">
            {centers.map((c) => (
              <div key={c.id} className="rounded-lg border p-3">
                <div className="font-medium">{c.name ?? "Center"} ⭐ {c.rating.toFixed(1)}</div>
                <div>{c.region ?? "-"} · {c.address ?? "-"}</div>
                <div>Queue: {c.queue_load} · Distance: {c.distance_km}km · {c.queue_load > 70 ? "🔴 Band" : "🟢 Ochiq"}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">🏆 Reyting va tarix</h3>
          <div className="mt-3 space-y-2 text-sm">
            {me.leaderboard.slice(0, 8).map((r, i) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg border px-3 py-2">
                <span>#{i + 1} {r.first_name ?? "Donor"} {r.last_name ?? ""}</span>
                <span>{r.total_donated_liters}L · {r.points}pt</span>
              </div>
            ))}
          </div>
          <div className="mt-3 text-sm font-medium">Tarix:</div>
          <div className="mt-1 space-y-1 text-sm">
            {me.donations.slice(0, 8).map((d) => (
              <div key={d.id}>{new Date(d.donated_at).toLocaleDateString("uz-UZ")} · {d.blood_group}{d.rh} · {d.component} · {d.liters}L</div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">🎁 Bonuslar do&apos;koni</h3>
          <div className="mt-2 text-sm">Ball: {me.profile?.points ?? 0}</div>
          <div className="mt-3 space-y-2">
            <button onClick={() => redeem("pharmacy_5")} className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">💊 Dorixona -5%</button>
            <button onClick={() => redeem("gym_1day")} className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">🏋️ Gym 1 kun</button>
            <button onClick={() => redeem("cafe_10")} className="w-full rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">☕ Kafe -10%</button>
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">💬 Hamjamiyat</h3>
          <div className="mt-2 flex gap-2">
            <input value={communityText} onChange={(e) => setCommunityText(e.target.value)} className="w-full rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900" placeholder="Bugun qon topshirdim..." />
            <button onClick={createPost} className="rounded-lg bg-emerald-600 px-3 py-2 text-sm text-white">Post</button>
          </div>
          <div className="mt-3 max-h-80 space-y-2 overflow-y-auto pr-1">
            {posts.slice(0, 5).map((p) => (
              <div key={p.id} className="rounded-lg border p-2 text-sm">
                <div className="font-medium">{p.author}</div>
                <div className="max-h-28 overflow-y-auto whitespace-pre-wrap break-words text-slate-700 dark:text-slate-200">{p.content}</div>
                <button onClick={() => likePost(p.id)} className="text-xs text-blue-600">❤️ {p.likes_count}</button>
              </div>
            ))}
          </div>
        </div>
        <div className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
          <h3 className="font-semibold">🚨 SOS</h3>
          {me.emergency_feed.length ? (
            <div className="mt-2 space-y-2">
              {me.emergency_feed.slice(0, 5).map((e) => (
                <div key={e.id} className="rounded-lg bg-rose-600 p-2 text-sm text-white">
                  {e.blood_group} · {e.component} · {e.quantity}L
                  <button onClick={() => acceptEmergency(e.id)} className="ml-2 rounded bg-white px-2 py-1 text-xs text-rose-700">Yordam beraman</button>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-2 text-sm">Hozircha emergency yo&apos;q.</div>
          )}
          <div className="mt-3 text-sm">Bildirishnomalar: {me.notifications.length} ta</div>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h3 className="font-semibold">🏆 Gamifikatsiya</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {badges.map((badge) => (
            <div key={badge.name} className={`rounded-xl border p-3 text-sm ${badge.active ? "border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950/30" : "border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900"}`}>
              <div className="font-medium">{badge.name}</div>
              <div className="text-xs text-slate-600 dark:text-slate-300">{badge.active ? "Ochildi" : "Yopiq"}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 shadow-sm dark:bg-zinc-900">
        <h3 className="font-semibold">⚙️ {t.settings}</h3>
        <div className="mt-3 grid gap-3 md:grid-cols-4">
          <select value={settings.language} onChange={(e) => setSettings((p) => ({ ...p, language: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900">
            <option value="uz">{t.uzbek}</option>
            <option value="ru">{t.russian}</option>
            <option value="en">{t.english}</option>
          </select>
          <select value={settings.privacy_level} onChange={(e) => setSettings((p) => ({ ...p, privacy_level: e.target.value }))} className="rounded-lg border px-3 py-2 text-sm dark:bg-zinc-900">
            <option value="standard">{t.standard}</option>
            <option value="private">{t.private}</option>
            <option value="public">{t.public}</option>
          </select>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.notifications_enabled} onChange={(e) => setSettings((p) => ({ ...p, notifications_enabled: e.target.checked }))} />
            {t.notifications}
          </label>
          <button onClick={saveSettings} className="rounded-lg bg-zinc-900 px-3 py-2 text-sm text-white">{t.save}</button>
        </div>
      </section>
    </div>
  );
}