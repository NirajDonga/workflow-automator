import { IStepHandler, IStepContext, StepResult } from './types';

export class ConditionalBranchHandler implements IStepHandler {
  async execute(ctx: IStepContext): Promise<StepResult> {
    const { field, operator, value } = ctx.config as {
      field: string;
      operator: string;
      value: unknown;
    };

    const actual = ctx.previous_output?.[field];
    const passed = evaluate(actual, operator, value);

    return {
      status: passed ? 'success' : 'skipped',
      output: { branch: passed ? 'then' : 'else', field, actual, expected: value },
    };
  }
}

function evaluate(actual: unknown, operator: string, expected: unknown): boolean {
  switch (operator) {
    case 'eq':       return actual === expected;
    case 'neq':      return actual !== expected;
    case 'contains': return typeof actual === 'string' && actual.includes(String(expected));
    case 'gt':       return Number(actual) > Number(expected);
    case 'lt':       return Number(actual) < Number(expected);
    default:         return actual === expected;
  }
}
