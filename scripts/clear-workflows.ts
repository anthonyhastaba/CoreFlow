import "dotenv/config";
import { db } from "../server/db";
import { workflows } from "../shared/schema";

async function main() {
  await db.delete(workflows);
  console.log("Deleted all workflows");
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
