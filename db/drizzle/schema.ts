import {
  pgTable,
  uniqueIndex,
  index,
  pgEnum,
  varchar,
  text,
  foreignKey,
  primaryKey,
  smallint,
  time,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

export const DCODE = pgEnum("DCODE", ["r", "d"]);
export const STYPE = pgEnum("STYPE", [
  "lec_dis",
  "lec_lab",
  "quiz",
  "lab",
  "dis",
  "lec",
]);

export const Instructors = pgTable(
  "Instructors",
  {
    id: varchar("id", { length: 15 }).primaryKey().notNull(),
    name: text("name").notNull(),
    email: text("email"),
  },
  (table) => {
    return {
      email_key: uniqueIndex("Instructors_email_key").on(table.email),
      name_idx: index("Instructors_name_idx").on(table.name),
    };
  },
);

export const Departments = pgTable(
  "Departments",
  {
    code: varchar("code", { length: 4 }).primaryKey().notNull(),
    name: text("name").notNull(),
  },
  (table) => {
    return {
      code_idx: index("Departments_code_idx").on(table.code),
    };
  },
);

export const SInstructors = pgTable(
  "SInstructors",
  {
    term: varchar("term", { length: 4 }).notNull(),
    sec: varchar("sec", { length: 5 }).notNull(),
    instr_id: varchar("instr_id", { length: 15 }).notNull(),
    instr_name: text("instr_name").notNull(),
  },
  (table) => {
    return {
      sec_idx: index("SInstructors_sec_idx").on(table.sec),
      instr_id_idx: index("SInstructors_instr_id_idx").on(table.instr_id),
      SInstructors_instr_id_instr_name_fkey: foreignKey({
        columns: [table.instr_id, table.instr_name],
        foreignColumns: [Instructors.id, Instructors.name],
        name: "SInstructors_instr_id_instr_name_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
      SInstructors_term_sec_fkey: foreignKey({
        columns: [table.term, table.sec],
        foreignColumns: [Sections.term, Sections.section],
        name: "SInstructors_term_sec_fkey",
      })
        .onUpdate("restrict")
        .onDelete("cascade"),
      SInstructors_pkey: primaryKey({
        columns: [table.term, table.sec, table.instr_id],
        name: "SInstructors_pkey",
      }),
    };
  },
);

export const SDetails = pgTable(
  "SDetails",
  {
    term: varchar("term", { length: 4 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),
    day: smallint("day"),
    start_time: time("start_time"),
    end_time: time("end_time"),
    loc: text("loc"),
  },
  (table) => {
    return {
      term_idx: index("SDetails_term_idx").on(table.term),
      day_idx: index("SDetails_day_idx").on(table.day),
      end_time_idx: index("SDetails_end_time_idx").on(table.end_time),
      start_time_idx: index("SDetails_start_time_idx").on(table.start_time),
      SDetails_section_term_fkey: foreignKey({
        columns: [table.section, table.term],
        foreignColumns: [Sections.term, Sections.section],
        name: "SDetails_section_term_fkey",
      })
        .onUpdate("restrict")
        .onDelete("cascade"),
      SDetails_pkey: primaryKey({
        columns: [table.term, table.section],
        name: "SDetails_pkey",
      }),
    };
  },
);

export const Sections = pgTable(
  "Sections",
  {
    term: varchar("term", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),
    session: varchar("session", { length: 3 }).notNull(),
    dcode: DCODE("dcode").notNull(),
    type: STYPE("type").notNull(),
    cancelled: boolean("cancelled").notNull(),
    tot_seats: smallint("tot_seats").notNull(),
    taken_seats: smallint("taken_seats").notNull(),
    title: text("title").notNull(),
    sec_title: text("sec_title"),
    desc: text("desc"),
    notes: text("notes"),
    units_low: numeric("units_low", { precision: 3, scale: 1 }),
    units_high: numeric("units_high", { precision: 3, scale: 1 }),
  },
  (table) => {
    return {
      course_idx: index("Sections_course_idx").on(table.course),
      dcode_idx: index("Sections_dcode_idx").on(table.dcode),
      session_idx: index("Sections_session_idx").on(table.session),
      term_course_idx: index("Sections_term_course_idx").on(
        table.term,
        table.course,
      ),
      Sections_term_course_fkey: foreignKey({
        columns: [table.term, table.course],
        foreignColumns: [Courses.term, Courses.course],
        name: "Sections_term_course_fkey",
      })
        .onUpdate("restrict")
        .onDelete("restrict"),
      Sections_pkey: primaryKey({
        columns: [table.term, table.section],
        name: "Sections_pkey",
      }),
    };
  },
);

export const Courses = pgTable(
  "Courses",
  {
    term: varchar("term", { length: 4 }).notNull(),
    dept: varchar("dept", { length: 4 })
      .notNull()
      .references(() => Departments.code, {
        onDelete: "restrict",
        onUpdate: "cascade",
      }),
    course: varchar("course", { length: 9 }).notNull(),
    prefix: varchar("prefix", { length: 4 }).notNull(),
    number: varchar("number", { length: 3 }).notNull(),
    sequence: varchar("sequence", { length: 1 }),
    suffix: varchar("suffix", { length: 6 }),
    title: text("title").notNull(),
    desc: text("desc"),
    units_low: numeric("units_low", { precision: 3, scale: 1 }),
    units_high: numeric("units_high", { precision: 3, scale: 1 }),
    units_max: numeric("units_max", { precision: 3, scale: 1 }),
    restr_major: text("restr_major"),
    restr_class: text("restr_class"),
    restr_school: text("restr_school"),
    prereq: text("prereq"),
    coreq: text("coreq"),
  },
  (table) => {
    return {
      dept_idx: index("Courses_dept_idx").on(table.dept),
      term_dept_idx: index("Courses_term_dept_idx").on(table.term, table.dept),
      Courses_pkey: primaryKey({
        columns: [table.term, table.course],
        name: "Courses_pkey",
      }),
    };
  },
);
