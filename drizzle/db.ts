import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "./schema";
import postgres from "postgres";

const query_client = postgres(process.env.DRIZZLE_DATABASE_URL!);
export const db = drizzle(query_client, { schema, logger: true });
