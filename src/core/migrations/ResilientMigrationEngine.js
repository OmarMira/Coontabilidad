/**
 * MOTOR DE MIGRACIONES ATÓMICAS
 * 
 * Sistema de migraciones con rollback garantizado
 */

export class ResilientMigrationEngine {
  constructor() {
    this.migrations = new Map();
    this.currentVersion = 0;
  }
  
  // Registrar migración
  registerMigration(version, migration) {
    this.migrations.set(version, migration);
  }
  
  // Ejecutar migraciones pendientes
  async migrate() {
    const { db } = await import('../../database/simple-db');
    if (!db) throw new Error('Database not available');
    
    // Crear tabla de migraciones si no existe
    db.exec(`
      CREATE TABLE IF NOT EXISTS schema_migrations (
        version INTEGER PRIMARY KEY,
        applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        rollback_sql TEXT
      )
    `);
    
    // Obtener versión actual
    const result = db.exec("SELECT MAX(version) as version FROM schema_migrations");
    this.currentVersion = result[0]?.values[0]?.[0] || 0;
    
    // Ejecutar migraciones pendientes
    const pendingMigrations = Array.from(this.migrations.entries())
      .filter(([version]) => version > this.currentVersion)
      .sort(([a], [b]) => a - b);
    
    for (const [version, migration] of pendingMigrations) {
      await this.executeMigration(version, migration);
    }
  }
  
  // Ejecutar migración individual
  async executeMigration(version, migration) {
    const { db } = await import('../../database/simple-db');
    
    console.log(`🔄 Executing migration ${version}...`);
    
    try {
      // Iniciar transacción
      db.exec('BEGIN TRANSACTION');
      
      // Ejecutar migración
      if (typeof migration.up === 'string') {
        db.exec(migration.up);
      } else if (typeof migration.up === 'function') {
        await migration.up(db);
      }
      
      // Registrar migración
      const stmt = db.prepare(
        "INSERT INTO schema_migrations (version, rollback_sql) VALUES (?, ?)"
      );
      stmt.run([version, migration.down || '']);
      stmt.free();
      
      // Confirmar transacción
      db.exec('COMMIT');
      
      console.log(`✅ Migration ${version} completed`);
      this.currentVersion = version;
      
    } catch (error) {
      // Rollback en caso de error
      db.exec('ROLLBACK');
      console.error(`❌ Migration ${version} failed:, error`);
      throw error;
    }
  }
  
  // Rollback a versión específica
  async rollback(targetVersion) {
    const { db } = await import('../../database/simple-db');
    
    const migrations = db.exec(`
      SELECT version, rollback_sql 
      FROM schema_migrations 
      WHERE version > ? 
      ORDER BY version DESC
    `, [targetVersion]);
    
    if (!migrations[0]) return;
    
    for (const [version, rollbackSql] of migrations[0].values) {
      try {
        db.exec('BEGIN TRANSACTION');
        
        if (rollbackSql) {
          db.exec(rollbackSql);
        }
        
        db.exec("DELETE FROM schema_migrations WHERE version = ?", [version]);
        db.exec('COMMIT');
        
        console.log(`↩️  Rolled back migration ${version}`);
      } catch (error) {
        db.exec('ROLLBACK');
        console.error(`❌ Rollback ${version} failed:`, error);
        throw error;
      }
    }
  }
}

export const migrationEngine = new ResilientMigrationEngine();

// Registrar migraciones base
migrationEngine.registerMigration(1, {
  up: `
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      email TEXT,
      phone TEXT,
      address TEXT,
      county TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `,
  down: "DROP TABLE IF EXISTS customers;"
});

migrationEngine.registerMigration(2, {
  up: `
    CREATE TABLE IF NOT EXISTS florida_tax_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      county TEXT NOT NULL UNIQUE,
      base_rate REAL DEFAULT 0.06,
      surtax_rate REAL DEFAULT 0.0,
      total_rate REAL GENERATED ALWAYS AS (base_rate + surtax_rate),
      effective_date DATE DEFAULT CURRENT_DATE
    );
    
    INSERT OR IGNORE INTO florida_tax_config (county, surtax_rate) VALUES
    ('Miami-Dade', 0.015),
    ('Broward', 0.01),
    ('Orange', 0.005),
    ('Hillsborough', 0.015),
    ('Palm Beach', 0.01);
  `,
  down: "DROP TABLE IF EXISTS florida_tax_config;"
});
