import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { env } from './config/env.js';
import routes from './routes/index.js';

const app = express();

app.use(helmet());
app.use(cors({ origin: env.corsOrigin }));
app.use(morgan(env.nodeEnv === 'test' ? 'tiny' : 'dev'));
app.use(express.json());

app.use('/api/v1', routes);

app.get('/', (req, res) => {
  res.json({ name: 'TiketKita API', version: '1.0.0' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan',
    data: null,
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server',
    data: null,
  });
});

export default app;
