import { verify as db } from "../validators/db";
import type { get } from "../api/fetch";
import { nanoid } from "nanoid";
import type { z } from "zod";
import { zip } from "radash";

// DEPT
type D_API_RESPONSE = Awaited<ReturnType<typeof get.departments>>;
type D_DB = z.infer<typeof db.dept>;

export async function test_depts_to_db(ds: D_API_RESPONSE) {
  return ds.map((d) =>
    db.dept.parse({ code: d.code, name: d.name } satisfies D_DB),
  );
}

// COURSE
type C_API_RESPONSE = Awaited<ReturnType<typeof get.courses>>;
type C_DB = z.infer<typeof db.course>;

// SECTION
type S_API_RESPONSE = Awaited<
  ReturnType<typeof get.courses>
>[number]["CourseData"]["SectionData"];
type S_DB = z.infer<typeof db.section>;
type S_DETAIL_DB = z.infer<typeof db.s_detail>;
type S_INSTR_DB = z.infer<typeof db.s_instr>;

export async function test_cs_and_sections_to_db(
  term: C_DB["term"],
  cs: C_API_RESPONSE,
) {
  return cs.map((c) => {
    const course = db.course.parse({
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
    } satisfies C_DB);

    const ss = c.CourseData.SectionData;
    const sec = ss.map((s) =>
      db.section.parse({
        term,
        course: course.course,
        section: s.id,
        session: s.session,
        dcode: s.dclass_code,
        type: s.type,
        cancelled: s.canceled,
        tot_seats: parseInt(s.spaces_available) + parseInt(s.number_registered),
        taken_seats: parseInt(s.number_registered),
        title: s.title,
        sec_title: s.section_title,
        desc: s.description,
        notes: s.notes,
        units_low: s.units?.min ?? null,
        units_high: s.units?.max ?? null,
      } satisfies S_DB),
    );

    const details = ss.flatMap((s) =>
      zip(s.day, s.start_time, s.end_time, s.location).map(
        ([day, start_time, end_time, loc]) =>
          db.s_detail.parse({
            term,
            section: s.id,
            day,
            start_time,
            end_time,
            loc,
          } satisfies S_DETAIL_DB),
      ),
    );

    const i_map = new Map<S_INSTR_DB["instr_name"], S_INSTR_DB["instr_id"]>(
      ss.flatMap((s) =>
        (s.instructor ?? []).map(
          (i) => [i.first_name + " " + i.last_name, nanoid()] as const,
        ),
      ),
    );
    const instrs = ss.flatMap((s) =>
      (s.instructor ?? []).map((i) =>
        db.s_instr.parse({
          term,
          sec: s.id,
          instr_name: i.first_name + " " + i.last_name,
          instr_id: i_map.get(i.first_name + " " + i.last_name)!,
        } satisfies S_INSTR_DB),
      ),
    );

    return { course, sec, details, instrs };
  });
}
