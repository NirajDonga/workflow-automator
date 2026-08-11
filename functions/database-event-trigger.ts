import { Request, Response } from 'express';
import { adminQuery } from './_utils/graphql-client';
import { executeWorkflow } from './_services/workflow-execution.service';
import { WorkflowTrigger } from './_utils/types';

export default async function handler(req: Request, res: Response): Promise<void> {
  try {
    const tableName = req.body?.table?.name as string | undefined;
    if (!tableName) {
      res.status(400).json({ message: 'Missing table info' });
      return;
    }

    const data = await adminQuery<{ workflow_triggers: WorkflowTrigger[] }>(
      `query($table: String!) {
        workflow_triggers(where: {
          trigger_type: { _eq: "database_event" },
          config: { _contains: { table: $table } }
        }) {
          id workflow_id trigger_type config created_at
        }
      }`,
      { table: tableName },
    );

    for (const trigger of data.workflow_triggers) {
      try {
        await executeWorkflow(trigger.workflow_id, null, 'database_event');
      } catch (err) {
        console.error(`DB event trigger failed for workflow ${trigger.workflow_id}:`, err);
      }
    }

    res.json({ ok: true, triggered: data.workflow_triggers.length });
  } catch (err) {
    console.error('Database event trigger error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}
