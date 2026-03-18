import "dotenv/config";
import { db } from "../server/db";
import { sql } from "drizzle-orm";

async function main() {
  await db.execute(sql`ALTER TABLE workflows ADD COLUMN IF NOT EXISTS user_id text NOT NULL DEFAULT ''`);
  console.log("Added user_id column");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
