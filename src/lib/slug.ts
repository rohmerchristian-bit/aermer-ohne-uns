// URL slugs from German names: "Bürgerhaus Süd" → "buergerhaus-sued".

const REPLACEMENTS: Record<string, string> = {
  ä: 'ae',
  ö: 'oe',
  ü: 'ue',
  ß: 'ss',
  Ä: 'ae',
  Ö: 'oe',
  Ü: 'ue',
  ẞ: 'ss',
};

const MAX_LENGTH = 60;

export function slugify(input: string): string {
  const slug = input
    .replace(/[äöüßÄÖÜẞ]/g, (ch) => REPLACEMENTS[ch] ?? ch)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '') // remaining accents: é → e
    .toLowerCase()
    .replace(/&/g, ' und ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  if (slug.length <= MAX_LENGTH) return slug || 'einrichtung';
  const cut = slug.slice(0, MAX_LENGTH);
  const lastDash = cut.lastIndexOf('-');
  return (lastDash > 20 ? cut.slice(0, lastDash) : cut).replace(/-+$/, '');
}

/** Returns a slug that is not yet in `taken` (appending -2, -3, …) and records it. */
export function uniqueSlug(input: string, taken: Set<string>): string {
  const base = slugify(input);
  let slug = base;
  for (let n = 2; taken.has(slug); n++) slug = `${base}-${n}`;
  taken.add(slug);
  return slug;
}
