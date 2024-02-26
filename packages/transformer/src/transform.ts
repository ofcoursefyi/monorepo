import type { validate as retrieve } from "@ofc/retriever/parse";
import { validate as vresult } from "./validate";
import { nanoid } from "nanoid";
import { zip } from "radash";
import { z } from "zod";

// TERM
type API_TERM = z.infer<typeof retrieve.terms>[number];
type DB_TERM = z.infer<typeof vresult.term>;

// DEPT
type API_DEPARTMENT = z.infer<typeof retrieve.departments>;
type DB_DEPARTMENT = z.infer<typeof vresult.dept>;

// COURSE
type API_COURSE = NonNullable<
  z.infer<typeof retrieve.courses>["OfferedCourses"]["course"]
>;
type DB_COURSE = z.infer<typeof vresult.course>;

// SECTION
type DB_SECTION = z.infer<typeof vresult.section>;
type DB_SDETAIL = z.infer<typeof vresult.s_detail>;
type DB_SINSTR = z.infer<typeof vresult.s_instr>;

export const transform = {
  term: (t: API_TERM): DB_TERM => {
    const [y, s] = [t.slice(2, 4), t.slice(4, 5)].map(parseInt);
    return s === 1
      ? (`SP${y}` as const)
      : s === 2
        ? (`SU${y}` as const)
        : (`FA${y}` as const);
  },

  departments: (ds: API_DEPARTMENT): DB_DEPARTMENT[] =>
    ds.map(d => vresult.dept.parse({ code: d.code, name: d.name })),

  courses: (
    term: DB_TERM,
    cs: API_COURSE
  ): {
    course: DB_COURSE;
    sections: DB_SECTION[];
    details: DB_SDETAIL[];
    instrs: DB_SINSTR[];
  }[] =>
    cs.map(c => {
      const course = vresult.course.parse({
        term,
        dept: c.CourseData.prefix,
        course: c.ScheduledCourseID,
        prefix: c.CourseData.prefix,
        number: c.CourseData.number,
        sequence: c.CourseData.sequence,
        suffix: c.CourseData.suffix,
        title: c.CourseData.title,
        desc: c.CourseData.description,
        units_low: c.CourseData.units.min,
        units_high: c.CourseData.units.max ?? null,
        units_max: c.CourseData.units.total ?? null,
        restr_class: c.CourseData.restriction_by_class,
        restr_major: c.CourseData.restriction_by_major,
        restr_school: c.CourseData.restriction_by_school,
        coreq: c.CourseData.coreq_text,
        prereq: c.CourseData.prereq_text,
      } satisfies DB_COURSE);

      const ss = c.CourseData.SectionData;
      const sections = ss.map(s =>
        vresult.section.parse({
          term,
          course: course.course,
          section: s.id,
          session: s.session,
          dcode: s.dclass_code,
          type: s.type,
          cancelled: s.canceled,
          tot_seats:
            parseInt(s.spaces_available) + parseInt(s.number_registered),
          taken_seats: parseInt(s.number_registered),
          title: s.title,
          sec_title: s.section_title,
          desc: s.description,
          notes: s.notes,
          units_low: s.units?.min ?? null,
          units_high: s.units?.max ?? null,
        } satisfies DB_SECTION)
      );

      const details = ss.flatMap(s =>
        zip(s.day, s.start_time, s.end_time, s.location).map(
          ([day, start_time, end_time, loc], idx) =>
            vresult.s_detail.parse({
              id: idx,
              term,
              section: s.id,
              day,
              start_time,
              end_time,
              loc,
            } satisfies DB_SDETAIL)
        )
      );

      const i_map = new Map<DB_SINSTR["instr_name"], DB_SINSTR["instr_id"]>(
        ss.flatMap(s =>
          (s.instructor ?? []).map(
            i => [i.first_name + " " + i.last_name, nanoid()] as const
          )
        )
      );
      const instrs = ss.flatMap(s =>
        (s.instructor ?? []).map(i =>
          vresult.s_instr.parse({
            term,
            sec: s.id,
            instr_name: i.first_name + " " + i.last_name,
            instr_id: i_map.get(i.first_name + " " + i.last_name)!,
          } satisfies DB_SINSTR)
        )
      );

      return { course, sections, details, instrs };
    }),
};
