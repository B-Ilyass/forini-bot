import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

// Utilizziamo un URL di fallback per evitare crash durante il build se la variabile non è presente
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/app_db';

const client = postgres(connectionString, { prepare: false });
export const db = drizzle(client, { schema });
