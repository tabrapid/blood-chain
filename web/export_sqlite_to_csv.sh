#!/bin/bash
# SQLite dan barcha jadvallarni CSV ga eksport qilish skripti
# Foydalanish: bash export_sqlite_to_csv.sh

set -e

DB_PATH="web/prisma/dev.db"
EXPORT_DIR="web/prisma/sqlite_export"

mkdir -p "$EXPORT_DIR"

# Jadval nomlarini olish
tables=$(sqlite3 "$DB_PATH" ".tables")

for table in $tables; do
  echo "Exporting $table..."
  sqlite3 "$DB_PATH" <<EOF
.headers on
.mode csv
.output $EXPORT_DIR/${table}.csv
SELECT * FROM $table;
EOF
done

echo "Barcha jadvallar CSV ga eksport qilindi: $EXPORT_DIR/"
