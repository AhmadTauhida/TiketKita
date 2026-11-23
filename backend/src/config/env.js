import dotenv from 'dotenv';

dotenv.config({ quiet: true });

function required(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Environment variable ${name} wajib diisi`);
  }
  return value;
}

function firstRequired(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }

  throw new Error(`Environment variable ${names.join(' atau ')} wajib diisi`);
}

const configuredStorageDriver = (
  process.env.STORAGE_DRIVER ?? 'memory'
).toLowerCase();
const storageDriver =
  process.env.NODE_ENV === 'test' ? 'memory' : configuredStorageDriver;

if (!['memory', 'supabase'].includes(storageDriver)) {
  throw new Error('STORAGE_DRIVER harus bernilai memory atau supabase');
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  nodeEnv: process.env.NODE_ENV ?? 'development',
  corsOrigin: process.env.CORS_ORIGIN ?? '*',
  databaseUrl: required('DATABASE_URL'),
  jwtSecret: required('JWT_SECRET'),
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? '1d',
  bcryptRounds: Number(process.env.BCRYPT_ROUNDS ?? 10),
  bookingExpiryMinutes: Number(process.env.BOOKING_EXPIRY_MINUTES ?? 15),
  storageDriver,
  supabaseUrl: storageDriver === 'supabase' ? required('SUPABASE_URL') : null,
  supabaseSecretKey:
    storageDriver === 'supabase'
      ? firstRequired(['SUPABASE_SECRET_KEY', 'SUPABASE_SERVICE_ROLE_KEY'])
      : null,
  supabaseMediaBucket: process.env.SUPABASE_MEDIA_BUCKET ?? 'media',
};

export default env;
