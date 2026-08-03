import mysql, { Pool, RowDataPacket, ResultSetHeader } from 'mysql2/promise';
import { Evaluation } from '../types';

const TABLE_NAME = process.env.DB_TABLE || 'revue_annuel';
const DATABASE_NAME = process.env.DB_NAME || '';

if (!/^[a-zA-Z0-9_]+$/.test(TABLE_NAME)) {
  throw new Error('DB_TABLE contient des caractères non autorisés.');
}
if (DATABASE_NAME && !/^[a-zA-Z0-9_]+$/.test(DATABASE_NAME)) {
  throw new Error('DB_NAME contient des caractères non autorisés.');
}

const quote = (identifier: string) => `\`${identifier.replace(/`/g, '``')}\``;

class EvaluationRepository {
  private pool: Pool | null = null;
  private database = DATABASE_NAME;

  get databaseName() {
    return this.database;
  }

  private async resolveDatabase(pool: Pool) {
    if (this.database) return;

    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT TABLE_SCHEMA
       FROM information_schema.TABLES
       WHERE TABLE_NAME = ?
         AND TABLE_SCHEMA NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')`,
      [TABLE_NAME],
    );

    if (rows.length === 1) {
      this.database = String(rows[0].TABLE_SCHEMA);
      return;
    }
    if (rows.length > 1) {
      throw new Error(`La table ${TABLE_NAME} existe dans plusieurs bases. Renseignez DB_NAME dans .env.local.`);
    }

    const [databases] = await pool.query<RowDataPacket[]>(
      `SELECT SCHEMA_NAME
       FROM information_schema.SCHEMATA
       WHERE SCHEMA_NAME NOT IN ('information_schema', 'mysql', 'performance_schema', 'sys')
       ORDER BY
         CASE WHEN SCHEMA_NAME IN ('revue_annuel', 'projet_revue_annuel') THEN 0 ELSE 1 END,
         SCHEMA_NAME`,
    );
    const preferred = databases.filter(row =>
      ['revue_annuel', 'projet_revue_annuel'].includes(String(row.SCHEMA_NAME)),
    );
    if (preferred.length === 1) {
      this.database = String(preferred[0].SCHEMA_NAME);
      return;
    }
    if (databases.length === 1) {
      this.database = String(databases[0].SCHEMA_NAME);
      return;
    }
    throw new Error(`Table ${TABLE_NAME} introuvable. Renseignez DB_NAME dans .env.local.`);
  }

  async initialize(seed: Evaluation[] = []) {
    const baseConfig = {
      host: process.env.DB_HOST || '127.0.0.1',
      port: Number(process.env.DB_PORT || 3306),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD || '',
      waitForConnections: true,
      connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
      charset: 'utf8mb4',
    };

    const discoveryPool = mysql.createPool(baseConfig);
    await this.resolveDatabase(discoveryPool);
    await discoveryPool.end();

    this.pool = mysql.createPool({ ...baseConfig, database: this.database });
    await this.ensureTable();

    const existing = await this.count();
    if (existing === 0 && process.env.DB_SEED_DEMO_DATA !== 'false') {
      for (const evaluation of seed) {
        await this.create(evaluation);
      }
    }
  }

  private getPool() {
    if (!this.pool) throw new Error('La connexion à la base de données n’est pas initialisée.');
    return this.pool;
  }

  private async ensureTable() {
    const pool = this.getPool();
    const table = quote(TABLE_NAME);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS ${table} (
        id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
        campagne_id BIGINT NOT NULL,
        campagne_name VARCHAR(255) NOT NULL DEFAULT '',
        user_id BIGINT NOT NULL,
        user_name VARCHAR(255) NOT NULL DEFAULT '',
        manager_id BIGINT NOT NULL,
        manager_name VARCHAR(255) NOT NULL DEFAULT '',
        filiale_name VARCHAR(255) NOT NULL DEFAULT '',
        direction_name VARCHAR(255) NOT NULL DEFAULT '',
        status VARCHAR(50) NOT NULL DEFAULT 'en_attente',
        score_global DECIMAL(6,2) NOT NULL DEFAULT 0,
        payload LONGTEXT NOT NULL,
        created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        PRIMARY KEY (id),
        INDEX idx_revue_user (user_id),
        INDEX idx_revue_manager (manager_id),
        INDEX idx_revue_campagne (campagne_id),
        INDEX idx_revue_status (status)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  private async count() {
    const [rows] = await this.getPool().query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total FROM ${quote(TABLE_NAME)}`,
    );
    return Number(rows[0]?.total || 0);
  }

  private fromRow(row: RowDataPacket): Evaluation {
    const payload = typeof row.payload === 'string' ? JSON.parse(row.payload) : row.payload;
    return {
      ...payload,
      id: Number(row.id),
      campagne_id: Number(row.campagne_id),
      user_id: Number(row.user_id),
      manager_id: Number(row.manager_id),
      score_global: Number(row.score_global),
      status: row.status,
    } as Evaluation;
  }

  async findAll(): Promise<Evaluation[]> {
    const [rows] = await this.getPool().query<RowDataPacket[]>(
      `SELECT * FROM ${quote(TABLE_NAME)} ORDER BY id DESC`,
    );
    return rows.map(row => this.fromRow(row));
  }

  async findById(id: number): Promise<Evaluation | null> {
    const [rows] = await this.getPool().execute<RowDataPacket[]>(
      `SELECT * FROM ${quote(TABLE_NAME)} WHERE id = ? LIMIT 1`,
      [id],
    );
    return rows[0] ? this.fromRow(rows[0]) : null;
  }

  async create(evaluation: Evaluation): Promise<Evaluation> {
    const data = this.toDatabaseValues(evaluation);
    const requestedId = Number.isFinite(evaluation.id) && evaluation.id > 0 ? evaluation.id : null;
    const [result] = await this.getPool().execute<ResultSetHeader>(
      `INSERT INTO ${quote(TABLE_NAME)}
       (id, campagne_id, campagne_name, user_id, user_name, manager_id, manager_name,
        filiale_name, direction_name, status, score_global, payload)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [requestedId, ...data],
    );
    return { ...evaluation, id: Number(requestedId || result.insertId) };
  }

  async update(id: number, evaluation: Evaluation): Promise<Evaluation | null> {
    const data = this.toDatabaseValues({ ...evaluation, id });
    const [result] = await this.getPool().execute<ResultSetHeader>(
      `UPDATE ${quote(TABLE_NAME)}
       SET campagne_id = ?, campagne_name = ?, user_id = ?, user_name = ?,
           manager_id = ?, manager_name = ?, filiale_name = ?, direction_name = ?,
           status = ?, score_global = ?, payload = ?
       WHERE id = ?`,
      [...data, id],
    );
    return result.affectedRows ? { ...evaluation, id } : null;
  }

  async delete(id: number) {
    const [result] = await this.getPool().execute<ResultSetHeader>(
      `DELETE FROM ${quote(TABLE_NAME)} WHERE id = ?`,
      [id],
    );
    return result.affectedRows > 0;
  }

  private toDatabaseValues(evaluation: Evaluation) {
    const payload = JSON.stringify({ ...evaluation, id: undefined });
    return [
      evaluation.campagne_id,
      evaluation.campagne_name || '',
      evaluation.user_id,
      evaluation.user_name || '',
      evaluation.manager_id,
      evaluation.manager_name || '',
      evaluation.filiale_name || '',
      evaluation.direction_name || '',
      evaluation.status || 'en_attente',
      Number(evaluation.score_global || 0),
      payload,
    ];
  }
}

export const evaluationRepository = new EvaluationRepository();
