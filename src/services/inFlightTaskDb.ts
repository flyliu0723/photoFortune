import { runDbRead, runDbWrite } from '@/services/sessionDb';

export type InFlightTaskType =
  | 'fortune_ritual'
  | 'chat_request'
  | 'group_turn'
  | 'group_commentary';

export type InFlightTaskStatus = 'running' | 'api_done' | 'failed';

export interface InFlightTaskRecord {
  id: string;
  sessionId: string;
  taskType: InFlightTaskType;
  status: InFlightTaskStatus;
  payloadJson: string;
  resultJson: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

interface InFlightTaskRow {
  id: string;
  session_id: string;
  task_type: string;
  status: string;
  payload_json: string;
  result_json: string | null;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function rowToRecord(row: InFlightTaskRow): InFlightTaskRecord {
  return {
    id: row.id,
    sessionId: row.session_id,
    taskType: row.task_type as InFlightTaskType,
    status: row.status as InFlightTaskStatus,
    payloadJson: row.payload_json,
    resultJson: row.result_json,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function upsertInFlightTask(
  record: Omit<InFlightTaskRecord, 'createdAt' | 'updatedAt'> & {
    createdAt?: string;
    updatedAt?: string;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const createdAt = record.createdAt ?? now;
  const updatedAt = record.updatedAt ?? now;

  await runDbWrite((db) =>
    db.runAsync(
      `INSERT OR REPLACE INTO in_flight_tasks (
        id, session_id, task_type, status, payload_json,
        result_json, error_message, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.sessionId,
      record.taskType,
      record.status,
      record.payloadJson,
      record.resultJson,
      record.errorMessage,
      createdAt,
      updatedAt
    )
  );
}

export async function getInFlightTaskBySession(
  sessionId: string
): Promise<InFlightTaskRecord | null> {
  return runDbRead(async (db) => {
    const row = await db.getFirstAsync<InFlightTaskRow>(
      `SELECT * FROM in_flight_tasks
       WHERE session_id = ?
       ORDER BY updated_at DESC
       LIMIT 1`,
      sessionId
    );
    return row ? rowToRecord(row) : null;
  });
}

export async function clearInFlightTask(sessionId: string): Promise<void> {
  await runDbWrite((db) =>
    db.runAsync('DELETE FROM in_flight_tasks WHERE session_id = ?', sessionId)
  );
}

export async function listRecoverableInFlightTasks(): Promise<InFlightTaskRecord[]> {
  return runDbRead(async (db) => {
    const rows = await db.getAllAsync<InFlightTaskRow>(
      `SELECT * FROM in_flight_tasks
       WHERE status IN ('api_done', 'failed', 'running')
       ORDER BY updated_at DESC
       LIMIT 5`
    );
    return rows.map(rowToRecord);
  });
}
