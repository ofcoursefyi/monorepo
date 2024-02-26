import { zod as std } from "@ofc/retriever/parse";
import { z } from "zod";

const digits = (s: z.ZodString) =>
  s
    .regex(/^\d+$/, { message: "Must be a string of digits" })
    .transform(s => s as `${number}`);

const term = z
  .string()
  .length(4)
  .transform(s => [s.slice(0, 2), s.slice(2, 4)])
  .pipe(z.tuple([z.enum(["FA", "SP", "SU"]), digits(z.string())]))
  .transform(([s, n]) => `${s}${n}` as const);

const department = {
  code: std.department.code,
  name: std.department.name,
};

const course = {
  term: term,
  dept: department.code,
  course: z
    .string()
    .min(6)
    .max(9)
    .transform(s => s.split("-"))
    .pipe(
      z.tuple([
        department.code,
        z
          .string()
          .transform(s => [s.slice(0, 3), s.slice(3)])
          .pipe(
            z.tuple([
              std.course.number,
              z.string().length(0).or(std.course.sequence),
            ])
          ),
      ])
    )
    .transform(([dept, [num, seq]]) => `${dept}-${num}${seq}` as const),
  prefix: department.code,
  number: std.course.number,
  sequence: std.course.sequence.nullable(),
  suffix: std.course.suffix.nullable(),
  title: z.string(),
  desc: z.string().nullable(),
  units_low: std.util.unit.nullable(),
  units_high: std.util.unit.nullable(),
  units_max: std.util.unit.nullable(),
  restr_class: z.string().nullable(),
  restr_major: z.string().nullable(),
  restr_school: z.string().nullable(),
  coreq: z.string().nullable(),
  prereq: z.string().nullable(),
};

const instructor = {
  id: z.string().length(21),
  name: z.string(),
  email: z.string().email().nullable(),
};

const section = {
  term: term,
  course: course.course,
  section: digits(z.string().length(5)),
  session: digits(z.string().length(3)),
  dcode: z.enum(["r", "d"]),
  type: z.enum(["lec_dis", "lec_lab", "quiz", "lab", "dis", "lec"]),
  cancelled: z.boolean(),
  tot_seats: z.number().min(0),
  taken_seats: z.number().min(0),
  title: z.string(),
  sec_title: z.string().nullable(),
  desc: z.string().nullable(),
  notes: z.string().nullable(),
  units_low: std.util.unit.nullable(),
  units_high: std.util.unit.nullable(),
};

const s_detail = {
  id: z.number().min(0),
  term: term,
  section: section.section,
  day: z.number().min(1).max(127).nullable(),
  start_time: std.util.time.nullable(),
  end_time: std.util.time.nullable(),
  loc: z.string().max(50).nullable(),
};

const s_instr = {
  term: section.term,
  sec: section.section,
  instr_id: instructor.id,
  instr_name: instructor.name,
};

export const validate = {
  term: term,
  dept: z.object(department),
  course: z.object(course),
  instr: z.object(instructor),
  section: z.object(section),
  s_detail: z.object(s_detail),
  s_instr: z.object(s_instr),
};

export const zod = {
  department,
  course,
  instructor,
  section,
  s_detail,
  s_instr,
};
