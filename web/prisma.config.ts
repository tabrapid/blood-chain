import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Prisma migrate/engine va Prisma Client uchun ishlatiladi.
    url: process.env.DATABASE_URL as string,
  },
});

