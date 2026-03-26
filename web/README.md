# Blood-chain `web`

Next.js demo loyiha: donor, blood center va hospital oqimlari bilan.
Ma'lumotlar bazasi sifatida mahalliy `SQLite` (`dev.db`) ishlatiladi.

## Talablar

- Node.js 20+
- npm

## Tez ishga tushirish

1) Dependency o'rnatish:

```bash
npm install
```

2) Muhit faylini tayyorlash:

```bash
cp .env.example .env.local
```

3) Prisma client yaratish (ixtiyoriy, lekin tavsiya):

```bash
npm run prisma:generate
```

4) Development server:

```bash
npm run dev
```

So'ng brauzerda `http://localhost:3000` ni oching.

## SQLite konfiguratsiyasi

- `DATABASE_URL` `.env.local` ichida:
  - `DATABASE_URL="file:./dev.db"`
- DB fayl loyiha ichida saqlanadi: `web/dev.db`
- API lar `src/lib/db/sqlite.ts` orqali `sql.js` bilan ishlaydi.

## Foydali buyruqlar

```bash
npm run lint
npm run build
npm run prisma:generate
npm run prisma:migrate
```

---

## Loyiha haqida qisqacha (O'zbekcha)

Blood Chain — bu zamonaviy qon donatsiyasi va donorlarni boshqarish uchun yaratilgan veb-ilova. Platforma orqali donorlar, qon markazlari va shifoxonalar o‘zaro tezkor va samarali hamkorlik qilishi mumkin.

### Asosiy imkoniyatlar
- Donorlar uchun shaxsiy kabinet: donorlik tarixi, sog‘liq holati, bonuslar va gamifikatsiya.
- Qon markazlari boshqaruvi: inventar, so‘rovlar, statistikalar va tahlillar.
- Shifoxonalar uchun buyurtmalar: qon komponentlariga buyurtma berish va yetkazib berishni kuzatish.
- Avtorizatsiya va xavfsizlik: foydalanuvchilar uchun xavfsiz kirish va chiqish.
- Qon donatsiyasi haqida ma’lumotlar: donorlik foydalari, qon birliklari va statistikalar.

### Texnologiyalar
- Next.js (React)
- TypeScript
- Tailwind CSS
- Prisma ORM
- Supabase (backend va autentifikatsiya)

### Hissa qo‘shish
Taklif va xatoliklar uchun Issues bo‘limiga yozing yoki pull request yuboring.

---

Hayotingizni saqlab qoling va boshqalarga yordam bering — donor bo‘ling!
