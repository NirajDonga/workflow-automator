import { Request, Response } from 'express';
import { AppError } from './errors';
import { HasuraActionPayload, HasuraSessionVars } from './types';

export function createActionHandler<TInput, TOutput>(
  handler: (input: TInput, session: HasuraSessionVars) => Promise<TOutput>,
) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      const payload = req.body as HasuraActionPayload<TInput>;
      const result = await handler(payload.input, payload.session_variables);
      res.json(result);
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message, code: err.code });
        return;
      }
      console.error('Unhandled error:', err);
      res.status(500).json({ message: 'Internal server error', code: 'INTERNAL' });
    }
  };
}

export function createEventHandler<T>(
  handler: (payload: T) => Promise<void>,
) {
  return async (req: Request, res: Response): Promise<void> => {
    try {
      await handler(req.body as T);
      res.json({ ok: true });
    } catch (err) {
      if (err instanceof AppError) {
        res.status(err.statusCode).json({ message: err.message, code: err.code });
        return;
      }
      console.error('Unhandled event error:', err);
      res.status(500).json({ message: 'Internal server error', code: 'INTERNAL' });
    }
  };
}
