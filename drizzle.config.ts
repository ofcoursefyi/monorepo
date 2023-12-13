import type { Config } from "drizzle-kit";
export default {
  out: "./drizzle",
  driver: "mysql2",
  schema: "./drizzle/schema.ts",
  dbCredentials: {
    uri: 'mysql://3lo1vh2evl3yocuwkic8:pscale_pw_jihvgSIsVMGLwr2Z2HR0m0sg27s9KRrdcmCAuiBNUzP@aws.connect.psdb.cloud/main?ssl={"rejectUnauthorized":true}',
  },
} satisfies Config;
