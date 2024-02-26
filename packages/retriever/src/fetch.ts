import { validate } from "./validate";

const URL = "https://web-app.usc.edu/web/soc/api";

export const get = {
  terms: async () => {
    const res = await fetch(`${URL}/terms`);
    if (!res.ok) throw new Error("Failed to fetch terms");

    return validate.terms.parse(await res.json());
  },

  departments: async (term: string) => {
    const res = await fetch(`${URL}/departments/${term}`);
    if (!res.ok) throw new Error("Failed to fetch departments");

    return [
      ...new Map( // ensures no duplicated departments
        validate.departments
          .parse(await res.json())
          .filter(d => !["SWKO", "SWKC"].includes(d.code)) // remove SWKO and SWKC (they don't have any courses)
          .concat({ code: "SOWK", name: "Social Work", type: "N" }) // add SOWK (the SWKO and SWKC have courses under this dept code)
          .map(d => [d.code, d]) // unique key to remove duplicates
      ).values(),
    ];
  },

  courses: async (term: string, dep: string) => {
    const res = await fetch(`${URL}/classes/${dep}/${term}`);
    if (!res.ok) throw new Error(`Failed to fetch courses for ${dep} ${term}`);

    const ret = validate.courses.parse(await res.json()).OfferedCourses.course;
    if (!ret) throw new Error(`No courses found for ${dep} ${term}`);

    return ret;
  },
};
