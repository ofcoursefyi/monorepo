import { test_cs_and_sections_to_db, test_depts_to_db } from "./db/feed";
import { prisma } from "./db/client";
import { get } from "./api/fetch";

const term = "20241";
const fterm = "SP24";

const deps = await get.departments(term);
console.log("Got all departments");

await prisma.departments.createMany({
  data: await test_depts_to_db(deps),
  skipDuplicates: true,
});
console.log("Migrated new departments");

const settle = async <T>(values: Promise<T>[]) =>
  (await Promise.allSettled(values)).reduce<{
    result: T[];
    errs: unknown[];
  }>(
    (acc, curr) => {
      if (curr.status === "fulfilled") acc.result.push(curr.value);
      else acc.errs.push(curr.reason);
      return acc;
    },
    {
      result: [],
      errs: [],
    },
  );

const { result: courses, errs } = await settle(
  deps.map((dep) => get.courses(term, dep.code)),
);
console.log("Got all courses");
if (errs.length) {
  console.error(errs);
  process.exit(1);
}

const xs = await test_cs_and_sections_to_db(fterm, courses.flat());

await prisma.courses.createMany({
  data: xs.map((x) => x.course),
  skipDuplicates: true,
});
console.log("Migrated new courses");

await prisma.sections.createMany({
  data: xs.flatMap((x) => x.sec),
  skipDuplicates: true,
});
console.log("Migrated new sections");

await prisma.sDetails.createMany({
  data: xs.flatMap((x) => x.details),
  skipDuplicates: true,
});
console.log("Migrated new section details");

await prisma.instructors.createMany({
  data: xs
    .flatMap((x) => x.instrs)
    .map((i) => ({ name: i.instr_name, id: i.instr_id })),
  skipDuplicates: true,
});
console.log("Migrated new instructors");

const i_map = new Map(
  (
    await prisma.instructors.findMany({
      select: {
        name: true,
        id: true,
      },
    })
  ).map((i) => [i.name, i.id] as const),
);

await prisma.sInstructors.createMany({
  data: xs
    .flatMap((x) => x.instrs)
    .map((i) => ({ ...i, instr_id: i_map.get(i.instr_name)! })),
  skipDuplicates: true,
});
console.log("Migrated new section instructors");

console.log("Finished");
