import * as SQLite from 'expo-sqlite';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '@/constants/config';
import { ASYNC_KEYS } from '@/services/storage';
import {
  migrateHistoryToSessions,
  normalizeFortuneSession,
} from '@/utils/conversationSession';
import type { FortuneResult, FortuneSession } from '@/types';

const DB_NAME = 'guaji.db';
const MIGRATION_KEY = 'fortune_history_migrated_v1';

interface SessionRow {
  id: string;
  channel_mode: string | null;
  scene_mode: string | null;
  title: string | null;
  preview: string | null;
  result_json: string | null;
  messages_json: string;
  updated_at: string;
  created_at: string;
}

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let writeChain: Promise<unknown> = Promise.resolve();

function enqueueWrite<T>(task: () => Promise<T>): Promise<T> {
  const run = writeChain.then(task, task);
  writeChain = run.then(
    () => undefined,
    () => undefined
  );
  return run;
}

function rowToSession(row: SessionRow): FortuneSession {
  let result: FortuneResult | undefined;
  let messages: FortuneSession['messages'] = [];

  if (row.result_json) {
    try {
      result = JSON.parse(row.result_json) as FortuneResult;
    } catch {
      result = undefined;
    }
  }

  try {
    messages = JSON.parse(row.messages_json) as FortuneSession['messages'];
  } catch {
    messages = [];
  }

  return normalizeFortuneSession({
    id: row.id,
    channelMode: (row.channel_mode as FortuneSession['channelMode']) ?? undefined,
    sceneMode: (row.scene_mode as FortuneSession['sceneMode']) ?? undefined,
    title: row.title ?? undefined,
    preview: row.preview ?? undefined,
    result,
    messages,
    updatedAt: row.updated_at,
    createdAt: row.created_at,
  });
}

function sessionToParams(session: FortuneSession) {
  const normalized = normalizeFortuneSession(session);
  return {
    $id: normalized.id,
    $channel_mode: normalized.channelMode ?? null,
    $scene_mode: normalized.sceneMode ?? null,
    $title: normalized.title ?? null,
    $preview: normalized.preview ?? null,
    $result_json: normalized.result ? JSON.stringify(normalized.result) : null,
    $messages_json: JSON.stringify(normalized.messages ?? []),
    $updated_at: normalized.updatedAt,
    $created_at: normalized.createdAt ?? normalized.updatedAt,
  };
}

async function trimSessions(db: SQLite.SQLiteDatabase, maxRecords: number): Promise<void> {
  await db.runAsync(
    `DELETE FROM fortune_sessions
     WHERE id NOT IN (
       SELECT id FROM fortune_sessions
       ORDER BY updated_at DESC
       LIMIT ?
     )`,
    maxRecords
  );
}

async function migrateFromAsyncStorage(db: SQLite.SQLiteDatabase): Promise<void> {
  const migrated = await db.getFirstAsync<{ value: string }>(
    'SELECT value FROM app_meta WHERE key = ?',
    MIGRATION_KEY
  );
  if (migrated?.value === '1') return;

  const raw = await AsyncStorage.getItem(ASYNC_KEYS.FORTUNE_HISTORY);
  if (raw) {
    try {
      const sessions = migrateHistoryToSessions(JSON.parse(raw));
      for (const session of sessions) {
        await db.runAsync(
          `INSERT OR REPLACE INTO fortune_sessions (
            id, channel_mode, scene_mode, title, preview,
            result_json, messages_json, updated_at, created_at
          ) VALUES (
            $id, $channel_mode, $scene_mode, $title, $preview,
            $result_json, $messages_json, $updated_at, $created_at
          )`,
          sessionToParams(session)
        );
      }
    } catch {
      // 旧数据损坏时跳过迁移，不阻塞启动
    }
  }

  await db.runAsync(
    'INSERT OR REPLACE INTO app_meta (key, value) VALUES (?, ?)',
    MIGRATION_KEY,
    '1'
  );
}

async function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = (async () => {
      const db = await SQLite.openDatabaseAsync(DB_NAME);
      await db.execAsync(`
        PRAGMA journal_mode = WAL;
        CREATE TABLE IF NOT EXISTS fortune_sessions (
          id TEXT PRIMARY KEY NOT NULL,
          channel_mode TEXT,
          scene_mode TEXT,
          title TEXT,
          preview TEXT,
          result_json TEXT,
          messages_json TEXT NOT NULL DEFAULT '[]',
          updated_at TEXT NOT NULL,
          created_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_fortune_sessions_updated_at
          ON fortune_sessions(updated_at DESC);
        CREATE TABLE IF NOT EXISTS app_meta (
          key TEXT PRIMARY KEY NOT NULL,
          value TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS in_flight_tasks (
          id TEXT PRIMARY KEY NOT NULL,
          session_id TEXT NOT NULL,
          task_type TEXT NOT NULL,
          status TEXT NOT NULL,
          payload_json TEXT NOT NULL DEFAULT '{}',
          result_json TEXT,
          error_message TEXT,
          created_at TEXT NOT NULL,
          updated_at TEXT NOT NULL
        );
        CREATE INDEX IF NOT EXISTS idx_in_flight_tasks_session
          ON in_flight_tasks(session_id);
        CREATE INDEX IF NOT EXISTS idx_in_flight_tasks_status
          ON in_flight_tasks(status, updated_at DESC);
      `);
      await migrateFromAsyncStorage(db);
      await trimSessions(db, APP_CONFIG.maxHistoryRecords);
      return db;
    })();
  }
  return dbPromise;
}

export async function initSessionDb(): Promise<void> {
  await getDb();
}

/** 串行化写入，避免与 in_flight_tasks 并发写锁冲突 */
export function runDbWrite<T>(
  task: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  return enqueueWrite(async () => {
    const db = await getDb();
    return task(db);
  });
}

export async function runDbRead<T>(
  task: (db: SQLite.SQLiteDatabase) => Promise<T>
): Promise<T> {
  const db = await getDb();
  return task(db);
}

export async function listFortuneSessions(
  limit: number = APP_CONFIG.maxHistoryRecords
): Promise<FortuneSession[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM fortune_sessions ORDER BY updated_at DESC LIMIT ?',
    limit
  );
  return rows.map(rowToSession);
}

export async function getFortuneSession(id: string): Promise<FortuneSession | null> {
  const db = await getDb();
  const row = await db.getFirstAsync<SessionRow>(
    'SELECT * FROM fortune_sessions WHERE id = ?',
    id
  );
  return row ? rowToSession(row) : null;
}

export async function upsertFortuneSession(session: FortuneSession): Promise<void> {
  return enqueueWrite(async () => {
    const db = await getDb();
    await db.runAsync(
      `INSERT OR REPLACE INTO fortune_sessions (
        id, channel_mode, scene_mode, title, preview,
        result_json, messages_json, updated_at, created_at
      ) VALUES (
        $id, $channel_mode, $scene_mode, $title, $preview,
        $result_json, $messages_json, $updated_at, $created_at
      )`,
      sessionToParams(session)
    );
    await trimSessions(db, APP_CONFIG.maxHistoryRecords);
  });
}

export async function clearFortuneSessions(): Promise<void> {
  return enqueueWrite(async () => {
    const db = await getDb();
    await db.runAsync('DELETE FROM fortune_sessions');
  });
}
