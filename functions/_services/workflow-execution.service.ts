import { getWorkflowWithSteps } from '../_repositories/workflow.repository';
import {
  createRun, updateRunStatus, createStepRun, updateStepRun,
} from '../_repositories/run.repository';
import { getOrgQuota, incrementQuotaUsed } from '../_repositories/org.repository';
import { assertCanTriggerRun } from './permission.service';
import { getStepHandler } from './step-handlers/registry';
import { QuotaExceededError } from '../_utils/errors';
import { TriggerType, StepType, WorkflowStep } from '../_utils/types';
import { IStepContext, StepResult } from './step-handlers/types';

const RETRYABLE: Set<StepType> = new Set(['llm_call', 'http_request']);

export async function executeWorkflow(
  workflowId: string,
  triggeredBy: string | null,
  triggerType: TriggerType,
): Promise<{ run_id: string }> {
  const workflow = await getWorkflowWithSteps(workflowId);

  if (triggeredBy) {
    await assertCanTriggerRun(triggeredBy, workflow.org_id);
  }

  const { quota_limit, quota_used } = await getOrgQuota(workflow.org_id);
  if (quota_used >= quota_limit) throw new QuotaExceededError();

  const runId = await createRun(workflowId, triggeredBy, triggerType);
  const stepRunIds: string[] = [];
  for (const step of workflow.workflow_steps) {
    stepRunIds.push(await createStepRun(runId, step.id));
  }

  await runStepsFromIndex(workflow.workflow_steps, stepRunIds, runId, workflow.org_id, 0, null);
  return { run_id: runId };
}

export async function resumeAfterApproval(
  runId: string,
  steps: WorkflowStep[],
  stepRunIds: string[],
  orgId: string,
  fromIndex: number,
  previousOutput: Record<string, unknown> | null,
): Promise<void> {
  await updateRunStatus(runId, 'running');
  await runStepsFromIndex(steps, stepRunIds, runId, orgId, fromIndex, previousOutput);
}

async function runStepsFromIndex(
  steps: WorkflowStep[],
  stepRunIds: string[],
  runId: string,
  orgId: string,
  fromIndex: number,
  previousOutput: Record<string, unknown> | null,
): Promise<void> {
  let prevOutput = previousOutput;

  for (let i = fromIndex; i < steps.length; i++) {
    const step = steps[i];
    const stepRunId = stepRunIds[i];

    await updateStepRun(stepRunId, { status: 'running', input: prevOutput });

    const ctx: IStepContext = {
      run_id: runId,
      step_run_id: stepRunId,
      previous_output: prevOutput,
      config: step.config,
    };

    let result = await safeExecute(step.step_type, ctx);

    if (result.status === 'failed' && RETRYABLE.has(step.step_type)) {
      result = await safeExecute(step.step_type, ctx);
      await updateStepRun(stepRunId, {
        status: result.status, output: result.output, error: result.error, attempt_count: 2,
      });
    } else {
      await updateStepRun(stepRunId, {
        status: result.status, output: result.output, error: result.error, attempt_count: 1,
      });
    }

    if (result.status === 'paused') {
      await updateRunStatus(runId, 'paused');
      return;
    }
    if (result.status === 'failed') {
      await updateRunStatus(runId, 'failed');
      return;
    }
    if (result.status === 'success') {
      prevOutput = result.output ?? null;
    }
  }

  await updateRunStatus(runId, 'completed');
  await incrementQuotaUsed(orgId);
}

async function safeExecute(stepType: StepType, ctx: IStepContext): Promise<StepResult> {
  try {
    return await getStepHandler(stepType).execute(ctx);
  } catch (err) {
    return { status: 'failed', error: err instanceof Error ? err.message : String(err) };
  }
}
