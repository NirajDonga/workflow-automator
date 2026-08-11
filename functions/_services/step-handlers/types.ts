export interface IStepContext {
  run_id: string;
  step_run_id: string;
  previous_output: Record<string, unknown> | null;
  config: Record<string, unknown>;
}

export interface StepResult {
  status: 'success' | 'failed' | 'paused' | 'skipped';
  output?: Record<string, unknown>;
  error?: string;
}

export interface IStepHandler {
  execute(ctx: IStepContext): Promise<StepResult>;
}
