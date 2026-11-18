import { execSync } from 'node:child_process';
import dotenv from 'dotenv';

export default function globalSetup() {
  dotenv.config({ path: '.env.test', override: true, quiet: true });

  if (!process.env.DATABASE_URL?.includes('schema=test')) {
    throw new Error('DATABASE_URL tes wajib memakai schema=test');
  }

  if (!process.env.DIRECT_URL?.includes('schema=test')) {
    throw new Error('DIRECT_URL tes wajib memakai schema=test');
  }

  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    env: {
      ...process.env,
      PRISMA_ENV_FILE: '.env.test',
    },
  });
}
