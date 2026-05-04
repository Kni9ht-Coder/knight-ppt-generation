export function slugify(input: string): string {
  const ascii = input
    .normalize("NFKD")
    .replace(/[^\p{Letter}\p{Number}]+/gu, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();

  return ascii || "deck";
}
