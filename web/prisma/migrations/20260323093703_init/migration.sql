-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "role" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "passwordHash" TEXT NOT NULL,
    "firstName" TEXT,
    "lastName" TEXT,
    "bloodGroup" TEXT,
    "rh" TEXT,
    "weightKg" REAL,
    "heightCm" REAL,
    "dob" DATETIME,
    "healthHistory" JSONB,
    "healthMetrics" JSONB,
    "totalDonatedLiters" REAL NOT NULL DEFAULT 0,
    "badges" JSONB,
    "points" INTEGER NOT NULL DEFAULT 0,
    "lastDonationDate" DATETIME,
    "name" TEXT,
    "region" TEXT,
    "address" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "DonorHealthEvent" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "hemoglobin" REAL,
    "infectionTests" JSONB,
    "measuredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DonorHealthEvent_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonorDonation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "centerId" TEXT,
    "hospitalId" TEXT,
    "bloodGroup" TEXT,
    "rh" TEXT,
    "component" TEXT,
    "liters" REAL NOT NULL,
    "donationStatus" TEXT NOT NULL DEFAULT 'completed',
    "donatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "DonorDonation_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "BloodInventory" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "centerId" TEXT,
    "hospitalId" TEXT,
    "component" TEXT NOT NULL,
    "bloodGroup" TEXT NOT NULL,
    "rh" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "expiryDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "BloodInventory_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "BloodInventory_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "EmergencyRequest" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "hospitalId" TEXT,
    "centerId" TEXT,
    "bloodGroup" TEXT NOT NULL,
    "rh" TEXT,
    "component" TEXT NOT NULL,
    "quantity" REAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "donorId" TEXT,
    "donorApproved" BOOLEAN NOT NULL DEFAULT false,
    "deliveryStatus" TEXT NOT NULL DEFAULT 'pending',
    "deliveryEtaDemoMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "EmergencyRequest_hospitalId_fkey" FOREIGN KEY ("hospitalId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmergencyRequest_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "EmergencyRequest_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "DonorSlot" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "donorId" TEXT NOT NULL,
    "centerId" TEXT NOT NULL,
    "slotTime" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'booked',
    "etaDemoMinutes" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "DonorSlot_donorId_fkey" FOREIGN KEY ("donorId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "DonorSlot_centerId_fkey" FOREIGN KEY ("centerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "DonorHealthEvent_donorId_measuredAt_idx" ON "DonorHealthEvent"("donorId", "measuredAt");

-- CreateIndex
CREATE INDEX "DonorDonation_donorId_donatedAt_idx" ON "DonorDonation"("donorId", "donatedAt");

-- CreateIndex
CREATE INDEX "BloodInventory_centerId_idx" ON "BloodInventory"("centerId");

-- CreateIndex
CREATE INDEX "BloodInventory_hospitalId_idx" ON "BloodInventory"("hospitalId");

-- CreateIndex
CREATE INDEX "EmergencyRequest_hospitalId_createdAt_idx" ON "EmergencyRequest"("hospitalId", "createdAt");

-- CreateIndex
CREATE INDEX "EmergencyRequest_centerId_createdAt_idx" ON "EmergencyRequest"("centerId", "createdAt");

-- CreateIndex
CREATE INDEX "DonorSlot_donorId_slotTime_idx" ON "DonorSlot"("donorId", "slotTime");

-- CreateIndex
CREATE INDEX "Notification_userId_createdAt_idx" ON "Notification"("userId", "createdAt");
