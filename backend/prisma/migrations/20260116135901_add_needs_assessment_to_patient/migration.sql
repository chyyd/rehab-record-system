-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_patients" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "pinyin" TEXT NOT NULL,
    "gender" TEXT NOT NULL,
    "age" TEXT NOT NULL,
    "insuranceType" TEXT NOT NULL,
    "admissionDate" DATETIME NOT NULL,
    "dischargeDate" DATETIME,
    "medicalRecordNo" TEXT NOT NULL,
    "doctor" TEXT NOT NULL,
    "diagnosis" TEXT NOT NULL,
    "needsAssessment" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_patients" ("admissionDate", "age", "createdAt", "diagnosis", "dischargeDate", "doctor", "gender", "id", "insuranceType", "medicalRecordNo", "name", "pinyin", "updatedAt") SELECT "admissionDate", "age", "createdAt", "diagnosis", "dischargeDate", "doctor", "gender", "id", "insuranceType", "medicalRecordNo", "name", "pinyin", "updatedAt" FROM "patients";
DROP TABLE "patients";
ALTER TABLE "new_patients" RENAME TO "patients";
CREATE UNIQUE INDEX "patients_medicalRecordNo_key" ON "patients"("medicalRecordNo");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
