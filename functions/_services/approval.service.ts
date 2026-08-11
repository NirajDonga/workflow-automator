import { getStepRun, getWorkflowRun, getStepRunsByRunId, updateStepRun } from '../_repositories/run.repository';
import { getWorkflowWithSteps } from '../_repositories/workflow.repository';
import { assertCanApprove } from './permission.service';
import { resumeAfterApproval } from './workflow-execution.service';
import { AppError } from '../_utils/errors';

export async function approveAndResume(stepRunId: string, approverId: string): Promise<{ run_id: string }> {
  const stepRun = await getStepRun(stepRunId);
  if (stepRun.status !== 'paused') {
    throw new AppError('Step is not awaiting approval', 400, 'BAD_REQUEST');
  }

  const run = await getWorkflowRun(stepRun.run_id);
  if (run.status !== 'paused') {
    throw new AppError('Run is not paused', 400, 'BAD_REQUEST');
  }

  const workflow = await getWorkflowWithSteps(run.workflow_id);
  await assertCanApprove(approverId, workflow.org_id);

  await updateStepRun(stepRunId, {
    status: 'success',
    approved_by: approverId,
    approved_at: new Date().toISOString(),
  });

  const allStepRuns = await getStepRunsByRunId(stepRun.run_id);
  const stepRunIds = allStepRuns.map(sr => sr.id);
  const approvedIndex = allStepRuns.findIndex(sr => sr.id === stepRunId);

  await resumeAfterApproval(
    stepRun.run_id,
    workflow.workflow_steps,
    stepRunIds,
    workflow.org_id,
    approvedIndex + 1,
    stepRun.input,
  );

  return { run_id: stepRun.run_id };
}
