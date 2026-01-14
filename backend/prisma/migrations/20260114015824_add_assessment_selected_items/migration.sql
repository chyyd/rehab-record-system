-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_assessments" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patientId" INTEGER NOT NULL,
    "assessorId" INTEGER NOT NULL,
    "assessmentType" TEXT NOT NULL,
    "assessmentDate" DATETIME NOT NULL,
    "location" TEXT NOT NULL,
    "selectedItems" TEXT NOT NULL DEFAULT '[]',
    "barthelIndex" INTEGER,
    "barthelDetails" TEXT,
    "brunnstromStage" TEXT,
    "balanceFunction" TEXT,
    "muscleStrength" TEXT,
    "cognitiveMMSE" INTEGER,
    "mmseDetails" TEXT,
    "swallowingTest" INTEGER,
    "languageScore" INTEGER,
    "rehabGoal" TEXT,
    "rehabEffect" TEXT,
    "homeGuidance" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "assessments_patientId_fkey" FOREIGN KEY ("patientId") REFERENCES "patients" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "assessments_assessorId_fkey" FOREIGN KEY ("assessorId") REFERENCES "users" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_assessments" ("assessmentDate", "assessmentType", "assessorId", "balanceFunction", "barthelIndex", "brunnstromStage", "cognitiveMMSE", "createdAt", "homeGuidance", "id", "languageScore", "location", "muscleStrength", "patientId", "rehabEffect", "rehabGoal", "swallowingTest", "updatedAt") SELECT "assessmentDate", "assessmentType", "assessorId", "balanceFunction", "barthelIndex", "brunnstromStage", "cognitiveMMSE", "createdAt", "homeGuidance", "id", "languageScore", "location", "muscleStrength", "patientId", "rehabEffect", "rehabGoal", "swallowingTest", "updatedAt" FROM "assessments";
DROP TABLE "assessments";
ALTER TABLE "new_assessments" RENAME TO "assessments";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
