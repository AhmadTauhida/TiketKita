import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';

import { env } from './env.js';

function createAdapter(url) {
  const parsed = new URL(url);
  const schema = parsed.searchParams.get('schema') ?? undefined;
  parsed.searchParams.delete('schema');

  return new PrismaPg(parsed.toString(), schema ? { schema } : undefined);
}

export const prisma = new PrismaClient({ adapter: createAdapter(env.databaseUrl) });

export default prisma;
