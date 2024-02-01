import {
  test_cs_and_sections_to_db,
  test_depts_to_db,
  test_term_to_db,
} from "./db/feed";
import { get } from "./api/fetch";

const term = "20241";

const api_deps = await get.departments(term);
console.log("Got all departments");

async function settle<T>(values: Promise<T>[]) {
  return (await Promise.allSettled(values)).reduce<{
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
}

const { result: api_courses, errs } = await settle(
  api_deps.map((dep) => get.courses(term, dep.code)),
);
if (!errs.length) console.log("Got all courses");
else {
  console.error(errs);
  process.exit(1);
}

const xs = test_cs_and_sections_to_db(
  test_term_to_db(term),
  api_courses.flat(),
);

// UPDATE EXISTING
import { drizzle } from "drizzle-orm/postgres-js";
// import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";

import { neon } from "@neondatabase/serverless";
import postgres from "postgres";

// const queryClient = neon(process.env.DRIZZLE_DATABASE_URL!);
const queryClient = postgres(process.env.DRIZZLE_DATABASE_URL!);

const db = drizzle(queryClient, { logger: false });

import {
  courses,
  departments,
  instructors,
  sdetails,
  sections,
  sinstructors,
} from "./db/schema";

await db
  .insert(departments)
  .values(
    test_depts_to_db(api_deps).map((d) => ({
      ...d,
      updatedAt: new Date().toISOString(),
    })),
  )
  .onConflictDoUpdate({
    target: [departments.code],
    set: { name: sql`EXCLUDED.name`, updatedAt: sql`EXCLUDED.updated_at` },
  });
console.log("Upserted all departments");

await db
  .insert(courses)
  .values(xs.map((x) => ({ ...x.course, updatedAt: new Date().toISOString() })))
  .onConflictDoUpdate({
    target: [courses.term, courses.course],
    set: {
      coreq: sql`EXCLUDED.coreq`,
      desc: sql`EXCLUDED.desc`,
      prereq: sql`EXCLUDED.prereq`,
      restrClass: sql`EXCLUDED.restr_class`,
      restrMajor: sql`EXCLUDED.restr_major`,
      restrSchool: sql`EXCLUDED.restr_school`,
      sequence: sql`EXCLUDED.sequence`,
      suffix: sql`EXCLUDED.suffix`,
      title: sql`EXCLUDED.title`,
      unitsHigh: sql`EXCLUDED.units_high`,
      unitsLow: sql`EXCLUDED.units_low`,
      unitsMax: sql`EXCLUDED.units_max`,
      updatedAt: sql`EXCLUDED.updated_at`,
    },
  });
console.log("Upserted all courses");

for (const s of batch(
  xs.flatMap((x) => x.sec),
  4000,
)) {
  await db
    .insert(sections)
    .values(
      s.map((s) => ({
        course: s.course,
        dcode: s.dcode,
        desc: s.desc,
        notes: s.notes,
        secTitle: s.sec_title,
        session: s.session,
        takenSeats: s.taken_seats,
        title: s.title,
        totSeats: s.tot_seats,
        type: s.type,
        unitsHigh: s.units_high,
        unitsLow: s.units_low,
        term: s.term,
        section: s.section,
        cancelled: s.cancelled,
        updatedAt: new Date().toISOString(),
      })),
    )
    .onConflictDoUpdate({
      target: [sections.term, sections.section],
      set: {
        cancelled: sql`EXCLUDED.cancelled`,
        dcode: sql`EXCLUDED.dcode`,
        session: sql`EXCLUDED.session`,
        type: sql`EXCLUDED.type`,
        updatedAt: sql`EXCLUDED.updated_at`,
        course: sql`EXCLUDED.course`,
        desc: sql`EXCLUDED.desc`,
        notes: sql`EXCLUDED.notes`,
        secTitle: sql`EXCLUDED.sec_title`,
        takenSeats: sql`EXCLUDED.taken_seats`,
        title: sql`EXCLUDED.title`,
        totSeats: sql`EXCLUDED.tot_seats`,
        unitsLow: sql`EXCLUDED.units_low`,
        unitsHigh: sql`EXCLUDED.units_high`,
      },
    });
  console.log("Upserted a batch of sections");
}
console.log("Upserted all sections");

for (const sd of batch(
  xs.flatMap((x) => x.details),
  4000,
)) {
  await db
    .insert(sdetails)
    .values(
      sd.map((sd) => ({
        id: sd.id,
        section: sd.section,
        term: sd.term,
        day: sd.day,
        loc: sd.loc,
        endTime: sd.end_time,
        startTime: sd.start_time,
        updatedAt: new Date().toISOString(),
      })),
    )
    .onConflictDoUpdate({
      target: [sdetails.term, sdetails.section, sdetails.id],
      set: {
        day: sql`EXCLUDED.day`,
        endTime: sql`EXCLUDED.end_time`,
        loc: sql`EXCLUDED.loc`,
        startTime: sql`EXCLUDED.start_time`,
        updatedAt: sql`EXCLUDED.updated_at`,
      },
    });
  console.log("Upserted a batch of sdetails");
}
console.log("Upserted all sdetails");

for (const si of batch(
  xs.flatMap((x) => x.instrs),
  4000,
)) {
  await db.transaction(async (tx) => {
    await tx
      .insert(instructors)
      .values(
        si.map((si) => ({
          name: si.instr_name,
          id: si.instr_id,
        })),
      )
      .onConflictDoNothing({
        target: [instructors.name],
      });
    console.log("Upserted a batch of instructors");

    const i_map = new Map(
      (
        await tx
          .select({ id: instructors.id, name: instructors.name })
          .from(instructors)
      ).map((i) => [i.name, i.id]),
    );

    await tx
      .insert(sinstructors)
      .values(
        si.map((si) => ({
          instrId: i_map.get(si.instr_name)!,
          sec: si.sec,
          term: si.term,
          instrName: si.instr_name,
          updatedAt: new Date().toISOString(),
        })),
      )
      .onConflictDoUpdate({
        target: [sinstructors.term, sinstructors.instrName, sinstructors.sec],
        set: {
          updatedAt: sql`EXCLUDED.updated_at`,
        },
      });
  });
  console.log("Upserted a batch of sinstructors");
}
console.log("Upserted all instructors");
console.log("Upserted all sinstructors");
console.log("Finished");

// await queryClient.end();

function batch<T>(arr: T[], size: number) {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}
