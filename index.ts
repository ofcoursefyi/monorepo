import { get } from "./api/fetch";
import { db } from "./db/drizzle/client";

async function main() {
  const term = "20241";
  const deps = await get.departments(term);

  // const all = await Promise.allSettled(
  //   deps.map((dep) =>
  //     get
  //       .courses(term, dep.code)
  //       .catch((err) => Promise.reject({ err, dep, term })),
  //   ),
  // );

  // const courses = all
  //   .filter((s) => s.status === "fulfilled")
  //   .map((s) => s.status === "fulfilled" && s.value);

  // const errs = all
  //   .filter((s) => s.status === "rejected")
  //   .map((s) => s.status === "rejected" && s.reason);

  const test = db.query.Courses.findMany({
    where: (c, { eq }) => eq(c.term, term),
    with: {
      Sections: true,
    },
  });

  console.log(await test.execute());

  // if added, add it to the db
  // if removed, remove it from the db
  // if changed, update it in the db
}

main();
