import mysql, { RowDataPacket } from 'mysql2/promise';
import {
  auditLogsData,
  campagnesData,
  competencesTemplatesData,
  directionsData,
  fichesEvaluationData,
  filialesData,
  notificationsConfigData,
  notificationsData,
  postesData,
  usersData,
} from './db';
import { hashPassword } from './passwordService';

const tableDefinitions = [
  `CREATE TABLE IF NOT EXISTS filiales (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    city VARCHAR(150) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_filiales_name_city (name, city)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS directions (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    code VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_directions_code (code)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS postes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    direction_id BIGINT UNSIGNED NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_postes_direction (direction_id),
    CONSTRAINT fk_postes_direction FOREIGN KEY (direction_id) REFERENCES directions(id)
      ON UPDATE CASCADE ON DELETE RESTRICT
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS fiches_evaluation (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    poste_id BIGINT UNSIGNED NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_fiches_poste (poste_id),
    CONSTRAINT fk_fiches_poste FOREIGN KEY (poste_id) REFERENCES postes(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS competence_templates (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    fiche_id BIGINT UNSIGNED NOT NULL,
    axe ENUM('savoir', 'savoir_faire', 'savoir_etre') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    coefficient DECIMAL(6,2) NOT NULL DEFAULT 1,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_competence_templates_fiche (fiche_id),
    KEY idx_competence_templates_axe (axe),
    CONSTRAINT fk_competence_templates_fiche FOREIGN KEY (fiche_id) REFERENCES fiches_evaluation(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS users (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role ENUM('rh', 'manager', 'collaborateur', 'dg') NOT NULL,
    poste_id BIGINT UNSIGNED NULL,
    filiale_id BIGINT UNSIGNED NULL,
    direction_id BIGINT UNSIGNED NULL,
    manager_id BIGINT UNSIGNED NULL,
    avatar TEXT NULL,
    password_hash VARCHAR(255) NULL,
    category ENUM('Cadre', 'Manager', 'Technicien', 'Agent') NOT NULL DEFAULT 'Cadre',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_users_email (email),
    KEY idx_users_role (role),
    KEY idx_users_manager (manager_id),
    CONSTRAINT fk_users_poste FOREIGN KEY (poste_id) REFERENCES postes(id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_users_filiale FOREIGN KEY (filiale_id) REFERENCES filiales(id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_users_direction FOREIGN KEY (direction_id) REFERENCES directions(id)
      ON UPDATE CASCADE ON DELETE SET NULL,
    CONSTRAINT fk_users_manager FOREIGN KEY (manager_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS campagnes (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    year SMALLINT UNSIGNED NOT NULL,
    start_date DATE NOT NULL,
    auto_eval_deadline DATE NOT NULL,
    manager_eval_deadline DATE NOT NULL,
    dg_validation_deadline DATE NOT NULL,
    end_date DATE NOT NULL,
    status ENUM('brouillon', 'ouverte', 'en_cours', 'cloturee', 'archivee') NOT NULL DEFAULT 'brouillon',
    filiales JSON NULL,
    directions JSON NULL,
    categories JSON NULL,
    managers_informes JSON NULL,
    total_collaborateurs INT UNSIGNED NOT NULL DEFAULT 0,
    total_managers INT UNSIGNED NOT NULL DEFAULT 0,
    total_dgs INT UNSIGNED NOT NULL DEFAULT 0,
    progress DECIMAL(5,2) NOT NULL DEFAULT 0,
    regles_evaluations TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_campagnes_year (year),
    KEY idx_campagnes_status (status)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS evaluation_competences (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    evaluation_id BIGINT UNSIGNED NOT NULL,
    competence_id BIGINT UNSIGNED NULL,
    axe ENUM('savoir', 'savoir_faire', 'savoir_etre') NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    coefficient DECIMAL(6,2) NOT NULL DEFAULT 1,
    score DECIMAL(6,2) NOT NULL DEFAULT 0,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_evaluation_competences_evaluation (evaluation_id),
    CONSTRAINT fk_evaluation_competences_revue FOREIGN KEY (evaluation_id) REFERENCES revue_annuel(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_evaluation_competences_template FOREIGN KEY (competence_id) REFERENCES competence_templates(id)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS auto_evaluations (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    evaluation_id BIGINT UNSIGNED NOT NULL,
    user_id BIGINT UNSIGNED NULL,
    balance TEXT NOT NULL,
    achievements TEXT NOT NULL,
    difficulties TEXT NOT NULL,
    aspirations TEXT NOT NULL,
    submitted_at DATETIME NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_auto_evaluation_revue (evaluation_id),
    CONSTRAINT fk_auto_evaluations_revue FOREIGN KEY (evaluation_id) REFERENCES revue_annuel(id)
      ON UPDATE CASCADE ON DELETE CASCADE,
    CONSTRAINT fk_auto_evaluations_user FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE SET NULL
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS besoins_formation (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    evaluation_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    priority ENUM('Haute', 'Moyenne', 'Basse') NOT NULL DEFAULT 'Moyenne',
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_besoins_formation_revue (evaluation_id),
    KEY idx_besoins_formation_priority (priority),
    CONSTRAINT fk_besoins_formation_revue FOREIGN KEY (evaluation_id) REFERENCES revue_annuel(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS axes_developpement (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    evaluation_id BIGINT UNSIGNED NOT NULL,
    domain VARCHAR(255) NOT NULL,
    objective TEXT NOT NULL,
    comment TEXT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_axes_developpement_revue (evaluation_id),
    CONSTRAINT fk_axes_developpement_revue FOREIGN KEY (evaluation_id) REFERENCES revue_annuel(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS objectifs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    evaluation_id BIGINT UNSIGNED NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    target_date DATE NULL,
    progress DECIMAL(5,2) NOT NULL DEFAULT 0,
    status ENUM('Non débuté', 'En cours', 'Atteint', 'Partiellement atteint', 'Dépassé') NOT NULL DEFAULT 'Non débuté',
    is_next_year BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_objectifs_revue (evaluation_id),
    KEY idx_objectifs_status (status),
    CONSTRAINT fk_objectifs_revue FOREIGN KEY (evaluation_id) REFERENCES revue_annuel(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS notifications (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    user_id BIGINT UNSIGNED NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    type VARCHAR(100) NOT NULL,
    channel VARCHAR(20) NOT NULL DEFAULT 'platform',
    link_url VARCHAR(255) NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_notifications_user_read (user_id, is_read),
    CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id)
      ON UPDATE CASCADE ON DELETE CASCADE
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS notification_configurations (
    id VARCHAR(100) NOT NULL,
    type VARCHAR(100) NOT NULL,
    label VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    enabled BOOLEAN NOT NULL DEFAULT TRUE,
    frequency VARCHAR(100) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY uq_notification_config_type (type)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,

  `CREATE TABLE IF NOT EXISTS audit_logs (
    id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
    campagne_id BIGINT UNSIGNED NULL,
    campagne_name VARCHAR(255) NOT NULL,
    user_name VARCHAR(255) NOT NULL,
    action TEXT NOT NULL,
    occurred_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    KEY idx_audit_logs_campagne (campagne_id),
    KEY idx_audit_logs_occurred_at (occurred_at)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci`,
];

export async function initializeProjectSchema(database: string) {
  const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_POOL_SIZE || 10),
    charset: 'utf8mb4',
  });

  const connection = await pool.getConnection();
  try {
    for (const definition of tableDefinitions) {
      await connection.query(definition);
    }

    const [passwordColumns] = await connection.query<RowDataPacket[]>(
      `SELECT COLUMN_NAME FROM information_schema.COLUMNS
       WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'users' AND COLUMN_NAME = 'password_hash'`,
      [database],
    );
    if (passwordColumns.length === 0) {
      await connection.query('ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL AFTER avatar');
    }

    for (const row of filialesData) {
      await connection.execute(
        'INSERT IGNORE INTO filiales (id, name, city) VALUES (?, ?, ?)',
        [row.id, row.name, row.city],
      );
    }
    for (const row of directionsData) {
      await connection.execute(
        'INSERT IGNORE INTO directions (id, name, code) VALUES (?, ?, ?)',
        [row.id, row.name, row.code],
      );
    }
    for (const row of postesData) {
      await connection.execute(
        'INSERT IGNORE INTO postes (id, name, direction_id) VALUES (?, ?, ?)',
        [row.id, row.name, row.direction_id],
      );
    }
    for (const row of fichesEvaluationData) {
      await connection.execute(
        'INSERT IGNORE INTO fiches_evaluation (id, name, poste_id, description, updated_at) VALUES (?, ?, ?, ?, ?)',
        [row.id, row.name, row.poste_id, row.description, row.updated_at],
      );
    }
    for (const row of competencesTemplatesData) {
      await connection.execute(
        `INSERT IGNORE INTO competence_templates
         (id, fiche_id, axe, name, description, coefficient) VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.fiche_id, row.axe, row.name, row.description, row.coefficient],
      );
    }
    for (const row of usersData) {
      await connection.execute(
        `INSERT IGNORE INTO users
         (id, name, email, role, poste_id, filiale_id, direction_id, manager_id, avatar, category)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.name, row.email, row.role, row.poste_id, row.filiale_id, row.direction_id, row.manager_id || null, null, row.category],
      );
    }
    await connection.query('UPDATE users SET avatar = NULL');
    const [usersWithoutPassword] = await connection.query<RowDataPacket[]>(
      'SELECT id FROM users WHERE password_hash IS NULL OR password_hash = ?',
      [''],
    );
    for (const user of usersWithoutPassword) {
      await connection.execute(
        'UPDATE users SET password_hash = ? WHERE id = ?',
        [hashPassword('demo1234'), user.id],
      );
    }
    await connection.query(
      `UPDATE revue_annuel
       SET payload = JSON_SET(payload, '$.user_avatar', '')
       WHERE JSON_VALID(payload)`,
    );
    for (const row of campagnesData) {
      await connection.execute(
        `INSERT IGNORE INTO campagnes
         (id, name, description, year, start_date, auto_eval_deadline, manager_eval_deadline,
          dg_validation_deadline, end_date, status, filiales, directions, categories,
          managers_informes, total_collaborateurs, total_managers, total_dgs, progress,
          regles_evaluations, created_at)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          row.id, row.name, row.description, row.year, row.start_date, row.auto_eval_deadline,
          row.manager_eval_deadline, row.dg_validation_deadline, row.end_date, row.status,
          JSON.stringify(row.filiales), JSON.stringify(row.directions), JSON.stringify(row.categories),
          JSON.stringify(row.managers_informes || []), row.total_collaborateurs, row.total_managers,
          row.total_dgs, row.progress, row.regles_evaluations || null, row.created_at,
        ],
      );
    }
    for (const row of notificationsConfigData) {
      await connection.execute(
        `INSERT IGNORE INTO notification_configurations
         (id, type, label, description, enabled, frequency) VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.type, row.label, row.description, row.enabled, row.frequency],
      );
    }
    for (const row of notificationsData) {
      await connection.execute(
        `INSERT IGNORE INTO notifications
         (id, user_id, title, message, is_read, type, channel, link_url, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [row.id, row.user_id, row.title, row.message, row.read, row.type, row.channel || 'platform', row.link_url || null, row.created_at],
      );
    }
    for (const row of auditLogsData) {
      await connection.execute(
        `INSERT IGNORE INTO audit_logs
         (id, campagne_id, campagne_name, user_name, action, occurred_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [row.id, row.campagne_id, row.campagne_name, row.user_name, row.action, row.timestamp],
      );
    }
  } finally {
    connection.release();
    await pool.end();
  }
}
