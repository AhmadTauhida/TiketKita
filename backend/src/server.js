import app from './app.js';
import { env } from './config/env.js';

if (!process.env.VERCEL) {
  app.listen(env.port, '0.0.0.0', () => {
    console.log(`TiketKita API listening on http://0.0.0.0:${env.port}`);
  });
}

export default app;
