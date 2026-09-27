#!/usr/bin/env bash
# Recrée une base de test locale (PostgreSQL + PostGIS), applique shim + migrations + seed,
# puis exécute les tests RLS & jeu. Variables : PGHOST, PGPORT, PGUSER (défauts : /tmp, 54329, postgres).
set -euo pipefail
cd "$(dirname "$0")/.."
export PGHOST="${PGHOST:-/tmp}" PGPORT="${PGPORT:-54329}" PGUSER="${PGUSER:-postgres}"
DB="${PQ_TEST_DB:-parkquest_test}"
P="psql -v ON_ERROR_STOP=1 -q -t"
$P -d postgres -c "drop database if exists $DB" -c "create database $DB"
$P -d "$DB" -f supabase/tests/supabase_shim.sql
for f in supabase/migrations/*.sql; do $P -d "$DB" -f "$f" 2>&1 | grep -v "NOTICE" || true; done
$P -d "$DB" -f supabase/seed.sql
$P -d "$DB" -f supabase/tests/rls_and_game_test.sql 2>&1 | sed 's/^psql:[^ ]* //'
