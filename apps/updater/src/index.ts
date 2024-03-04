import { transform } from "@ofc/transformer";
import { db, db_client } from "./client";
import { get } from "@ofc/retriever";
import { sql } from "drizzle-orm";
import {
  courses,
  departments,
  instructors,
  sdetails,
  sections,
  sinstructors,
} from "@ofc/schema/usc";

// PREAMBLE
const term = "20241";
// 20231 not working for SINSTRUCTORS

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
    }
  );
}

const { result: api_courses, errs } = await settle(
  api_deps.map(dep => get.courses(term, dep.code))
);
if (!errs.length) console.log("Got all courses");
else {
  console.error(errs);
  process.exit(1);
}

const xs = transform.courses(transform.term(term), api_courses.flat());

function batch<T>(arr: T[], size: number) {
  const batches: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    batches.push(arr.slice(i, i + size));
  }
  return batches;
}

// MAIN
// new idea: upsert all sections, sdetails, and sinstructors
// - in a single transaction
// - delete all sections, sdetails, and sinstructors with a updatedAt < latestUpdatedAt
await db
  .insert(departments)
  .values(
    transform.departments(api_deps).map(d => ({
      ...d,
      updated_at: new Date().toISOString(),
    }))
  )
  .onConflictDoUpdate({
    target: [departments.code],
    set: { name: sql`EXCLUDED.name`, updated_at: sql`EXCLUDED.updated_at` },
  });
console.log("Upserted all departments");

for (const c of batch(
  xs.map(x => ({ ...x.course, updated_at: new Date().toISOString() })),
  1000
)) {
  await db
    .insert(courses)
    .values(c)
    .onConflictDoUpdate({
      target: [courses.term, courses.course],
      set: {
        coreq: sql`EXCLUDED.coreq`,
        desc: sql`EXCLUDED.desc`,
        prereq: sql`EXCLUDED.prereq`,
        restr_class: sql`EXCLUDED.restr_class`,
        restr_major: sql`EXCLUDED.restr_major`,
        restr_school: sql`EXCLUDED.restr_school`,
        sequence: sql`EXCLUDED.sequence`,
        suffix: sql`EXCLUDED.suffix`,
        title: sql`EXCLUDED.title`,
        units_high: sql`EXCLUDED.units_high`,
        units_low: sql`EXCLUDED.units_low`,
        units_max: sql`EXCLUDED.units_max`,
        updated_at: sql`CASE 
        WHEN ${courses.coreq} IS DISTINCT FROM EXCLUDED.coreq
          OR ${courses.desc} IS DISTINCT FROM EXCLUDED.desc
          OR ${courses.prereq} IS DISTINCT FROM EXCLUDED.prereq
          OR ${courses.restr_class} IS DISTINCT FROM EXCLUDED.restr_class
          OR ${courses.restr_major} IS DISTINCT FROM EXCLUDED.restr_major
          OR ${courses.restr_school} IS DISTINCT FROM EXCLUDED.restr_school
          OR ${courses.sequence} IS DISTINCT FROM EXCLUDED.sequence
          OR ${courses.suffix} IS DISTINCT FROM EXCLUDED.suffix
          OR ${courses.title} IS DISTINCT FROM EXCLUDED.title
          OR ${courses.units_high} IS DISTINCT FROM EXCLUDED.units_high
          OR ${courses.units_low} IS DISTINCT FROM EXCLUDED.units_low
          OR ${courses.units_max} IS DISTINCT FROM EXCLUDED.units_max
        THEN EXCLUDED.updated_at
        ELSE ${courses.updated_at}
        END`,
      },
    });
}
console.log("Upserted all courses");

for (const s of batch(
  xs.flatMap(x => x.sections),
  4000
)) {
  await db
    .insert(sections)
    .values(
      s.map(s => ({
        course: s.course,
        dcode: s.dcode,
        desc: s.desc,
        notes: s.notes,
        sec_title: s.sec_title,
        session: s.session,
        taken_seats: s.taken_seats,
        title: s.title,
        tot_seats: s.tot_seats,
        type: s.type,
        units_high: s.units_high,
        units_low: s.units_low,
        term: s.term,
        section: s.section,
        cancelled: s.cancelled,
        updated_at: new Date().toISOString(),
      }))
    )
    .onConflictDoUpdate({
      target: [sections.term, sections.section],
      set: {
        cancelled: sql`EXCLUDED.cancelled`,
        dcode: sql`EXCLUDED.dcode`,
        session: sql`EXCLUDED.session`,
        type: sql`EXCLUDED.type`,
        course: sql`EXCLUDED.course`,
        desc: sql`EXCLUDED.desc`,
        notes: sql`EXCLUDED.notes`,
        sec_title: sql`EXCLUDED.sec_title`,
        taken_seats: sql`EXCLUDED.taken_seats`,
        title: sql`EXCLUDED.title`,
        tot_seats: sql`EXCLUDED.tot_seats`,
        units_low: sql`EXCLUDED.units_low`,
        units_high: sql`EXCLUDED.units_high`,
        updated_at: sql`CASE
        WHEN ${sections.cancelled} IS DISTINCT FROM EXCLUDED.cancelled
          OR ${sections.dcode} IS DISTINCT FROM EXCLUDED.dcode
          OR ${sections.session} IS DISTINCT FROM EXCLUDED.session
          OR ${sections.type} IS DISTINCT FROM EXCLUDED.type
          OR ${sections.course} IS DISTINCT FROM EXCLUDED.course
          OR ${sections.desc} IS DISTINCT FROM EXCLUDED.desc
          OR ${sections.notes} IS DISTINCT FROM EXCLUDED.notes
          OR ${sections.sec_title} IS DISTINCT FROM EXCLUDED.sec_title
          OR ${sections.taken_seats} IS DISTINCT FROM EXCLUDED.taken_seats
          OR ${sections.title} IS DISTINCT FROM EXCLUDED.title
          OR ${sections.tot_seats} IS DISTINCT FROM EXCLUDED.tot_seats
          OR ${sections.units_low} IS DISTINCT FROM EXCLUDED.units_low
          OR ${sections.units_high} IS DISTINCT FROM EXCLUDED.units_high
        THEN EXCLUDED.updated_at
        ELSE ${sections.updated_at}
        END`,
      },
    });
  console.log("Upserted a batch of sections");
}
console.log("Upserted all sections");

for (const sd of batch(
  xs.flatMap(x => x.details),
  4000
)) {
  await db
    .insert(sdetails)
    .values(
      sd.map(sd => ({
        id: sd.id,
        section: sd.section,
        term: sd.term,
        day: sd.day,
        loc: sd.loc,
        end_time: sd.end_time,
        start_time: sd.start_time,
        updated_at: new Date().toISOString(),
      }))
    )
    .onConflictDoUpdate({
      target: [sdetails.term, sdetails.section, sdetails.id],
      set: {
        day: sql`EXCLUDED.day`,
        end_time: sql`EXCLUDED.end_time`,
        loc: sql`EXCLUDED.loc`,
        start_time: sql`EXCLUDED.start_time`,
        updated_at: sql`EXCLUDED.updated_at`,
      },
    });
  console.log("Upserted a batch of sdetails");
}
console.log("Upserted all sdetails");

for (const si of batch(
  xs.flatMap(x => x.instrs),
  4000
)) {
  await db.transaction(async tx => {
    await tx
      .insert(instructors)
      .values(
        si.map(si => ({
          name: si.instr_name,
          id: si.instr_id,
        }))
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
      ).map(i => [i.name, i.id])
    );

    // const test = si.map((si) => ({
    //   instrId: i_map.get(si.instr_name)!,
    //   sec: si.sec,
    //   term: si.term,
    //   instrName: si.instr_name,
    //   updatedAt: new Date().toISOString(),
    // }));
    // const duplicates = test.filter((item, index, self) =>
    //   self.some(
    //     (other, otherIndex) =>
    //       index !== otherIndex &&
    //       item.instrId === other.instrId &&
    //       item.sec === other.sec,
    //   ),
    // );
    // console.log(duplicates);

    await tx
      .insert(sinstructors)
      .values(
        si.map(si => ({
          instr_id: i_map.get(si.instr_name)!,
          sec: si.sec,
          term: si.term,
          instr_name: si.instr_name,
          updated_at: new Date().toISOString(),
        }))
      )
      .onConflictDoUpdate({
        target: [sinstructors.term, sinstructors.instr_name, sinstructors.sec],
        set: {
          updated_at: sql`EXCLUDED.updated_at`,
        },
      });
  });
  console.log("Upserted a batch of sinstructors");
}
console.log("Upserted all instructors");
console.log("Upserted all sinstructors");

await db_client.end();
console.log("Finished");
