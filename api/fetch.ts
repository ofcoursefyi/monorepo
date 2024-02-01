import { verify } from "../validators/api";

const URL = "https://web-app.usc.edu/web/soc/api";

export const get = {
  terms: async () => {
    const res = await fetch(`${URL}/terms`);
    if (!res.ok) throw new Error("Failed to fetch terms");

    return verify.terms.parse(await res.json());
  },

  departments: async (term: string) => {
    const res = await fetch(`${URL}/departments/${term}`);
    if (!res.ok) throw new Error("Failed to fetch departments");

    return verify.departments
      .parse(await res.json())
      .filter((d) => !["SWKO", "SWKC"].includes(d.code))
      .concat({ code: "SOWK", name: "Social Work", type: "N" });
  },

  courses: async (term: string, dep: string) => {
    const res = await fetch(`${URL}/classes/${dep}/${term}`);
    if (!res.ok) throw new Error(`Failed to fetch courses for ${dep} ${term}`);

    const ret = verify.courses.parse(await res.json()).OfferedCourses.course;
    if (!ret) throw new Error(`No courses found for ${dep} ${term}`);

    return ret;
  },
};
