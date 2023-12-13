export async function getRecentTerms() {
  const res = await fetch("https://web-app.usc.edu/web/soc/api/terms");

  if (!res.ok) throw new Error("Failed to fetch terms");

  return ((await res.json()) as { term: string[] }).term;
}
