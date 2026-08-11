import { adminQuery } from '../_utils/graphql-client';
import { WorkflowStep } from '../_utils/types';

export interface WorkflowWithSteps {
  id: string;
  org_id: string;
  name: string;
  workflow_steps: WorkflowStep[];
}

export async function getWorkflowWithSteps(workflowId: string): Promise<WorkflowWithSteps> {
  const data = await adminQuery<{
    workflows_by_pk: WorkflowWithSteps | null;
  }>(
    `query($id: uuid!) {
      workflows_by_pk(id: $id) {
        id
        org_id
        name
        workflow_steps(order_by: { order_index: asc }) {
          id
          workflow_id
          step_type
          config
          order_index
          created_at
        }
      }
    }`,
    { id: workflowId },
  );
  if (!data.workflows_by_pk) throw new Error(`Workflow ${workflowId} not found`);
  return data.workflows_by_pk;
}
