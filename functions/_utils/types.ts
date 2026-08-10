export type OrgRole = 'owner' | 'editor' | 'viewer';
export type StepType = 'llm_call' | 'http_request' | 'db_write' | 'notify' | 'conditional_branch' | 'approval_gate';
export type TriggerType = 'manual' | 'webhook' | 'scheduled' | 'database_event';
export type RunStatus = 'pending' | 'running' | 'paused' | 'completed' | 'failed';
export type StepRunStatus = 'pending' | 'running' | 'success' | 'failed' | 'skipped' | 'paused';

export interface Organization {
  id: string;
  name: string;
  quota_limit: number;
  quota_used: number;
  created_at: string;
}

export interface OrgMember {
  id: string;
  org_id: string;
  user_id: string;
  role: OrgRole;
  created_at: string;
}

export interface Workflow {
  id: string;
  org_id: string;
  name: string;
  created_at: string;
}

export interface WorkflowStep {
  id: string;
  workflow_id: string;
  step_type: StepType;
  config: Record<string, unknown>;
  order_index: number;
  created_at: string;
}

export interface WorkflowTrigger {
  id: string;
  workflow_id: string;
  trigger_type: TriggerType;
  config: Record<string, unknown>;
  created_at: string;
}

export interface WorkflowRun {
  id: string;
  workflow_id: string;
  triggered_by: string | null;
  trigger_type: TriggerType;
  status: RunStatus;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface StepRun {
  id: string;
  run_id: string;
  step_id: string;
  status: StepRunStatus;
  input: Record<string, unknown> | null;
  output: Record<string, unknown> | null;
  error: string | null;
  attempt_count: number;
  approved_by: string | null;
  approved_at: string | null;
  created_at: string;
}

export interface HasuraSessionVars {
  'x-hasura-user-id': string;
  'x-hasura-role': string;
  [key: string]: string;
}

export interface HasuraActionPayload<T = Record<string, unknown>> {
  action: { name: string };
  input: T;
  session_variables: HasuraSessionVars;
}

export interface HasuraEventPayload<T = Record<string, unknown>> {
  event: {
    op: 'INSERT' | 'UPDATE' | 'DELETE';
    data: { old: T | null; new: T | null };
  };
  table: { schema: string; name: string };
}
