import type { z } from "zod";

export const digits = (s: z.ZodString) =>
  s
    .regex(/^\d+$/, { message: "Must be a string of digits" })
    .transform((s) => s as `${number}`);

export const alphabetic = (s: z.ZodString) =>
  s.regex(/^[A-Za-z]+$/, { message: "Must be a string of letters" });

export function day_to_num(days: string) {
  let tot = 0;

  for (const dow of days) {
    switch (dow) {
      case "M":
        tot += 1;
        break;
      case "T":
        tot += 2;
        break;
      case "W":
        tot += 4;
        break;
      case "H":
        tot += 8;
        break;
      case "F":
        tot += 16;
        break;
      case "S":
        tot += 32;
        break;
      case "U":
        tot += 64;
        break;
      default:
        throw new Error(`Invalid day of week: ${dow}`);
    }
  }

  return tot;
}
