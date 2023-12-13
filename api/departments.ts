import { is_array } from "./helpers";
import { DepartmentsResponse } from "./types";

export async function getDepartments(term: string) {
  const res = await fetch(`https://web-app.usc.edu/web/soc/api/departments/${term}`);

  if (!res.ok) throw new Error("Failed to fetch departments");

  const schools = ((await res.json()) as DepartmentsResponse).department.filter(
    ({ code }) =>
      [
        "ACTN", // ACCT in BUS
        "GEP", // GE repeat
        "GEPN", // GE repeat but missing GESM
        "GRSC", // no depts just itself
        "SWDP", // SWKO no courses at all
        "NURS", // no depts just itself
        "PDF", // no depts just itself
      ].includes(code) === false
  );

  return schools.flatMap(school => (is_array(school.department) ? school.department : [school.department]));
}
