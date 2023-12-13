export async function fetch_recent_terms() {
  const res = await fetch("https://web-app.usc.edu/web/soc/api/terms");

  if (!res.ok) throw new Error("Failed to fetch terms");

  return ((await res.json()) as { term: string[] }).term;
}
