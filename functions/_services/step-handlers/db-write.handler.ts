import { IStepHandler, IStepContext, StepResult } from './types';
import { adminQuery } from '../../_utils/graphql-client';

export class DbWriteHandler implements IStepHandler {
  async execute(ctx: IStepContext): Promise<StepResult> {
    const { mutation, variables } = ctx.config as {
      mutation: string;
      variables?: Record<string, unknown>;
    };

    // Merge previous output into variables so mutations can reference prior step data
    const merged = { ...ctx.previous_output, ...variables };
    const data = await adminQuery(mutation, merged);
    return { status: 'success', output: data as Record<string, unknown> };
  }
}
