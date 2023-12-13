import { courses, instructors, sec_instrs, sections } from "./schema";
import { createInsertSchema } from "drizzle-zod";
import { InferSelectModel } from "drizzle-orm";
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
  sequence: seqSchema.optional(),
  suffix: suffixSchema.optional(),
  title: z.string().max(250),
  desc: z.string().max(1000).optional(),
  units_low: z.number().min(0).max(99.9),
  units_high: z.number().min(0).max(99.9),
  units_max: z.number().min(0).max(99.9).optional(),
  restr_major: z.string().max(2000).optional(),
  restr_class: z.string().max(1000).optional(),
  restr_school: z.string().max(2000).optional(),
  prereq: z.string().max(1000).optional(),
  coreq: z.string().max(1000).optional(),
});
export type ICourse = z.infer<typeof iCourseSchema>;

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
  day: z.number().min(1).max(127).optional(),
  start_time: timeSchema.optional(),
  end_time: timeSchema.optional(),
  loc: z.string().max(50).optional(),
  title: z.string().max(250),
  sec_title: z.string().max(250).optional(),
  desc: z.string().max(2000).optional(),
  notes: z.string().max(2000).optional(),
  units_low: z.number().min(0).max(99.9),
  units_high: z.number().min(0).max(99.9),
});
export type ISection = z.infer<typeof iSectionSchema>;

export const iInstructorSchema = createInsertSchema(instructors, {
  email: z.string().email().max(100),
  name: z.string().max(100),
});
export type IInstructor = z.infer<typeof iInstructorSchema>;

export const iSecInstrSchema = createInsertSchema(sec_instrs, {
  term: termSchema,
  section: numeric(z.string().length(5)),
  instr_email: z.string().email().max(100),
});
export type ISecInstr = z.infer<typeof iSecInstrSchema>;

export type Course = InferSelectModel<typeof courses>;
export type Section = InferSelectModel<typeof sections>;
export type Instructor = InferSelectModel<typeof instructors>;
export type SecInstr = InferSelectModel<typeof sec_instrs>;
