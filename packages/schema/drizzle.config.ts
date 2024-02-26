import { defineConfig } from "drizzle-kit";
import { env } from "@ofc/env";

export default defineConfig({
  schema: ["./src/usc-schema.ts", "./src/platform-schema.ts"],
  out: "./generated",
  introspect: {
    casing: "camel",
  },
  driver: "pg",
  dbCredentials: { connectionString: env.DATABASE_URL },
});
