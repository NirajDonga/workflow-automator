import { createActionHandler } from './_utils/handler';
import { executeWorkflow } from './_services/workflow-execution.service';

interface Input {
  workflow_id: string;
}

export default createActionHandler<Input, { run_id: string }>(
  async (input, session) => {
    const userId = session['x-hasura-user-id'];
    return executeWorkflow(input.workflow_id, userId, 'manual');
  },
);
