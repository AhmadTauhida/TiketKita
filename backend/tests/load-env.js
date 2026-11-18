import dotenv from 'dotenv';

dotenv.config({ path: '.env.test', override: true, quiet: true });

if (!process.env.DATABASE_URL?.includes('schema=test')) {
  throw new Error('DATABASE_URL tes wajib memakai schema=test');
}

if (!process.env.DIRECT_URL?.includes('schema=test')) {
  throw new Error('DIRECT_URL tes wajib memakai schema=test');
}
