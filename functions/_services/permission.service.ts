import { getMemberRole } from '../_repositories/org.repository';
import { OrgRole, StepType, TriggerType } from '../_utils/types';
import { ForbiddenError } from '../_utils/errors';

const OWNER_ONLY_STEPS: StepType[] = ['db_write', 'notify'];
const OWNER_ONLY_TRIGGERS: TriggerType[] = ['webhook'];

export async function assertCanTriggerRun(userId: string, orgId: string): Promise<OrgRole> {
  const role = await getMemberRole(userId, orgId);
  if (!role || role === 'viewer') {
    throw new ForbiddenError('Only owners and editors can trigger runs');
  }
  return role;
}

export function assertCanManageStepType(role: OrgRole, stepType: StepType): void {
  if (OWNER_ONLY_STEPS.includes(stepType) && role !== 'owner') {
    throw new ForbiddenError(`Only owners can manage ${stepType} steps`);
  }
}

export function assertCanManageTriggerType(role: OrgRole, triggerType: TriggerType): void {
  if (OWNER_ONLY_TRIGGERS.includes(triggerType) && role !== 'owner') {
    throw new ForbiddenError(`Only owners can manage ${triggerType} triggers`);
  }
}

export async function assertCanApprove(userId: string, orgId: string): Promise<void> {
  const role = await getMemberRole(userId, orgId);
  if (!role || role === 'viewer') {
    throw new ForbiddenError('Only owners and editors can approve steps');
  }
}
