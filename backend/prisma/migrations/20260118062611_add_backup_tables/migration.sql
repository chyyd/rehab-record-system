-- CreateTable
CREATE TABLE "backup_logs" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "backupDate" DATETIME NOT NULL,
    "backupType" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "fileSize" INTEGER,
    "fileCount" INTEGER,
    "duration" INTEGER,
    "errorMessage" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable
CREATE TABLE "system_status" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "lastBackupTime" DATETIME,
    "backupStatus" TEXT NOT NULL DEFAULT 'unknown',
    "failedReason" TEXT,
    "databaseSize" INTEGER,
    "photosCount" INTEGER,
    "lastBackupDate" TEXT,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "backup_logs_backupDate_key" ON "backup_logs"("backupDate");
