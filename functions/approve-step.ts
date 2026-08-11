import { createActionHandler } from './_utils/handler';
import { approveAndResume } from './_services/approval.service';

interface Input {
  step_run_id: string;
}

export default createActionHandler<Input, { run_id: string }>(
  async (input, session) => {
    const userId = session['x-hasura-user-id'];
    return approveAndResume(input.step_run_id, userId);
  },
);
