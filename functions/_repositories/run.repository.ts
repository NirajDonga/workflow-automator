import { adminQuery } from '../_utils/graphql-client';
import { RunStatus, StepRunStatus, TriggerType, StepRun } from '../_utils/types';

export async function createRun(
  workflowId: string,
  triggeredBy: string | null,
  triggerType: TriggerType,
): Promise<string> {
  const data = await adminQuery<{
    insert_workflow_runs_one: { id: string };
  }>(
    `mutation($workflowId: uuid!, $triggeredBy: uuid, $triggerType: trigger_type!, $status: run_status!) {
      insert_workflow_runs_one(object: {
        workflow_id: $workflowId,
        triggered_by: $triggeredBy,
        trigger_type: $triggerType,
        status: $status,
        started_at: "now()"
      }) { id }
    }`,
    { workflowId, triggeredBy, triggerType, status: 'running' as RunStatus },
  );
  return data.insert_workflow_runs_one.id;
}

export async function updateRunStatus(runId: string, status: RunStatus): Promise<void> {
  const set: Record<string, unknown> = { status };
  if (status === 'completed' || status === 'failed') set.completed_at = 'now()';

  await adminQuery(
    `mutation($runId: uuid!, $set: workflow_runs_set_input!) {
      update_workflow_runs_by_pk(pk_columns: { id: $runId }, _set: $set) { id }
    }`,
    { runId, set },
  );
}

export async function createStepRun(runId: string, stepId: string): Promise<string> {
  const data = await adminQuery<{
    insert_step_runs_one: { id: string };
  }>(
    `mutation($runId: uuid!, $stepId: uuid!) {
      insert_step_runs_one(object: { run_id: $runId, step_id: $stepId }) { id }
    }`,
    { runId, stepId },
  );
  return data.insert_step_runs_one.id;
}

export async function updateStepRun(
  stepRunId: string,
  update: {
    status: StepRunStatus;
    input?: Record<string, unknown> | null;
    output?: Record<string, unknown>;
    error?: string;
    attempt_count?: number;
    approved_by?: string;
    approved_at?: string;
  },
): Promise<void> {
  await adminQuery(
    `mutation($id: uuid!, $set: step_runs_set_input!) {
      update_step_runs_by_pk(pk_columns: { id: $id }, _set: $set) { id }
    }`,
    { id: stepRunId, set: update },
  );
}

export async function getStepRun(stepRunId: string): Promise<StepRun> {
  const data = await adminQuery<{
    step_runs_by_pk: StepRun | null;
  }>(
    `query($id: uuid!) {
      step_runs_by_pk(id: $id) {
        id run_id step_id status input output error attempt_count
        approved_by approved_at created_at
      }
    }`,
    { id: stepRunId },
  );
  if (!data.step_runs_by_pk) throw new Error(`StepRun ${stepRunId} not found`);
  return data.step_runs_by_pk;
}

export async function getWorkflowRun(runId: string): Promise<{ id: string; workflow_id: string; status: RunStatus }> {
  const data = await adminQuery<{
    workflow_runs_by_pk: { id: string; workflow_id: string; status: RunStatus } | null;
  }>(
    `query($id: uuid!) {
      workflow_runs_by_pk(id: $id) { id, workflow_id, status }
    }`,
    { id: runId },
  );
  if (!data.workflow_runs_by_pk) throw new Error(`Run ${runId} not found`);
  return data.workflow_runs_by_pk;
}

export async function getStepRunsByRunId(runId: string): Promise<StepRun[]> {
  const data = await adminQuery<{ step_runs: StepRun[] }>(
    `query($runId: uuid!) {
      step_runs(where: { run_id: { _eq: $runId } }, order_by: { workflow_step: { order_index: asc } }) {
        id run_id step_id status input output error attempt_count
        approved_by approved_at created_at
      }
    }`,
    { runId },
  );
  return data.step_runs;
}
