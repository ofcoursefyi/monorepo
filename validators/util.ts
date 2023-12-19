import type { Assume, Column, Equal, Simplify, Table } from "drizzle-orm";
import type { z } from "zod";

export type Zodify<TTable extends Table> = Simplify<{
  [K in keyof TTable["_"]["columns"]]: MapColumnToZod<
    TTable["_"]["columns"][K],
    GetZodType<TTable["_"]["columns"][K]>
  >;
}>;

type MapColumnToZod<
  TColumn extends Column,
  TType extends z.ZodTypeAny,
> = TColumn["_"]["notNull"] extends false ? z.ZodNullable<TType> : TType;

type GetZodType<TColumn extends Column> =
  TColumn["_"]["dataType"] extends infer TDataType ?
    TDataType extends "custom" ? z.ZodAny
    : TColumn extends { enumValues: [string, ...string[]] } ?
      Equal<TColumn["enumValues"], [string, ...string[]]> extends true ?
        z.ZodString | z.ZodEffects<z.ZodTypeAny, string, string>
      : z.ZodEnum<TColumn["enumValues"]>
    : TDataType extends "array" ?
      z.ZodArray<
        GetZodType<Assume<TColumn["_"], { baseColumn: Column }>["baseColumn"]>
      >
    : TDataType extends "bigint" ? z.ZodBigInt
    : TDataType extends "number" ? z.ZodNumber
    : TDataType extends "string" ?
      z.ZodString | z.ZodEffects<z.ZodTypeAny, string, string> // instead of string out, infer
    : TDataType extends "boolean" ? z.ZodBoolean
    : TDataType extends "date" ? z.ZodDate
    : z.ZodAny
  : never;

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
