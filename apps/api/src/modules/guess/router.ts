import { Router } from 'express';
import type { Router as ExpressRouter } from 'express';
import type { GuessOption } from '@joy/shared';

import { demoGuesses } from '../../lib/demo-data';
import { ok } from '../../lib/http';

export const guessRouter: ExpressRouter = Router();

guessRouter.get('/', (_request, response) => {
  ok(response, { items: demoGuesses });
});

guessRouter.get('/:id', (request, response) => {
  const guess = demoGuesses.find((item) => item.id === request.params.id);

  if (!guess) {
    response.status(404).json({ success: false, message: 'Guess not found' });
    return;
  }

  ok(response, guess);
});

guessRouter.get('/:id/stats', (request, response) => {
  const guess = demoGuesses.find((item) => item.id === request.params.id);

  if (!guess) {
    response.status(404).json({ success: false, message: 'Guess not found' });
    return;
  }

  ok(response, {
    totalVotes: guess.options.reduce(
      (sum: number, option: GuessOption) => sum + option.voteCount,
      0,
    ),
    optionCount: guess.options.length,
  });
});
