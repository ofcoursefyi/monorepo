import { getDepartments } from "./api/departments";
import { getRecentTerms } from "./api/terms";
import { apiToDB, api_to_db_sections, getCourses } from "./api/courses";
import { db } from "./drizzle/db";
import { courses, instructors, sections } from "./drizzle/schema";

async function main() {
  // const terms = await getRecentTerms();
  // console.log(terms);

  // const departments = await getDepartments(terms[0]);
  // console.log(departments);
  const term = ["20241", "SP24"];

  const api_courses = (await getCourses("AME", term[0])).filter(c => c.IsCrossListed === "N");

  const cs = api_courses.map(c => apiToDB(c, term[1]));
  const ss = api_courses.map(c => api_to_db_sections(c, term[1]));

  const c = await db.insert(courses).values(api_courses as any);
  console.log(c);

  const s_flat = ss.flatMap(s => s[0]);
  const si_flat = ss.flatMap(s => s[1]);

  const s = await db.insert(sections).values(s_flat as any);
  console.log(s);

  const all_inst = (await db.select().from(instructors)).map(i => i.name);
  for (const [s, si] of ss) {
  }
}

main();
