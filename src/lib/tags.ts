/**
 * Normalize a profile field into a list of tags for rendering.
 *
 * Why this exists: several profile fields are NOT arrays on the backend.
 * `Profile.partnerPreferences` and `Profile.negativeConstraints` are free-text
 * columns (`string | null`), while `hobbies` genuinely is `string[]` and
 * `visualPreferences` is not returned at all.
 *
 * A `.length === 0` guard does not catch this: a non-empty string has a
 * `.length`, so it slips through and the next line calls `.map` on a string —
 * `items.map is not a function`. That throws during render, React unmounts the
 * whole tree, and the user profile drawer comes up blank, which is what the
 * "the user page won't open" bug actually was.
 */
export function toTagList(items: string[] | string | undefined | null): string[] {
  if (Array.isArray(items)) return items.filter((t) => t.trim().length > 0);
  if (typeof items === "string") {
    const trimmed = items.trim();
    return trimmed.length > 0 ? [trimmed] : [];
  }
  return [];
}
