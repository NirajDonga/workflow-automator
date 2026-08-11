import { IStepHandler, IStepContext, StepResult } from './types';

export class ApprovalGateHandler implements IStepHandler {
  async execute(_ctx: IStepContext): Promise<StepResult> {
    return { status: 'paused' };
  }
}
