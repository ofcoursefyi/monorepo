import { mysqlTable, index, primaryKey, varchar, mysqlEnum, decimal, int, time } from "drizzle-orm/mysql-core";
import { createId } from "@paralleldrive/cuid2";
import { relations } from "drizzle-orm";

export const courses = mysqlTable(
  "courses",
  {
    term: varchar("term", { length: 4 }).notNull(),
    dept: varchar("dept", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),

    prefix: varchar("prefix", { length: 4 }).notNull(),
    number: varchar("number", { length: 3 }).notNull(),
    sequence: varchar("sequence", { length: 1 }),
    suffix: varchar("suffix", { length: 6 }),

    title: varchar("title", { length: 250 }).notNull(),
    desc: varchar("desc", { length: 1000 }),

    units_low: decimal("units_low", { precision: 3, scale: 1 }),
    units_high: decimal("units_high", { precision: 3, scale: 1 }),
    units_max: decimal("units_max", { precision: 3, scale: 1 }),

    restr_major: varchar("restr_major", { length: 2000 }),
    restr_class: varchar("restr_class", { length: 1000 }),
    restr_school: varchar("restr_school", { length: 2000 }),

    prereq: varchar("prereq", { length: 1000 }),
    coreq: varchar("coreq", { length: 1000 }),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.term, table.course] }),
      idx_dept_term: index("idx_dept_term").on(table.term, table.dept),
      idx_term: index("idx_term").on(table.term),
    };
  }
);

export const sections = mysqlTable(
  "sections",
  {
    term: varchar("term", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),

    session: varchar("session", { length: 3 }).notNull(),
    dcode: mysqlEnum("dcode", ["d", "r"]).notNull(),
    type: mysqlEnum("type", ["lec", "dis", "lab", "quiz", "lec-lab", "lec-dis"]),

    tot_seats: int("tot_seats", { unsigned: true }).notNull(),
    taken_seats: int("taken_seats", { unsigned: true }).notNull(),
    cancelled: mysqlEnum("cancelled", ["y", "n"]).notNull(),

    day: int("day", { unsigned: true }),
    start_time: time("start_time"),
    end_time: time("end_time"),
    loc: varchar("loc", { length: 50 }),

    alt_day: int("alt_day", { unsigned: true }),
    alt_start_time: time("alt_start_time"),
    alt_end_time: time("alt_end_time"),
    alt_loc: varchar("alt_loc", { length: 50 }),

    title: varchar("title", { length: 250 }).notNull(),
    sec_title: varchar("sec_title", { length: 250 }),
    desc: varchar("desc", { length: 2000 }),
    notes: varchar("notes", { length: 2000 }),

    units_low: decimal("units_low", { precision: 3, scale: 1 }),
    units_high: decimal("units_high", { precision: 3, scale: 1 }),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.section, table.term] }),
      idx_term: index("idx_term").on(table.term),
      idx_session: index("idx_session").on(table.session),
      idx_dcode: index("idx_dcode").on(table.dcode),
      idx_day: index("idx_day").on(table.day),
      idx_start_time: index("idx_start_time").on(table.start_time),
      idx_end_time: index("idx_end_time").on(table.end_time),
    };
  }
);

export const instructors = mysqlTable(
  "instructors",
  {
    id: varchar("id", { length: 25 }).$default(createId).primaryKey(),
    name: varchar("name", { length: 100 }).notNull(),
    email: varchar("email", { length: 100 }),
  },
  table => {
    return {
      idx_name: index("idx_name").on(table.name),
    };
  }
);

export const sec_instrs = mysqlTable(
  "section_instructors",
  {
    term: varchar("term", { length: 5 }).notNull(),
    sec: varchar("sec", { length: 5 }).notNull(),
    instr: varchar("instr", { length: 100 }).notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.term, table.instr, table.sec] }),
      idx_sec: index("idx_sec").on(table.sec),
      idx_instr: index("idx_instr").on(table.instr),
    };
  }
);

export const courses_rel = relations(courses, ({ many }) => ({
  sections: many(sections),
}));

export const sections_rel = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.term, sections.course],
    references: [courses.term, courses.course],
  }),
  instructors: many(sec_instrs),
}));

export const instructors_rel = relations(instructors, ({ many }) => ({
  sections: many(sec_instrs),
}));

export const sec_instrs_rel = relations(sec_instrs, ({ one }) => ({
  instructor: one(instructors, {
    fields: [sec_instrs.instr],
    references: [instructors.id],
  }),
  section: one(sections, {
    fields: [sec_instrs.sec, sec_instrs.term],
    references: [sections.section, sections.term],
  }),
}));
