import { fileURLToPath } from "node:url";
import createJiti from "jiti";

/**
 * Run `build` or `dev` with `SKIP_ENV_VALIDATION` to skip env validation. This is especially useful
 * for Docker builds.
 */
createJiti(fileURLToPath(import.meta.url))("@ofc/env");

/** @type {import("next").NextConfig} */
const config = {};

export default config;
