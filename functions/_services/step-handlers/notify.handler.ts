import { IStepHandler, IStepContext, StepResult } from './types';

export class NotifyHandler implements IStepHandler {
  async execute(ctx: IStepContext): Promise<StepResult> {
    const { channel, recipient, message } = ctx.config as {
      channel?: string;
      recipient?: string;
      message?: string;
    };

    return {
      status: 'success',
      output: { channel: channel ?? 'console', recipient: recipient ?? '', message: message ?? '' },
    };
  }
}
