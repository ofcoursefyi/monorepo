import { courses, instructors, sec_instrs, sections } from "./schema";
import { createInsertSchema } from "drizzle-zod";
import { InferInsertModel, InferSelectModel } from "drizzle-orm";
import { z } from "zod";

const numeric = (s: z.ZodString) =>
  s.regex(/^\d+$/, { message: "Must be a string of digits" }).transform<`${number}`>(s => s as `${number}`);

const alphabetic = (s: z.ZodString) => s.regex(/^[A-Za-z]+$/, { message: "Must be a string of letters" });

const termSchema = z
  .string()
  .length(4)
  .transform(s => [s.slice(0, 2), s.slice(2, 4)])
  .pipe(z.tuple([z.enum(["FA", "SP", "SU"]), numeric(z.string())]))
  .transform<`${"FA" | "SP" | "SU"}${number}`>(([s, n]) => `${s}${n}`);

const deptSchema = alphabetic(z.string().min(2).max(4));
const courseNumSchema = numeric(z.string().length(3));
const seqSchema = alphabetic(z.string().length(1));
const suffixSchema = z
  .string()
  .max(6)
  .regex(/^[gmwxLp]+$/);

const courseIdSchema = z
  .string()
  .min(6)
  .max(9)
  .transform(s => [s.split("-")[0], s.split("-")[1]])
  .pipe(
    z.tuple([
      deptSchema,
      z
        .string()
        .transform(s => [s.slice(0, 3), s.slice(3)])
        .pipe(z.tuple([courseNumSchema, z.string().length(0).or(seqSchema)])),
    ])
  )
  .transform<`${string}-${number}${string | ""}`>(([dept, [num, seq]]) => `${dept}-${num}${seq}`);

export const iCourseSchema = createInsertSchema(courses, {
  term: termSchema,
  dept: deptSchema,
  course: courseIdSchema,
  prefix: deptSchema,
  number: courseNumSchema,
  sequence: seqSchema.nullable(),
  suffix: suffixSchema.nullable(),
  title: z.string().max(250),
  desc: z.string().max(1000).nullable(),
  restr_major: z.string().max(2000).nullable(),
  restr_class: z.string().max(1000).nullable(),
  restr_school: z.string().max(2000).nullable(),
  prereq: z.string().max(1000).nullable(),
  coreq: z.string().max(1000).nullable(),
});

const timeSchema = z
  .string()
  .transform(s => [s.split(":")[0], s.split(":")[1]])
  .pipe(
    z.tuple([
      numeric(z.string().max(2)).pipe(z.coerce.number().min(0).max(23)),
      numeric(z.string().max(2)).pipe(z.coerce.number().min(0).max(59)),
    ])
  )
  .transform<string>(([h, m]) => `${h}:${m}`);

export const iSectionSchema = createInsertSchema(sections, {
  term: termSchema,
  course: courseIdSchema,
  section: numeric(z.string().length(5)),
  session: numeric(z.string().length(3)),
  day: z.number().min(1).max(127).nullable(),
  start_time: timeSchema.nullable(),
  end_time: timeSchema.nullable(),
  loc: z.string().max(50).nullable(),
  alt_day: z.number().min(1).max(127).nullable(),
  alt_start_time: timeSchema.nullable(),
  alt_end_time: timeSchema.nullable(),
  alt_loc: z.string().max(50).nullable(),
  title: z.string().max(250),
  sec_title: z.string().max(250).nullable(),
  desc: z.string().max(2000).nullable(),
  notes: z.string().max(2000).nullable(),
});

export const iInstructorSchema = createInsertSchema(instructors, {
  email: z.string().email().max(100),
  name: z.string().max(100),
});

export const iSecInstrSchema = createInsertSchema(sec_instrs, {
  term: termSchema,
  sec: numeric(z.string().length(5)),
  instr: z.string().cuid2(),
});

export type ICourse = InferInsertModel<typeof courses>;
export type ISection = InferInsertModel<typeof sections>;
export type IInstructor = InferInsertModel<typeof instructors>;
export type ISecInstr = InferInsertModel<typeof sec_instrs>;

export type Course = InferSelectModel<typeof courses>;
export type Section = InferSelectModel<typeof sections>;
export type Instructor = InferSelectModel<typeof instructors>;
export type SecInstr = InferSelectModel<typeof sec_instrs>;
