import { alphabetic, digits } from "./util";
import { z } from "zod";

const department = {
  code: alphabetic(z.string().min(2).max(4)),
  name: z.string().min(2),
};

const util = {
  convert_term: digits(z.string().length(5))
    .transform((s) => [s.slice(2, 4), s.slice(4, 5)])
    .pipe(z.tuple([digits(z.string()), z.coerce.number().min(1).max(3)]))
    .transform(([y, t]) =>
      t === 1 ? (`SP${y}` as const)
      : t === 2 ? (`SU${y}` as const)
      : (`FA${y}` as const),
    ),
  number: digits(z.string().length(3)),
  sequence: alphabetic(z.string().length(1)),
  units: z
    .string()
    .transform((u) => u.split("."))
    .pipe(
      z
        .tuple([
          digits(z.string().min(1).max(2)),
          z
            .string()
            .length(1)
            .endsWith("0")
            .or(z.string().length(1).endsWith("5"))
            .or(z.string().length(0)),
        ])
        .or(z.tuple([digits(z.string().min(1).max(2))])),
    )
    .transform(([n, d]) => `${n}.${(d as "0" | "5") || 0}` as const),

  time: z
    .string()
    .transform((s) => s.split(":"))
    .pipe(
      z.tuple([
        digits(z.string().max(2)).pipe(z.coerce.number().min(0).max(23)),
        digits(z.string().max(2)).pipe(z.coerce.number().min(0).max(59)),
      ]),
    )
    .transform(([h, m]) => `${h}:${m}` as const),
};

const course = {
  term: z
    .string()
    .length(4)
    .transform((s) => [s.slice(0, 2), s.slice(2, 4)])
    .pipe(z.tuple([z.enum(["FA", "SP", "SU"]), digits(z.string())]))
    .transform(([s, n]) => `${s}${n}` as const),
  dept: department.code,
  course: z
    .string()
    .min(6)
    .max(9)
    .transform((s) => s.split("-"))
    .pipe(
      z.tuple([
        department.code,
        z
          .string()
          .transform((s) => [s.slice(0, 3), s.slice(3)])
          .pipe(z.tuple([util.number, z.string().length(0).or(util.sequence)])),
      ]),
    )
    .transform(([dept, [num, seq]]) => `${dept}-${num}${seq}` as const),
  prefix: department.code,
  number: util.number,
  sequence: util.sequence.nullable(),
  suffix: z
    .string()
    .max(6)
    .regex(/^[gmwxLp]+$/)
    .nullable(),
  title: z.string(),
  desc: z.string().nullable(),
  units_low: util.units.nullable(),
  units_high: util.units.nullable(),
  units_max: util.units.nullable(),
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
  term: course.term,
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
  units_low: util.units.nullable(),
  units_high: util.units.nullable(),
};

const s_detail = {
  id: z.number().min(0),
  term: section.term,
  section: section.section,
  day: z.number().min(1).max(127).nullable(),
  start_time: util.time.nullable(),
  end_time: util.time.nullable(),
  loc: z.string().max(50).nullable(),
};

const s_instr = {
  term: section.term,
  sec: section.section,
  instr_id: instructor.id,
  instr_name: instructor.name,
};

export const verify = {
  dept: z.object(department),
  course: z.object(course),
  instr: z.object(instructor),
  section: z.object(section),
  s_detail: z.object(s_detail),
  s_instr: z.object(s_instr),
};

export const db = {
  department,
  course,
  instructor,
  section,
  s_detail,
  s_instr,
  util,
};
