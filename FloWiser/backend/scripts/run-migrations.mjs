import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { Client } from "pg";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to run migrations.");
}

const migrationsDirectory = path.join(process.cwd(), "db", "migrations");
const client = new Client({ connectionString: databaseUrl });

await client.connect();

await client.query(`
  CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename TEXT NOT NULL UNIQUE,
    applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  );
`);

const files = (await readdir(migrationsDirectory))
  .filter((fileName) => fileName.endsWith(".sql"))
  .sort();

for (const fileName of files) {
  const alreadyApplied = await client.query(
    "SELECT 1 FROM schema_migrations WHERE filename = $1 LIMIT 1",
    [fileName]
  );

  if (alreadyApplied.rowCount) {
    console.log(`Skipping already applied migration: ${fileName}`);
    continue;
  }

  const sql = await readFile(path.join(migrationsDirectory, fileName), "utf8");
  console.log(`Applying migration: ${fileName}`);
  await client.query("BEGIN");
  try {
    await client.query(sql);
    await client.query("INSERT INTO schema_migrations (filename) VALUES ($1)", [fileName]);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

await client.end();
console.log("Migrations completed.");
