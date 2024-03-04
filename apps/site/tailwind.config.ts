import type { Config } from "tailwindcss";
import { shadcn_preset } from "./src/ui/tw-config";

export default {
  presets: [shadcn_preset],
  content: ["./src/**/*.tsx"],
} satisfies Config;
