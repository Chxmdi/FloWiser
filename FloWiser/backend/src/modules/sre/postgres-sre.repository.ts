import { randomUUID } from "node:crypto";
import type { Pool } from "pg";
import type { SreRunbookExecutionRecord } from "./sre.types.js";

const mapExecution = (row: Record<string, unknown>): SreRunbookExecutionRecord => ({
  runbookExecutionId: row.runbook_execution_id as string,
  runbookKey: row.runbook_key as string,
  actor: row.actor as string,
  status: row.status as string,
  input: (row.input as Record<string, unknown>) ?? {},
  output: (row.output as Record<string, unknown>) ?? {},
  createdAt: row.created_at as string,
  completedAt: (row.completed_at as string | null) ?? undefined
});

export class PostgresSreRepository {
  constructor(private readonly pool: Pool) {}

  async createExecution(input: { runbookKey: string; actor: string; status: string; input: Record<string, unknown> }) {
    const result = await this.pool.query(
      `
        INSERT INTO sre_runbook_executions (
          runbook_execution_id, runbook_key, actor, status, input, output, created_at
        ) VALUES (
          $1, $2, $3, $4, $5::jsonb, '{}'::jsonb, NOW()
        ) RETURNING *;
      `,
      [randomUUID(), input.runbookKey, input.actor, input.status, JSON.stringify(input.input)]
    );
    return mapExecution(result.rows[0] as Record<string, unknown>);
  }

  async completeExecution(runbookExecutionId: string, status: string, output: Record<string, unknown>) {
    const result = await this.pool.query(
      `
        UPDATE sre_runbook_executions
        SET status = $2,
            output = $3::jsonb,
            completed_at = NOW()
        WHERE runbook_execution_id = $1
        RETURNING *;
      `,
      [runbookExecutionId, status, JSON.stringify(output)]
    );
    return mapExecution(result.rows[0] as Record<string, unknown>);
  }

  async listExecutions(limit = 100) {
    const result = await this.pool.query(
      `SELECT * FROM sre_runbook_executions ORDER BY created_at DESC LIMIT $1`,
      [limit]
    );
    return result.rows.map((row) => mapExecution(row as Record<string, unknown>));
  }
}
