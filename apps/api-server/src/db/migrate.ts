import { migrate } from "drizzle-orm/neon-http/migrator";
import { db } from ".";

async function main() {
  try {
    await migrate(db, { migrationsFolder: "./src/db/migrations" });
    console.log("Migration ran successfully");
    process.exit(0);
  } catch (error) {
    console.error("Error running migrations:", error);
    process.exit(1);
  }
}

main();
