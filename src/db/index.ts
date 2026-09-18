import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';

const connectionString = process.env.DATABASE_URL;

if (!connectionString && process.env.NODE_ENV === 'production') {
  console.warn("Attenzione: DATABASE_URL non configurata. Il bot non potrà connettersi al database.");
}

// Creiamo il client solo se abbiamo la stringa, altrimenti usiamo un placeholder per evitare crash in fase di build
const client = postgres(connectionString || 'postgres://localhost:5432/placeholder');
export const db = drizzle(client, { schema });
