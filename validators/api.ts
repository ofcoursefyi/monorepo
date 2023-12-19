import { alphabetic, digits, day_to_num } from "./util";
import { db } from "./db";
import { z } from "zod";

const fetch_term = {
  term: z.array(
    z
      .string()
      .length(5)
      .transform((t) => [t.at(-1), t.slice(2, 4)])
      .pipe(z.tuple([z.enum(["1", "2", "3"]), digits(z.string())]))
      .transform(([s, y]) =>
        s === "1" ? (`SP${y}` as const)
        : s === "2" ? (`SU${y}` as const)
        : (`FA${y}` as const),
      ),
  ),
};

const child_department = z.object({
  code: db.department.code,
  name: db.department.name,
  type: z.enum(["N", "C"]),
});

const parent_department = z.object({
  code: db.department.code,
  name: db.department.name,
  type: z.literal("Y"),
  department: z
    .array(child_department)
    .or(child_department.transform((d) => [d] as [typeof d]))
    .transform((ds) => ds.filter((d) => d.type !== "C")),
});

const fetch_departments = {
  department: z
    .array(
      parent_department.transform((p) => p.department).or(child_department),
    )
    .transform((ds) => ds.flat()),
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

const day = alphabetic(z.string().min(1).max(7))
  .transform((d) => day_to_num(d))
  .or(empty_object);

const time_opts = db.util.time
  .or(z.literal("TBA").transform(() => null))
  .or(empty_object);
const time = z
  .array(time_opts)
  .or(time_opts.transform((t) => [t] as [typeof t]));

const units = z
  .string()
  .transform((u) => u.split("-"))
  .pipe(z.tuple([db.util.units]).or(z.tuple([db.util.units, db.util.units])))
  .transform(([min, max]) => ({ min, max }));

const section = {
  id: db.section.section,
  session: db.section.session,
  dclass_code: z
    .enum(["R", "D"])
    .transform((c) => c.toLowerCase() as Lowercase<typeof c>),
  title: db.section.title,
  section_title: db.section.sec_title.or(empty_object),
  description: db.section.desc.or(empty_object),
  notes: db.section.notes.or(empty_object),
  type: z
    .enum(["Lec", "Dis", "Lab", "Lec-Dis", "Qz", "Lec-Lab"])
    .transform((c) =>
      c === "Qz" ? "quiz" : (c.toLowerCase() as Lowercase<typeof c>),
    ),
  units: units.or(empty_object),
  spaces_available: digits(z.string()),
  number_registered: digits(z.string()),
  wait_qty: digits(z.string()),
  canceled: z.enum(["Y", "N"]).transform((c) => c === "Y"),
  day: z.array(day).or(day.transform((d) => [d] as [typeof d])),
  start_time: time,
  end_time: time,
  location: z.array(z.string().or(empty_object)).or(
    z
      .string()
      .or(empty_object)
      .transform((l) => [l] as [typeof l]),
  ),
  instructor: z
    .array(instructor)
    .or(instructor.transform((i) => [i] as [typeof i]))
    .nullish(),
};

const course_data = z.object({
  prefix: db.course.prefix,
  number: db.course.number,
  sequence: db.course.sequence.or(empty_object),
  suffix: db.course.suffix.or(empty_object),
  title: db.course.title,
  description: db.course.desc.or(empty_object),
  units: z
    .string()
    .transform((u) => u.split(", "))
    .pipe(z.tuple([units]).or(z.tuple([units, db.util.units])))
    .transform(([{ min, max }, total]) => ({ min, max, total })),
  restriction_by_major: db.course.restr_major.or(empty_object),
  restriction_by_class: db.course.restr_class.or(empty_object),
  restriction_by_school: db.course.restr_school.or(empty_object),
  CourseNotes: z.string().or(empty_object),
  CourseTermNotes: empty_object,
  prereq_text: db.course.prereq.or(empty_object),
  coreq_text: db.course.coreq.or(empty_object),
  SectionData: z
    .array(z.object(section))
    .or(z.object(section).transform((s) => [s] as [typeof s])),
});

const course = z.object({
  IsCrossListed: z.enum(["Y", "N"]),
  PublishedCourseID: db.course.course,
  ScheduledCourseID: db.course.course,
  CourseData: course_data,
});

const fetch_courses = {
  schd_sync_dtm: z.string(),
  Dept_Info: z.object({
    department: z.string(),
    abbreviation: db.department.code,
  }),
  OfferedCourses: z.object({
    course: z
      .array(course)
      .or(course.transform((c) => [c] as [typeof c]))
      .transform((cs) => cs.filter((c) => c.IsCrossListed === "N"))
      .nullish(),
  }),
};

export const verify = {
  terms: z.object(fetch_term).transform((o) => o.term),
  departments: z.object(fetch_departments).transform((o) => o.department),
  courses: z.object(fetch_courses),
};

export const api = {
  fetch_term,
  fetch_departments,
  fetch_courses,
};
