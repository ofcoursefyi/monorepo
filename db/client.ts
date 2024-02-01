import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

export const db_client = postgres(process.env.DATABASE_URL!);
export const db = drizzle(db_client, { logger: false });
