import { createEventHandler } from './_utils/handler';
import { HasuraEventPayload, StepRun } from './_utils/types';
import { getStepRun } from './_repositories/run.repository';

export default createEventHandler<HasuraEventPayload<StepRun>>(
  async (payload) => {
    const newData = payload.event.data.new;
    if (!newData || newData.status !== 'success') return;

    const stepRun = await getStepRun(newData.id);
    if (!stepRun.output) return;

    const { channel, recipient, message } = stepRun.output as {
      channel?: string;
      recipient?: string;
      message?: string;
    };

    if (channel === 'console') {
      console.log(`[NOTIFY] to=${recipient} message=${message}`);
    }
  },
);
