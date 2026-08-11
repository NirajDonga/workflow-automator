import { StepType } from '../../_utils/types';
import { IStepHandler } from './types';
import { LlmCallHandler } from './llm-call.handler';
import { HttpRequestHandler } from './http-request.handler';
import { DbWriteHandler } from './db-write.handler';
import { NotifyHandler } from './notify.handler';
import { ConditionalBranchHandler } from './conditional-branch.handler';
import { ApprovalGateHandler } from './approval-gate.handler';

const registry: Record<StepType, IStepHandler> = {
  llm_call: new LlmCallHandler(),
  http_request: new HttpRequestHandler(),
  db_write: new DbWriteHandler(),
  notify: new NotifyHandler(),
  conditional_branch: new ConditionalBranchHandler(),
  approval_gate: new ApprovalGateHandler(),
};

export function getStepHandler(type: StepType): IStepHandler {
  return registry[type];
}
