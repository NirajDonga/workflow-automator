import Groq from 'groq-sdk';
import { IStepHandler, IStepContext, StepResult } from './types';

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

function interpolate(template: string, data: Record<string, unknown> | null): string {
  if (!data) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => String(data[key] ?? ''));
}

export class LlmCallHandler implements IStepHandler {
  async execute(ctx: IStepContext): Promise<StepResult> {
    const { model, system_prompt, user_prompt } = ctx.config as {
      model?: string;
      system_prompt?: string;
      user_prompt?: string;
    };

    const messages: Array<{ role: 'system' | 'user'; content: string }> = [];
    if (system_prompt) messages.push({ role: 'system', content: interpolate(system_prompt, ctx.previous_output) });
    messages.push({ role: 'user', content: interpolate(user_prompt ?? '', ctx.previous_output) });

    const completion = await groq.chat.completions.create({
      model: model ?? 'llama-3.1-8b-instant',
      messages,
    });

    const content = completion.choices[0]?.message?.content ?? '';
    return { status: 'success', output: { response: content } };
  }
}
