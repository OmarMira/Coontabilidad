-- =============================================================================
-- ACCOUNT EXPRESS — SPRINT 1A: SCRIPT DE MIGRACIÓN CON FASE DE CLUSTERING
-- =============================================================================
-- Versión   : 1.0.0
-- Estado    : DRAFT — Ejecutar SOLO en staging antes de producción
-- Pre-req   : Backup total verificado + entorno de staging activo
-- Ejecutar  : psql -U <admin> -d <db> -f sprint1a_migration.sql
-- Rollback  : sprint1a_ROLLBACK.sql (generado automáticamente al final)
-- =============================================================================

BEGIN;

DO $$
BEGIN
  IF current_setting('app.environment', true) != 'staging' THEN
    RAISE EXCEPTION
      '[ABORT] Este script solo puede ejecutarse en entorno staging. '
      'Ejecuta: SET app.environment = ''staging''; antes de correr el script.';
  END IF;
  RAISE NOTICE '[FASE 0] Entorno verificado: staging. Iniciando migración.';
END $$;

RAISE NOTICE '[FASE 1] Creando snapshot pre-migración...';

CREATE TABLE IF NOT EXISTS _migration_snapshot_assets AS
  SELECT id, user_id, name, acquisition_date, original_cost,
         depreciation_method, property_tax_category, created_at,
         NOW() AS snapshot_taken_at
  FROM fixed_assets
  WHERE user_id = '1' OR user_id::text = '1';

DO $$
DECLARE snapshot_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO snapshot_count FROM _migration_snapshot_assets;
  RAISE NOTICE '[FASE 1] Snapshot completado: % registros con userId=1 capturados.', snapshot_count;
END $$;

RAISE NOTICE '[FASE 2] Creando tabla asset_migration_audit...';

CREATE TABLE IF NOT EXISTS asset_migration_audit (
  id                  TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  original_asset_id   TEXT NOT NULL,
  original_user_id    TEXT NOT NULL DEFAULT '1',
  clustering_metadata JSONB,
  cluster_group       TEXT,
  confidence_score    REAL CHECK (confidence_score BETWEEN 0.0 AND 1.0),
  triage_status       TEXT NOT NULL DEFAULT 'PENDING'
                      CHECK (triage_status IN ('PENDING','ASSIGNED','ORPHAN_CONFIRMED','DELETED')),
  assigned_tenant_id  TEXT,
  reviewed_by         TEXT,
  reviewed_at         TIMESTAMP WITH TIME ZONE,
  review_notes        TEXT,
  created_at          TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_migration_status  ON asset_migration_audit (triage_status);
CREATE INDEX IF NOT EXISTS idx_migration_cluster ON asset_migration_audit (cluster_group);
CREATE INDEX IF NOT EXISTS idx_migration_tenant  ON asset_migration_audit (assigned_tenant_id);

RAISE NOTICE '[FASE 2] Tabla asset_migration_audit creada con índices.';

RAISE NOTICE '[FASE 3] Iniciando análisis de clustering...';

INSERT INTO asset_migration_audit (original_asset_id, original_user_id, clustering_metadata, cluster_group, confidence_score, triage_status)
SELECT fa.id, '1',
  jsonb_build_object('method','account_number_association','account_number',bt.account_number,'transaction_count',COUNT(bt.id),'date_range',jsonb_build_object('min',MIN(bt.transaction_date),'max',MAX(bt.transaction_date))),
  bt.account_number, 0.92, 'PENDING'
FROM fixed_assets fa
JOIN bank_transactions bt ON bt.reference_asset_id = fa.id OR bt.description ILIKE '%' || fa.name || '%'
WHERE (fa.user_id = '1' OR fa.user_id::text = '1')
  AND bt.account_number IS NOT NULL AND bt.account_number != ''
GROUP BY fa.id, bt.account_number
HAVING COUNT(bt.id) = (
  SELECT MAX(cnt) FROM (
    SELECT COUNT(*) AS cnt FROM bank_transactions bt2
    WHERE (bt2.reference_asset_id = fa.id OR bt2.description ILIKE '%' || fa.name || '%')
      AND bt2.account_number IS NOT NULL
    GROUP BY bt2.account_number
  ) sub
)
ON CONFLICT (original_asset_id) DO NOTHING;

DO $$ DECLARE cnt INTEGER;
BEGIN SELECT COUNT(*) INTO cnt FROM asset_migration_audit WHERE confidence_score >= 0.90;
RAISE NOTICE '[FASE 3 - NIVEL A] % activos clusterizados por account_number (confianza >= 0.90)', cnt;
END $$;

INSERT INTO asset_migration_audit (original_asset_id, original_user_id, clustering_metadata, cluster_group, confidence_score, triage_status)
SELECT fa.id, '1',
  jsonb_build_object('method','filename_pattern','original_filename',fa.import_filename,'matched_pattern',
    CASE WHEN fa.import_filename ILIKE '%LQ%' THEN 'TENANT_LQ'
         WHEN fa.import_filename ILIKE '%OM LLC%' THEN 'TENANT_OM_LLC'
         WHEN fa.import_filename ILIKE '%OM_LLC%' THEN 'TENANT_OM_LLC'
         ELSE 'UNKNOWN_FILENAME_PATTERN' END),
  CASE WHEN fa.import_filename ILIKE '%LQ%' THEN 'TENANT_LQ'
       WHEN fa.import_filename ILIKE '%OM LLC%' THEN 'TENANT_OM_LLC'
       WHEN fa.import_filename ILIKE '%OM_LLC%' THEN 'TENANT_OM_LLC'
       ELSE NULL END,
  0.74, 'PENDING'
FROM fixed_assets fa
WHERE (fa.user_id = '1' OR fa.user_id::text = '1')
  AND fa.import_filename IS NOT NULL AND fa.import_filename != ''
  AND fa.id NOT IN (SELECT original_asset_id FROM asset_migration_audit)
ON CONFLICT (original_asset_id) DO NOTHING;

DO $$ DECLARE cnt INTEGER;
BEGIN SELECT COUNT(*) INTO cnt FROM asset_migration_audit WHERE confidence_score BETWEEN 0.70 AND 0.89;
RAISE NOTICE '[FASE 3 - NIVEL B] % activos clusterizados por filename (confianza 0.70-0.89)', cnt;
END $$;

INSERT INTO asset_migration_audit (original_asset_id, original_user_id, clustering_metadata, cluster_group, confidence_score, triage_status)
SELECT fa.id, '1',
  jsonb_build_object('method','no_discriminator','reason','Activo creado manualmente sin transacciones ni filename asociados','asset_name',fa.name,'created_at',fa.created_at),
  NULL, 0.0, 'PENDING'
FROM fixed_assets fa
WHERE (fa.user_id = '1' OR fa.user_id::text = '1')
  AND fa.id NOT IN (SELECT original_asset_id FROM asset_migration_audit)
ON CONFLICT (original_asset_id) DO NOTHING;

DO $$ DECLARE cnt INTEGER;
BEGIN SELECT COUNT(*) INTO cnt FROM asset_migration_audit WHERE cluster_group IS NULL;
RAISE NOTICE '[FASE 3 - NIVEL C] % activos marcados como ORPHAN (requieren triage manual)', cnt;
END $$;

UPDATE asset_migration_audit SET triage_status = 'ORPHAN_CONFIRMED'
WHERE cluster_group IS NULL AND confidence_score < 0.60;

RAISE NOTICE '[FASE 3] Clustering completado.';

RAISE NOTICE '[FASE 4] Iniciando migración de activos con confianza >= 0.85...';

DO $$
DECLARE
  rec        RECORD;
  target_uid TEXT;
  migrated   INTEGER := 0;
  skipped    INTEGER := 0;
BEGIN
  FOR rec IN
    SELECT ama.id AS audit_id, ama.original_asset_id, ama.cluster_group, ama.confidence_score
    FROM asset_migration_audit ama
    WHERE ama.confidence_score >= 0.85 AND ama.triage_status = 'PENDING' AND ama.cluster_group IS NOT NULL
  LOOP
    SELECT u.id INTO target_uid FROM users u
    JOIN bank_accounts ba ON ba.user_id = u.id
    WHERE ba.account_number = rec.cluster_group AND u.id != '1' LIMIT 1;

    IF target_uid IS NULL THEN
      skipped := skipped + 1;
      RAISE NOTICE '  [SKIP] Activo % — cluster % no tiene usuario verificado', rec.original_asset_id, rec.cluster_group;
      CONTINUE;
    END IF;

    UPDATE fixed_assets SET user_id = target_uid, updated_at = NOW() WHERE id = rec.original_asset_id;
    UPDATE asset_migration_audit SET triage_status = 'ASSIGNED', assigned_tenant_id = target_uid,
      reviewed_at = NOW(), review_notes = 'Auto-asignado por clustering nivel A (account_number)'
    WHERE id = rec.audit_id;

    migrated := migrated + 1;
  END LOOP;
  RAISE NOTICE '[FASE 4] Migración completada: % activos migrados, % omitidos', migrated, skipped;
END $$;

DO $$
DECLARE
  total_legacy INTEGER; auto_assigned INTEGER; pending_medium INTEGER;
  orphans_confirmed INTEGER; still_user1 INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_legacy     FROM _migration_snapshot_assets;
  SELECT COUNT(*) INTO auto_assigned    FROM asset_migration_audit WHERE triage_status = 'ASSIGNED';
  SELECT COUNT(*) INTO pending_medium   FROM asset_migration_audit WHERE triage_status = 'PENDING' AND cluster_group IS NOT NULL;
  SELECT COUNT(*) INTO orphans_confirmed FROM asset_migration_audit WHERE triage_status = 'ORPHAN_CONFIRMED';
  SELECT COUNT(*) INTO still_user1      FROM fixed_assets WHERE user_id = '1' OR user_id::text = '1';
  RAISE NOTICE '[FASE 5] Total legacy: % | Migrados: % | Pendientes: % | Huerfanos: % | Aun userId=1: %',
    total_legacy, auto_assigned, pending_medium, orphans_confirmed, still_user1;
END $$;

RAISE NOTICE '[FASE 6] Ejecutando gate de validación...';

DO $$
DECLARE snapshot_count INTEGER; audit_count INTEGER; bad_migrations INTEGER;
BEGIN
  SELECT COUNT(*) INTO snapshot_count FROM _migration_snapshot_assets;
  SELECT COUNT(*) INTO audit_count    FROM asset_migration_audit;
  IF audit_count != snapshot_count THEN
    RAISE EXCEPTION '[GATE FAIL] Inconsistencia: snapshot=% audit=%. ROLLBACK.', snapshot_count, audit_count;
  END IF;
  SELECT COUNT(*) INTO bad_migrations
  FROM asset_migration_audit ama JOIN fixed_assets fa ON fa.id = ama.original_asset_id
  WHERE ama.triage_status = 'ASSIGNED' AND (fa.user_id = '1' OR fa.user_id::text = '1');
  IF bad_migrations > 0 THEN
    RAISE EXCEPTION '[GATE FAIL] % activos ASSIGNED siguen con user_id=1. ROLLBACK.', bad_migrations;
  END IF;
  RAISE NOTICE '[FASE 6] Gate de validación APROBADO. Transacción lista para COMMIT.';
END $$;

CREATE TABLE IF NOT EXISTS _migration_rollback_log (
  id SERIAL PRIMARY KEY, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), rollback_sql TEXT NOT NULL
);

INSERT INTO _migration_rollback_log (rollback_sql) VALUES (
$$ROLLBACK_SCRIPT
BEGIN;
UPDATE fixed_assets fa SET user_id = '1', updated_at = NOW()
FROM _migration_snapshot_assets snap WHERE fa.id = snap.id AND fa.user_id != '1';
DROP TABLE IF EXISTS asset_migration_audit;
DROP TABLE IF EXISTS _migration_snapshot_assets;
DROP TABLE IF EXISTS _migration_rollback_log;
COMMIT;
$$ROLLBACK_SCRIPT
);

RAISE NOTICE '[FASE 7] Script de rollback generado en _migration_rollback_log.';

COMMIT;

RAISE NOTICE 'SPRINT 1A COMPLETADO.';
