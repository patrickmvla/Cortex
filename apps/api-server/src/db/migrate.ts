import 'dotenv/config';
import postgres from 'postgres';
import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error("Error: DATABASE_URL environment variable is not set.");
    process.exit(1);
  }

  const db = postgres(dbUrl, { max: 1 });
  const migrationsDir = join(import.meta.dir, 'migrations');

  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter((file) => file.endsWith('.sql'))
      .sort();

    console.log("Found migration files:", sqlFiles);

    for (const file of sqlFiles) {
      console.log(`Applying migration: ${file}`);
      const filePath = join(migrationsDir, file);
      const sqlContent = await readFile(filePath, 'utf-8');
      
      // Drizzle's generated SQL can have multiple statements.
      // We need to execute them in a transaction.
      await db.begin(async (sql) => {
        await sql.unsafe(sqlContent);
      });
      console.log(`Successfully applied ${file}`);
    }

    console.log('All migrations ran successfully!');
    await db.end();
    process.exit(0);
  } catch (error) {
    console.error('Error running migrations:', error);
    await db.end();
    process.exit(1);
  }
}

main();
