import { toLowerCase, replace } from "string-ts";
import { z } from "zod";

const digits = (s: z.ZodString) =>
  s
    .regex(/^\d+$/, { message: "Must be a string of digits" })
    .transform(s => s as `${number}`);

const alphabetic = (s: z.ZodString) =>
  s.regex(/^[A-Za-z]+$/, { message: "Must be a string of letters" });

function day_to_num(days: string) {
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

const fetch_term = {
  term: z.array(
    z
      .string()
      .length(5)
      .transform(t => [t.slice(0, 4), t.at(-1)])
      .pipe(z.tuple([digits(z.string()), z.enum(["1", "2", "3"])]))
      .transform(([y, s]) => `${y}${s}` as const)
  ),
};

const department = {
  code: alphabetic(z.string().min(2).max(4)),
  name: z.string().min(2),
};

const child_department = z.object({
  code: department.code,
  name: department.name,
  type: z.enum(["N", "C"]),
});

const parent_department = z.object({
  code: department.code,
  name: department.name,
  type: z.literal("Y"),
  department: z
    .array(child_department)
    .or(child_department.transform(d => [d] as [typeof d]))
    .transform(ds => ds.filter(d => d.type !== "C")),
});

const fetch_departments = {
  department: z
    .array(parent_department.transform(p => p.department).or(child_department))
    .transform(ds => ds.flat()),
};

const empty_object = z
  .object({})
  .strict()
  .nullish()
  .transform(() => null);

const instructor = z.object({
  first_name: z.string(),
  last_name: z.string(),
});

const unit = z
  .string()
  .transform(u => u.split("."))
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
      .or(z.tuple([digits(z.string().min(1).max(2))]))
  )
  .transform(([n, d]) => `${n}.${(d as "0" | "5") || 0}` as const);

const time = z
  .string()
  .transform(s => s.split(":"))
  .pipe(
    z.tuple([
      digits(z.string().max(2)).pipe(z.coerce.number().min(0).max(23)),
      digits(z.string().max(2)).pipe(z.coerce.number().min(0).max(59)),
    ])
  )
  .transform(([h, m]) => `${h}:${m}` as const);

const time_opts = time
  .or(z.literal("TBA").transform(() => null))
  .or(empty_object);
const times = z
  .array(time_opts)
  .or(time_opts.transform(t => [t] as [typeof t]));
const units = z
  .string()
  .transform(u => u.split("-"))
  .pipe(z.tuple([unit]).or(z.tuple([unit, unit])))
  .transform(([min, max]) => ({ min, max }));
const number = digits(z.string().length(3));
const sequence = alphabetic(z.string().length(1));
const day = alphabetic(z.string().min(1).max(7))
  .transform(d => day_to_num(d))
  .or(empty_object);
const suffix = z
  .string()
  .max(6)
  .regex(/^[gmwxLp]+$/);

const api_section = {
  id: digits(z.string().length(5)),
  session: digits(z.string().length(3)),
  dclass_code: z.enum(["R", "D"]).transform(c => toLowerCase(c)),
  title: z.string(),
  section_title: z.string().or(empty_object),
  description: z.string().or(empty_object),
  notes: z.string().or(empty_object),
  type: z
    .enum(["Lec", "Dis", "Lab", "Lec-Dis", "Qz", "Lec-Lab"])
    .transform(c => (c === "Qz" ? "quiz" : toLowerCase(replace(c, "-", "_")))),
  units: units.or(empty_object),
  spaces_available: digits(z.string()),
  number_registered: digits(z.string()),
  wait_qty: digits(z.string()),
  canceled: z.enum(["Y", "N"]).transform(c => c === "Y"),
  day: z.array(day).or(day.transform(d => [d] as [typeof d])),
  start_time: times,
  end_time: times,
  location: z.array(z.string().or(empty_object)).or(
    z
      .string()
      .or(empty_object)
      .transform(l => [l] as [typeof l])
  ),
  instructor: z
    .array(instructor)
    .or(instructor.transform(i => [i] as [typeof i]))
    .nullish(),
};

const course_data = {
  prefix: department.code,
  number: number,
  sequence: sequence.or(empty_object),
  suffix: suffix.or(empty_object),
  title: z.string(),
  description: z.string().or(empty_object),
  units: z
    .string()
    .transform(u => u.split(", "))
    .pipe(
      z
        .tuple([units])
        .or(
          z.tuple([units, unit.transform(n => (n === "0.0" ? undefined : n))])
        )
    )
    .transform(([{ min, max }, total]) => ({
      min: parseFloat(min),
      max: max ? parseFloat(max) : undefined,
      total: total ? parseFloat(total) : undefined,
    }))
    .transform(({ min, max, total }) => ({
      min: Math.min(min, max ?? min).toString(),
      max: max ? Math.max(min, max).toString() : undefined,
      total: total ? Math.max(min, max ?? total, total).toString() : undefined,
    })),
  restriction_by_major: z.string().or(empty_object),
  restriction_by_class: z.string().or(empty_object),
  restriction_by_school: z.string().or(empty_object),
  CourseNotes: z.string().or(empty_object),
  CourseTermNotes: empty_object,
  prereq_text: z.string().or(empty_object),
  coreq_text: z.string().or(empty_object),
  SectionData: z
    .array(z.object(api_section))
    .or(z.object(api_section).transform(s => [s] as [typeof s])),
};

const course_member = z
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
        .pipe(z.tuple([number, z.string().length(0).or(sequence)])),
    ])
  )
  .transform(([dept, [num, seq]]) => `${dept}-${num}${seq}` as const);

const course_api = z.object({
  IsCrossListed: z.enum(["Y", "N"]),
  PublishedCourseID: course_member,
  ScheduledCourseID: course_member,
  CourseData: z.object(course_data),
});

const fetch_courses = {
  schd_sync_dtm: z.string(),
  Dept_Info: z.object({
    department: z.string(),
    abbreviation: department.code,
  }),
  OfferedCourses: z.object({
    course: z
      .array(course_api)
      .or(course_api.transform(c => [c] as [typeof c]))
      .transform(cs => cs.filter(c => c.IsCrossListed === "N")) // filter out cross-listed courses
      .nullish(),
  }),
};

export const validate = {
  terms: z.object(fetch_term).transform(o => o.term),
  departments: z.object(fetch_departments).transform(o => o.department),
  courses: z.object(fetch_courses),
};

export const zod = {
  department,
  course: {
    number,
    sequence,
    suffix,
  },
  section: {
    units,
  },
  util: {
    unit,
    time,
  },
};
