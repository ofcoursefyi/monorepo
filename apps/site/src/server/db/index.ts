import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

import { env } from "@ofc/env";
import * as usc_schema from "@ofc/schema/usc";

export const db = drizzle(postgres(env.DATABASE_URL), {
  schema: {
    ...usc_schema,
  },
});
