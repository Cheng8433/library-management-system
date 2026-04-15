-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_librarians" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "employee_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "is_admin" BOOLEAN NOT NULL DEFAULT false,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL
);
INSERT INTO "new_librarians" ("created_at", "employee_id", "id", "name", "password", "updated_at") SELECT "created_at", "employee_id", "id", "name", "password", "updated_at" FROM "librarians";
DROP TABLE "librarians";
ALTER TABLE "new_librarians" RENAME TO "librarians";
CREATE UNIQUE INDEX "librarians_employee_id_key" ON "librarians"("employee_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
