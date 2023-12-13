import { cast_course_api, cast_section_api, fetch_courses } from "./api/courses";
import { courses, instructors, sec_instrs, sections } from "./drizzle/schema";
import { db } from "./drizzle/db";

async function main() {
  const term = ["20241", "SP24"];

  const courses_from_dept = (await fetch_courses("BUAD", term[0])).filter(c => c.IsCrossListed === "N");

  const new_courses = courses_from_dept.map(c => cast_course_api(c, term[1]));
  const new_course_secs = courses_from_dept.map(c => cast_section_api(c, term[1]));

  const c = await db.insert(courses).values(new_courses);
  console.log(c);

  const new_secs = new_course_secs.flatMap(s => s.secs);
  const new_sec_instrs = new_course_secs.flatMap(s => s.prof_to_sec);

  const s = await db.insert(sections).values(new_secs);
  console.log(s);

  let all = new Map();
  (await db.query.instructors.findMany()).forEach(i => all.set(i.name, i));

  const to_add = [];
  for (const [s, si] of new_sec_instrs) {
    const name = si.first_name + " " + si.last_name;
    if (all.has(name)) continue;
    to_add.push({ name });
    all.set(name, null);
  }

  const i = await db.insert(instructors).values(to_add);
  console.log(i);

  all = new Map();
  (await db.query.instructors.findMany()).forEach(i => all.set(i.name, i));

  const to_add_si = [];
  for (const [s, si] of new_sec_instrs) {
    const name = si.first_name + " " + si.last_name;
    if (!all.has(name)) throw new Error("instructor not found");

    to_add_si.push({ sec: s, instr: all.get(name).id, term: term[1] });
  }

  const si = await db.insert(sec_instrs).values(to_add_si);
  console.log(si);
}

main();
