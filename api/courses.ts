import { type ICourse, type ISection, iCourseSchema, iSectionSchema } from "../drizzle/types";
import type { ApiCourse, ApiInstructor, ClassesResponse } from "./types";
import { is_array, is_empty, day_to_num } from "./helpers";

export async function fetch_courses(dep: string, term: string) {
  const res = await fetch(`https://web-app.usc.edu/web/soc/api/classes/${dep}/${term}`);

  if (!res.ok) throw new Error(`Failed to fetch courses for ${dep} ${term}`);

  const courses = (await res.json()) as ClassesResponse;

  return is_array(courses.OfferedCourses.course) ? courses.OfferedCourses.course : [courses.OfferedCourses.course];
}

export function cast_course_api(c: ApiCourse, term: string) {
  const [units, total] = c.CourseData.units.split(", ");
  const [min, max] = units.split("-").map(str => parseFloat(str));
  const total_f = parseFloat(total);

  return iCourseSchema.parse({
    term: term,
    dept: c.CourseData.prefix,
    course: c.ScheduledCourseID,
    prefix: c.CourseData.prefix,
    number: c.CourseData.number,
    sequence: is_empty(c.CourseData.sequence) ? null : c.CourseData.sequence,
    suffix: is_empty(c.CourseData.suffix) ? null : c.CourseData.suffix,
    title: c.CourseData.title,
    desc: is_empty(c.CourseData.description) ? null : c.CourseData.description,
    units_low: min.toString(),
    units_high: (max ?? min).toString(),
    units_max: total_f > min ? total_f.toString() : null,
    restr_major: is_empty(c.CourseData.restriction_by_major) ? null : c.CourseData.restriction_by_major,
    restr_class: is_empty(c.CourseData.restriction_by_class) ? null : c.CourseData.restriction_by_class,
    restr_school: is_empty(c.CourseData.restriction_by_school) ? null : c.CourseData.restriction_by_school,
    prereq: is_empty(c.CourseData.prereq_text) ? null : c.CourseData.prereq_text,
    coreq: is_empty(c.CourseData.coreq_text) ? null : c.CourseData.coreq_text,
  } as ICourse);
}

export function cast_section_api(c: ApiCourse, term: string) {
  const sections = is_array(c.CourseData.SectionData) ? c.CourseData.SectionData : [c.CourseData.SectionData];

  const prof_to_sec: [string, ApiInstructor][] = [];

  return {
    secs: sections.map(s => {
      if (s.instructor) {
        is_array(s.instructor)
          ? prof_to_sec.push(...s.instructor.map(i => [s.id, i] as [string, ApiInstructor]))
          : prof_to_sec.push([s.id, s.instructor]);
      }
      const [min_units, max_units] = s.units.split("-").map(str => parseFloat(str));

      const [day1, day2] = is_empty(s.day) ? [null] : is_array(s.day) ? s.day : [s.day];
      const [start1, start2] = is_array(s.start_time) ? s.start_time : [s.start_time];
      const [end1, end2] = is_array(s.end_time) ? s.end_time : [s.end_time];
      const [loc1, loc2] = is_empty(s.location) ? [null] : is_array(s.location) ? s.location : [s.location];

      return iSectionSchema.parse({
        term: term,
        course: c.ScheduledCourseID,
        section: s.id,
        session: s.session,
        dcode: s.dclass_code.toLowerCase(),
        type: s.type === "Qz" ? "quiz" : s.type.toLowerCase(),
        tot_seats: parseInt(s.spaces_available),
        taken_seats: parseInt(s.number_registered),
        day: !day1 ? null : day_to_num(day1),
        start_time: start1 === "TBA" ? null : start1,
        end_time: end1 === "TBA" ? null : end1,
        loc: loc1,
        cancelled: s.canceled.toLowerCase(),
        title: s.title,
        sec_title: is_empty(s.section_title) ? null : s.section_title,
        desc: is_empty(s.description) ? null : s.description,
        notes: is_empty(s.notes) ? null : s.notes,
        units_low: min_units.toString(),
        units_high: (max_units ?? min_units).toString(),

        alt_day: !day2 ? null : day_to_num(day2),
        alt_start_time: start2,
        alt_end_time: end2,
        alt_loc: loc2,
      } as ISection);
    }),
    prof_to_sec,
  };
}
