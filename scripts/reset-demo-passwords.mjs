import 'dotenv/config';
import { randomBytes, scryptSync } from 'crypto';
import mysql from 'mysql2/promise';

const demoEmails = [
  'rh@groupepremium.ma',
  'nabil.idrissi@groupepremium.ma',
  'youssef.chraibi@groupepremium.ma',
  'salma.elamrani@groupepremium.ma',
  'karim.berrada@groupepremium.ma',
  'amine.tazi@groupepremium.ma',
  'hind.loudiyi@groupepremium.ma',
  'omar.fassi@groupepremium.ma',
  'sofia.benbrahim@groupepremium.ma',
  'mehdi.alaoui@groupepremium.ma',
  'zineb.filali@groupepremium.ma',
  'dg@groupepremium.ma',
];

const salt = randomBytes(16).toString('hex');
const passwordHash = `scrypt$${salt}$${scryptSync('demo1234', salt, 64).toString('hex')}`;
const placeholders = demoEmails.map(() => '?').join(', ');
const connection = await mysql.createConnection({
  host: process.env.DB_HOST || '127.0.0.1',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'revue_annuel',
});

try {
  const [result] = await connection.execute(
    `UPDATE users SET password_hash = ? WHERE email IN (${placeholders})`,
    [passwordHash, ...demoEmails],
  );
  console.log(JSON.stringify({ updatedDemoAccounts: result.affectedRows }));
} finally {
  await connection.end();
}
