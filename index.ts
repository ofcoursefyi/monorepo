import { get } from "./api/fetch";

async function main() {
  const term = "20241";

  for (const dep of await get.departments(term)) {
    console.log(dep);
    await get.courses(term, dep.code);
  }
}

main();
