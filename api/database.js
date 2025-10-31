import Database from 'better-sqlite3';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { existsSync, mkdirSync } from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DB_DIR = join(__dirname, '..', 'data');
const DB_PATH = join(DB_DIR, 'iso20022.db');

if (!existsSync(DB_DIR)) {
  mkdirSync(DB_DIR, { recursive: true });
}

const db = new Database(DB_PATH);

db.pragma('foreign_keys = ON');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idempotency_key TEXT UNIQUE NOT NULL,
      message_type TEXT NOT NULL CHECK(message_type IN ('PACS002', 'PACS004', 'PACS008')),
      request_data TEXT NOT NULL,
      xml_content TEXT NOT NULL,
      msg_id TEXT,
      end_to_end_id TEXT,
      status TEXT DEFAULT 'generated' CHECK(status IN ('generated', 'sent', 'failed')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_idempotency_key ON messages(idempotency_key)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_message_type ON messages(message_type)
  `);

  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_created_at ON messages(created_at)
  `);

  console.log('✓ Database initialized successfully');
}

export function findByIdempotencyKey(idempotencyKey) {
  return db.prepare(`
    SELECT * FROM messages 
    WHERE idempotency_key = ?
  `).get(idempotencyKey);
}

export function insertMessage(data) {
  const stmt = db.prepare(`
    INSERT INTO messages (
      idempotency_key,
      message_type,
      request_data,
      xml_content,
      msg_id,
      end_to_end_id,
      status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const result = stmt.run(
    data.idempotencyKey,
    data.messageType,
    data.requestData,
    data.xmlContent,
    data.msgId,
    data.endToEndId,
    data.status || 'generated'
  );

  return result.lastInsertRowid;
}

export function findById(id) {
  return db.prepare(`
    SELECT * FROM messages WHERE id = ?
  `).get(id);
}

export function findAll({ limit = 50, offset = 0, messageType = null } = {}) {
  let query = 'SELECT * FROM messages';
  const params = [];

  if (messageType) {
    query += ' WHERE message_type = ?';
    params.push(messageType);
  }

  query += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  params.push(limit, offset);

  return db.prepare(query).all(...params);
}

export function updateStatus(id, status) {
  const stmt = db.prepare(`
    UPDATE messages 
    SET status = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(status, id);
  return result.changes > 0;
}

export function updateXmlContent(id, xmlContent) {
  const stmt = db.prepare(`
    UPDATE messages 
    SET xml_content = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `);

  const result = stmt.run(xmlContent, id);
  return result.changes > 0;
}

export function getStatistics() {
  const stats = db.prepare(`
    SELECT 
      message_type,
      status,
      COUNT(*) as count
    FROM messages
    GROUP BY message_type, status
  `).all();

  const total = db.prepare('SELECT COUNT(*) as count FROM messages').get();

  return {
    total: total.count,
    stats
  };
}

export { db };
