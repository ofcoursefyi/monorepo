import { get } from "./fetch";

export async function test_latest() {
  const terms = await get.terms();

  for (const term of terms) {
    const departments = await get.departments(term);
    console.log(term);

    for (const d of departments) {
      console.log(term, d.code);
      await get.courses(term, d.code);
    }
  }
}

export async function test_term(term: string) {
  const departments = await get.departments(term);
  console.log(term);

  for (const d of departments) {
    console.log(term, d.code);
    await get.courses(term, d.code);
  }
}

test_term("20223");
