import { relations } from "drizzle-orm";
import { nanoid } from "nanoid";
import {
  pgTable,
  pgEnum,
  primaryKey,
  foreignKey,
  index,
  varchar,
  text,
  smallint,
  decimal,
  time,
  boolean,
  unique,
} from "drizzle-orm/pg-core";

export const depts = pgTable(
  "depts",
  {
    code: varchar("code", { length: 4 }).primaryKey(),
    name: text("name").notNull(),
  },
  table => ({
    idx_code: index("idx_code").on(table.code),
  })
);

export const courses = pgTable(
  "courses",
  {
    term: varchar("term", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),
    dept: varchar("dept", { length: 4 })
      .references(() => depts.code, { onUpdate: "cascade", onDelete: "restrict" })
      .notNull(),

    prefix: varchar("prefix", { length: 4 }).notNull(),
    number: varchar("number", { length: 3 }).notNull(),
    sequence: varchar("sequence", { length: 1 }),
    suffix: varchar("suffix", { length: 6 }),

    title: text("title").notNull(),
    desc: text("desc"),

    units_low: decimal("units_low", { precision: 3, scale: 1 }),
    units_high: decimal("units_high", { precision: 3, scale: 1 }),
    units_max: decimal("units_max", { precision: 3, scale: 1 }),

    restr_major: text("restr_major"),
    restr_class: text("restr_class"),
    restr_school: text("restr_school"),

    prereq: text("prereq"),
    coreq: text("coreq"),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.term, table.course] }),
      idx_term_dept: index("idx_term_dept").on(table.term, table.dept),
      idx_dept: index("idx_dept").on(table.dept),
    };
  }
);

export const type_enum = pgEnum("type", ["lec", "dis", "lab", "quiz", "lec-lab", "lec-dis"]);
export const dcode_enum = pgEnum("dcode", ["d", "r"]);

export const sections = pgTable(
  "sections",
  {
    term: varchar("term", { length: 4 }).notNull(),
    course: varchar("course", { length: 9 }).notNull(),
    section: varchar("section", { length: 5 }).notNull(),

    session: varchar("session", { length: 3 }).notNull(),
    dcode: dcode_enum("dcode").notNull(),
    type: type_enum("type").notNull(),

    tot_seats: smallint("tot_seats").notNull(),
    taken_seats: smallint("taken_seats").notNull(),
    cancelled: boolean("cancelled").notNull(),

    title: text("title").notNull(),
    sec_title: text("sec_title"),
    desc: text("desc"),
    notes: text("notes"),

    units_low: decimal("units_low", { precision: 3, scale: 1 }),
    units_high: decimal("units_high", { precision: 3, scale: 1 }),
  },
  table => ({
    pk: primaryKey({ columns: [table.section, table.term] }),
    fk: foreignKey({ columns: [table.term, table.course], foreignColumns: [courses.term, courses.course] })
      .onDelete("restrict")
      .onUpdate("restrict"),

    idx_term_course: index("idx_term_course").on(table.term, table.course),
    idx_course: index("idx_course").on(table.course),
    idx_session: index("idx_session").on(table.session),
    idx_dcode: index("idx_dcode").on(table.dcode),
  })
);

export const sec_infos = pgTable(
  "section_infos",
  {
    section: varchar("section", { length: 5 }).notNull(),
    term: varchar("term", { length: 4 }).notNull(),

    day: smallint("day"),
    start_time: time("start_time"),
    end_time: time("end_time"),
    loc: text("loc"),
  },
  table => ({
    pk: primaryKey({ columns: [table.section, table.term] }),
    fk: foreignKey({ columns: [table.section, table.term], foreignColumns: [sections.section, sections.term] })
      .onDelete("cascade")
      .onUpdate("restrict"),

    idx_term: index("idx_term").on(table.term),
    idx_day: index("idx_day").on(table.day),
    idx_start_time: index("idx_start_time").on(table.start_time),
    idx_end_time: index("idx_end_time").on(table.end_time),
  })
);

export const instructors = pgTable(
  "instructors",
  {
    id: varchar("id", { length: 15 })
      .$default(() => nanoid(15))
      .primaryKey(),

    name: text("name").notNull(),
    email: text("email"),
  },
  table => {
    return {
      idx_name: index("idx_name").on(table.name),
      u_id_name: unique("u_id_name").on(table.id, table.name),
    };
  }
);

export const sec_instrs = pgTable(
  "section_instructors",
  {
    term: varchar("term", { length: 5 }).notNull(),
    sec: varchar("sec", { length: 5 }).notNull(),
    instr_id: varchar("instr_id", { length: 15 }).notNull(),
    instr_name: text("instr_name").notNull(),
  },
  table => {
    return {
      pk: primaryKey({ columns: [table.term, table.instr_id, table.sec] }),
      fk_sec: foreignKey({ columns: [table.term, table.sec], foreignColumns: [sections.term, sections.section] })
        .onDelete("cascade")
        .onUpdate("restrict"),
      fk_instr: foreignKey({
        columns: [table.instr_id, table.instr_name],
        foreignColumns: [instructors.id, instructors.name],
      })
        .onDelete("restrict")
        .onUpdate("cascade"),

      idx_sec: index("idx_sec").on(table.sec),
      idx_id: index("idx_id").on(table.instr_id),
      idx_name: index("idx_instr_name").on(table.instr_name),
    };
  }
);

export const courses_rel = relations(courses, ({ one, many }) => ({
  depts: one(depts, {
    fields: [courses.dept],
    references: [depts.code],
  }),
  sections: many(sections),
}));

export const sections_rel = relations(sections, ({ one, many }) => ({
  course: one(courses, {
    fields: [sections.term, sections.course],
    references: [courses.term, courses.course],
  }),
  infos: many(sec_infos),
  instructors: many(sec_instrs),
}));

export const sec_infos_rel = relations(sec_infos, ({ one }) => ({
  section: one(sections, {
    fields: [sec_infos.term, sec_infos.section],
    references: [sections.term, sections.section],
  }),
}));

export const instructors_rel = relations(instructors, ({ many }) => ({
  sections: many(sec_instrs),
}));

export const sec_instrs_rel = relations(sec_instrs, ({ one }) => ({
  instructor: one(instructors, {
    fields: [sec_instrs.instr_id, sec_instrs.instr_name],
    references: [instructors.id, instructors.name],
  }),
  section: one(sections, {
    fields: [sec_instrs.sec, sec_instrs.term],
    references: [sections.section, sections.term],
  }),
}));
