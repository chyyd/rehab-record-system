-- DropProjectCodeCategory
-- 删除项目的code和category字段

-- SQLite不支持直接DROP COLUMN，需要重建表
-- 下面是重建表的SQL

-- 1. 禁用外键约束
PRAGMA foreign_keys = OFF;

-- 2. 创建新的projects表（不包含code和category字段）
CREATE TABLE "projects_new" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "defaultDuration" INTEGER NOT NULL DEFAULT 30,
    "allowedRoles" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT 1,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- 3. 复制数据（不包含code和category）
INSERT INTO "projects_new" ("id", "name", "defaultDuration", "allowedRoles", "isActive", "sortOrder", "createdAt", "updatedAt")
SELECT "id", "name", "defaultDuration", "allowedRoles", "isActive", "sortOrder", "createdAt", "updatedAt"
FROM "projects";

-- 4. 删除旧表
DROP TABLE "projects";

-- 5. 重命名新表
ALTER TABLE "projects_new" RENAME TO "projects";

-- 6. 重新创建外键（如果需要）
-- ALTER TABLE "treatment_records" ADD FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- 7. 启用外键约束
PRAGMA foreign_keys = ON;

-- 8. 重建索引
-- SQLite会自动为主键创建索引
