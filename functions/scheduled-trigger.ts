import { Request, Response } from 'express';
import { adminQuery } from './_utils/graphql-client';
import { executeWorkflow } from './_services/workflow-execution.service';
import { WorkflowTrigger } from './_utils/types';

export default async function handler(_req: Request, res: Response): Promise<void> {
  try {
    const data = await adminQuery<{ workflow_triggers: WorkflowTrigger[] }>(
      `query {
        workflow_triggers(where: { trigger_type: { _eq: "scheduled" } }) {
          id workflow_id trigger_type config created_at
        }
      }`,
      {},
    );

    for (const trigger of data.workflow_triggers) {
      if (!isDue(trigger.config)) continue;

      try {
        await executeWorkflow(trigger.workflow_id, null, 'scheduled');
      } catch (err) {
        console.error(`Scheduled run failed for workflow ${trigger.workflow_id}:`, err);
      }
    }

    res.json({ ok: true, processed: data.workflow_triggers.length });
  } catch (err) {
    console.error('Scheduled trigger error:', err);
    res.status(500).json({ message: 'Internal server error' });
  }
}

function isDue(config: Record<string, unknown>): boolean {
  const cron = config.cron as string | undefined;
  if (!cron) return false;

  const now = new Date();
  const [minute, hour] = cron.split(' ');

  if (minute !== '*' && Number(minute) !== now.getUTCMinutes()) return false;
  if (hour !== '*' && Number(hour) !== now.getUTCHours()) return false;

  return true;
}
