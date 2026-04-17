import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';

import type { LoginPayload, LoginResult } from '@joy/shared';

import { demoAdmin, demoUser } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const authRouter: ExpressRouter = Router();

authRouter.post('/login', (request, response) => {
  const body = request.body as Partial<LoginPayload>;
  const isAdmin = body.phone === demoAdmin.phone;
  const user = isAdmin ? demoAdmin : demoUser;

  const result: LoginResult = {
    token: `demo-token-${user.role}`,
    user,
  };

  ok(response, result);
});

authRouter.get('/me', (_request, response) => {
  ok(response, demoAdmin);
});
