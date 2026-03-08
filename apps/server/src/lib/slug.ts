/**
 * Convert a name to a URL-friendly slug.
 * Converts to lowercase, replaces spaces with hyphens, removes special chars.
 * Example: "My Store" -> "my-store"
 */
export function createSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/[^\w-]/g, "") // Remove non-word characters except hyphens
    .replace(/-+/g, "-") // Replace multiple hyphens with single hyphen
    .replace(/^-|-$/g, ""); // Remove leading/trailing hyphens
}
