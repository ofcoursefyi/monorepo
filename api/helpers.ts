export type Empty = Record<string, never>;
export function is_empty<T>(obj: T | Empty): obj is Empty {
  return typeof obj === "object" && obj !== null && Object.keys(obj).length === 0;
}

export function is_array<T>(x: T | T[]): x is T[] {
  return Array.isArray(x);
}

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
