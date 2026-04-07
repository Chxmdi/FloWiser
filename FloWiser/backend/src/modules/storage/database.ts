import { Pool } from "pg";

let pool: Pool | undefined;

export const isPersistenceEnabled = () => Boolean(process.env.DATABASE_URL);

export const getDatabasePool = () => {
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is required for persistent storage features.");
  }

  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL
    });
  }

  return pool;
};
