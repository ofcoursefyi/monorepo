import { type ICourse, type ISection, iCourseSchema, iSectionSchema } from "../drizzle/types";
import { is_array, is_empty, day_to_num } from "./helpers";
import { ApiCourse, ApiInstructor, ClassesResponse } from "./types";

export async function getCourses(dep: string, term: string) {
  const res = await fetch(`https://web-app.usc.edu/web/soc/api/classes/${dep}/${term}`);

  if (!res.ok) throw new Error(`Failed to fetch courses for ${dep} ${term}`);

  const courses = (await res.json()) as ClassesResponse;

  return is_array(courses.OfferedCourses.course) ? courses.OfferedCourses.course : [courses.OfferedCourses.course];
}

export function apiToDB(c: ApiCourse, term: string) {
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
    description: is_empty(c.CourseData.description) ? null : c.CourseData.description,
    unitsLow: min,
    unitsHigh: max ?? min,
    maxUnits: total_f > min ? total_f : null,
    restrictionByMajor: is_empty(c.CourseData.restriction_by_major) ? null : c.CourseData.restriction_by_major,
    restrictionByClass: is_empty(c.CourseData.restriction_by_class) ? null : c.CourseData.restriction_by_class,
    restrictionBySchool: is_empty(c.CourseData.restriction_by_school) ? null : c.CourseData.restriction_by_school,
    prereqText: is_empty(c.CourseData.prereq_text) ? null : c.CourseData.prereq_text,
    coreqText: is_empty(c.CourseData.coreq_text) ? null : c.CourseData.coreq_text,
  } as ICourse);
}

export function api_to_db_sections(c: ApiCourse, term: string): [ISection[], [string, ApiInstructor][]] {
  const sections = is_array(c.CourseData.SectionData) ? c.CourseData.SectionData : [c.CourseData.SectionData];

  const prof_to_sec: [string, ApiInstructor][] = [];

  return [
    sections.map(s => {
      if (s.instructor) {
        is_array(s.instructor)
          ? prof_to_sec.push(...s.instructor.map(i => [s.id, i] as [string, ApiInstructor]))
          : prof_to_sec.push([s.id, s.instructor]);
      }

      const [min_units, max_units] = s.units.split("-").map(str => parseFloat(str));

      return iSectionSchema.parse({
        term: term,
        course: c.ScheduledCourseID,
        section: s.id,
        session: s.session,
        dcode: s.dclass_code.toLowerCase(),
        type: s.type === "Qz" ? "quiz" : s.type.toLowerCase(),
        tot_seats: parseInt(s.spaces_available),
        taken_seats: parseInt(s.number_registered),
        day: is_empty(s.day) || !s.day ? null : day_to_num(s.day),
        start_time: s.start_time === "TBA" ? null : s.start_time,
        end_time: s.end_time === "TBA" ? null : s.end_time,
        loc: is_empty(s.location) ? null : s.location,
        cancelled: s.canceled.toLowerCase(),
        title: s.title,
        sec_title: is_empty(s.section_title) ? null : s.section_title,
        desc: is_empty(s.description) ? null : s.description,
        notes: is_empty(s.notes) ? null : s.notes,
        units_low: min_units,
        units_high: max_units ?? min_units,
      } as ISection);
    }),
    prof_to_sec,
  ];
}
