import mysql, { ResultSetHeader, RowDataPacket } from 'mysql2/promise';
import { evaluationRepository } from './evaluationRepository';
import { hashPassword, verifyPassword } from './passwordService';
import { User } from '../types';

const getConnection = () => mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: evaluationRepository.databaseName,
  charset: 'utf8mb4',
});

export async function verifyUserPassword(userId: number, password: string) {
  const connection = await getConnection();
  try {
    const [rows] = await connection.execute<RowDataPacket[]>(
      'SELECT password_hash FROM users WHERE id = ? LIMIT 1',
      [userId],
    );
    return Boolean(rows[0]?.password_hash && verifyPassword(password, String(rows[0].password_hash)));
  } finally {
    await connection.end();
  }
}

export async function updateUserPassword(userId: number, password: string) {
  const connection = await getConnection();
  try {
    const [result] = await connection.execute<ResultSetHeader>(
      'UPDATE users SET password_hash = ? WHERE id = ?',
      [hashPassword(password), userId],
    );
    return result.affectedRows > 0;
  } finally {
    await connection.end();
  }
}

export async function insertUserCredentials(
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    poste_id: number;
    filiale_id: number;
    direction_id: number;
    manager_id?: number;
    category: string;
  },
  password: string,
) {
  const connection = await getConnection();
  try {
    await connection.execute(
      `INSERT INTO users
       (id, name, email, role, poste_id, filiale_id, direction_id, manager_id, avatar, category, password_hash)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, NULL, ?, ?)`,
      [
        user.id, user.name, user.email, user.role, user.poste_id, user.filiale_id,
        user.direction_id, user.manager_id || null, user.category, hashPassword(password),
      ],
    );
  } finally {
    await connection.end();
  }
}

export async function findAllUsers(): Promise<User[]> {
  const connection = await getConnection();
  try {
    const [rows] = await connection.query<RowDataPacket[]>(
      `SELECT u.id, u.name, u.email, u.role, u.poste_id, p.name AS poste_name,
              u.filiale_id, f.name AS filiale_name, u.direction_id,
              d.name AS direction_name, u.manager_id, manager.name AS manager_name,
              u.category
       FROM users u
       LEFT JOIN postes p ON p.id = u.poste_id
       LEFT JOIN filiales f ON f.id = u.filiale_id
       LEFT JOIN directions d ON d.id = u.direction_id
       LEFT JOIN users manager ON manager.id = u.manager_id
       ORDER BY u.id`,
    );
    return rows.map(row => ({
      id: Number(row.id),
      name: String(row.name),
      email: String(row.email),
      role: row.role,
      poste_id: Number(row.poste_id || 0),
      poste_name: String(row.poste_name || ''),
      filiale_id: Number(row.filiale_id || 0),
      filiale_name: String(row.filiale_name || ''),
      direction_id: Number(row.direction_id || 0),
      direction_name: String(row.direction_name || ''),
      manager_id: row.manager_id ? Number(row.manager_id) : undefined,
      manager_name: row.manager_name ? String(row.manager_name) : undefined,
      avatar: '',
      category: row.category,
    }));
  } finally {
    await connection.end();
  }
}

export async function updateUserRecord(user: User) {
  const connection = await getConnection();
  try {
    await connection.execute(
      `UPDATE users
       SET name = ?, email = ?, role = ?, poste_id = ?, filiale_id = ?,
           direction_id = ?, manager_id = ?, category = ?, avatar = NULL
       WHERE id = ?`,
      [
        user.name, user.email, user.role, user.poste_id || null, user.filiale_id || null,
        user.direction_id || null, user.manager_id || null, user.category, user.id,
      ],
    );
  } finally {
    await connection.end();
  }
}

export async function deleteUserRecord(userId: number) {
  const connection = await getConnection();
  try {
    await connection.execute('DELETE FROM users WHERE id = ?', [userId]);
  } finally {
    await connection.end();
  }
}
