import { PrismaClient } from "@prisma/client";

// Next.js (dev mode) da multiple hot-reloadlar sababli PrismaClient ko‘p ochilib qolmasin.
declare global {
  var __prisma: PrismaClient | undefined;
}

const prisma =
  global.__prisma ??
  new PrismaClient();
if (process.env.NODE_ENV !== "production") global.__prisma = prisma;

export default prisma;

