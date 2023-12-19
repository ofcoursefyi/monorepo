import type { Config } from "drizzle-kit";

export default {
  out: "./db/drizzle",
  schema: "./db/drizzle/schema.ts",
  driver: "pg",
  dbCredentials: {
    connectionString:
      "postgresql://brendonzimmer:1lfdsjgenp7N@ep-odd-mode-78833880-pooler.us-west-2.aws.neon.tech/main?sslmode=require",
  },
  introspect: {
    casing: "preserve",
  },
} satisfies Config;
