import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { env } from "@ofc/env";

export const db_client = postgres(env.DATABASE_URL);
export const db = drizzle(db_client, { logger: false });
