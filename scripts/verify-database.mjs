import 'dotenv/config';
import mysql from 'mysql2/promise';

const database = process.env.DB_NAME || 'revue_annuel';
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database,
});

try {
  const [tables] = await connection.query(
    `SELECT TABLE_NAME
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA = ?
     ORDER BY TABLE_NAME`,
    [database],
  );
  const [foreignKeys] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM information_schema.REFERENTIAL_CONSTRAINTS
     WHERE CONSTRAINT_SCHEMA = ?`,
    [database],
  );
  const [profilePhotos] = await connection.query(
    `SELECT COUNT(*) AS total
     FROM users
     WHERE avatar IS NOT NULL AND TRIM(avatar) <> ''`,
  );

  const counts = {};
  for (const { TABLE_NAME } of tables) {
    const safeTableName = String(TABLE_NAME).replace(/`/g, '``');
    const [rows] = await connection.query(`SELECT COUNT(*) AS total FROM \`${safeTableName}\``);
    counts[TABLE_NAME] = Number(rows[0].total);
  }

  console.log(JSON.stringify({
    database,
    tableCount: tables.length,
    foreignKeyCount: Number(foreignKeys[0].total),
    profilePhotoCount: Number(profilePhotos[0].total),
    counts,
  }, null, 2));
} finally {
  await connection.end();
}
