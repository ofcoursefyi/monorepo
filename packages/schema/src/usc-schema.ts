import {
  pgTable,
  pgEnum,
  varchar,
  timestamp,
  text,
  index,
  uniqueIndex,
  foreignKey,
  primaryKey,
  smallint,
  time,
  serial,
  boolean,
  numeric,
} from "drizzle-orm/pg-core";

export const dcode = pgEnum("DCODE", ["d", "r"]);
export const stype = pgEnum("STYPE", [
  "lec",
  "dis",
  "lab",
  "quiz",
  "lec_lab",
  "lec_dis",
]);

export const departments = pgTable(
  "Departments",
  {
    code: varchar("code", { length: 4 }).primaryKey().notNull(),
    name: text("name").notNull(),
    updated_at: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  table => {
    return {
      codeIdx: index("Departments_code_idx").on(table.code),
    };
  }
);

export const instructors = pgTable(
  "Instructors",
  {
    id: varchar("id", { length: 21 }).notNull(),
    name: text("name").primaryKey().notNull(),
    email: text("email"),
  },
  table => {
    return {
      emailKey: uniqueIndex("Instructors_email_key").on(table.email),
      nameIdx: index("Instructors_name_idx").on(table.name),
    };
  }
);

export const sinstructors = pgTable(
  "SInstructors",
  {
    term: varchar("term", { length: 4 }).notNull(),
    sec: varchar("sec", { length: 5 }).notNull(),
    instr_id: varchar("instr_id", { length: 21 }).notNull(),
    instr_name: text("instr_name").notNull(),
    updated_at: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  table => {
    return {
      secIdx: index("SInstructors_sec_idx").on(table.sec),
      instrIdIdx: index("SInstructors_instr_id_idx").on(table.instr_id),
      sinstructorsInstrNameInstrIdFkey: foreignKey({
        columns: [table.instr_name, table.instr_id],
        foreignColumns: [instructors.id, instructors.name],
        name: "SInstructors_instr_name_instr_id_fkey",
      })
        .onUpdate("cascade")
        .onDelete("restrict"),
      sinstructorsTermSecFkey: foreignKey({
        columns: [table.term, table.sec],
        foreignColumns: [sections.term, sections.section],
        name: "SInstructors_term_sec_fkey",
      })
        .onUpdate("restrict")
        .onDelete("cascade"),
      sinstructorsPkey: primaryKey({
        columns: [table.term, table.sec, table.instr_name],
        name: "SInstructors_pkey",
      }),
    };
  }
);

export const sdetails = pgTable(
  "SDetails",
  {
    term: varchar("term", { length: 4 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),
    day: smallint("day"),
    start_time: time("start_time"),
    end_time: time("end_time"),
    loc: text("loc"),
    updated_at: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
    id: serial("id").notNull(),
  },
  table => {
    return {
      termIdx: index("SDetails_term_idx").on(table.term),
      dayIdx: index("SDetails_day_idx").on(table.day),
      endTimeIdx: index("SDetails_end_time_idx").on(table.end_time),
      startTimeIdx: index("SDetails_start_time_idx").on(table.start_time),
      sdetailsSectionTermFkey: foreignKey({
        columns: [table.section, table.term],
        foreignColumns: [sections.term, sections.section],
        name: "SDetails_section_term_fkey",
      })
        .onUpdate("restrict")
        .onDelete("cascade"),
      sdetailsPkey: primaryKey({
        columns: [table.term, table.section, table.id],
        name: "SDetails_pkey",
      }),
    };
  }
);

export const sections = pgTable(
  "Sections",
  {
    term: varchar("term", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),
    session: varchar("session", { length: 3 }).notNull(),
    dcode: dcode("dcode").notNull(),
    type: stype("type").notNull(),
    cancelled: boolean("cancelled").notNull(),
    tot_seats: smallint("tot_seats").notNull(),
    taken_seats: smallint("taken_seats").notNull(),
    title: text("title").notNull(),
    sec_title: text("sec_title"),
    desc: text("desc"),
    notes: text("notes"),
    units_low: numeric("units_low", { precision: 3, scale: 1 }),
    units_high: numeric("units_high", { precision: 3, scale: 1 }),
    updated_at: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  table => {
    return {
      courseIdx: index("Sections_course_idx").on(table.course),
      dcodeIdx: index("Sections_dcode_idx").on(table.dcode),
      sessionIdx: index("Sections_session_idx").on(table.session),
      termCourseIdx: index("Sections_term_course_idx").on(
        table.term,
        table.course
      ),
      sectionsTermCourseFkey: foreignKey({
        columns: [table.term, table.course],
        foreignColumns: [courses.term, courses.course],
        name: "Sections_term_course_fkey",
      })
        .onUpdate("restrict")
        .onDelete("restrict"),
      sectionsPkey: primaryKey({
        columns: [table.term, table.section],
        name: "Sections_pkey",
      }),
    };
  }
);

export const courses = pgTable(
  "Courses",
  {
    term: varchar("term", { length: 4 }).notNull(),
    dept: varchar("dept", { length: 4 })
      .notNull()
      .references(() => departments.code, {
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
    updated_at: timestamp("updated_at", {
      precision: 3,
      mode: "string",
    }).notNull(),
  },
  table => {
    return {
      deptIdx: index("Courses_dept_idx").on(table.dept),
      termDeptIdx: index("Courses_term_dept_idx").on(table.term, table.dept),
      coursesPkey: primaryKey({
        columns: [table.term, table.course],
        name: "Courses_pkey",
      }),
    };
  }
);

// Validated Table Types
import type { z } from "zod";
import type { validate as t } from "@ofc/transformer/parse";

export type Term = z.infer<typeof t.term>;
export type Department = z.infer<typeof t.dept>;
export type Course = z.infer<typeof t.course>;
export type Section = z.infer<typeof t.section>;
export type SDetail = z.infer<typeof t.s_detail>;
export type SInstr = z.infer<typeof t.s_instr>;
