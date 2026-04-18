import { createApp } from './app';
import { env } from './env';
import { appLogger, registerProcessLoggers } from './lib/logger';

const app = createApp();

registerProcessLoggers();

app.listen(env.port, () => {
  appLogger.info({ port: env.port }, `api listening on http://localhost:${env.port}`);
});
