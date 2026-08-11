import { IStepHandler, IStepContext, StepResult } from './types';

function interpolate(str: string, data: Record<string, unknown> | null): string {
  if (!data) return str;
  return str.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}

export class HttpRequestHandler implements IStepHandler {
  async execute(ctx: IStepContext): Promise<StepResult> {
    const { url, method, headers, body } = ctx.config as {
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
    };

    const res = await fetch(interpolate(url, ctx.previous_output), {
      method: method ?? 'GET',
      headers: { 'Content-Type': 'application/json', ...headers },
      body: body ? interpolate(body, ctx.previous_output) : undefined,
    });

    const responseBody = await res.text();
    let parsed: unknown;
    try { parsed = JSON.parse(responseBody); } catch { parsed = responseBody; }

    if (!res.ok) {
      return { status: 'failed', error: `HTTP ${res.status}: ${responseBody}` };
    }
    return { status: 'success', output: { status_code: res.status, body: parsed } };
  }
}
