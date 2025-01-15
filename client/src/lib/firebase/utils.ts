/**
 * Generates a URL-friendly slug from a string
 * @param text The text to convert into a slug
 * @param maxLength Optional maximum length for the slug
 * @returns A URL-friendly slug
 */
export function generateSlug(text: string, maxLength: number = 60): string {
  return text
    .toLowerCase() // Convert to lowercase
    .trim() // Remove whitespace from both ends
    .replace(/[^\w\s-]/g, '') // Remove all non-word chars (except spaces and dashes)
    .replace(/\s+/g, '-') // Replace spaces with dashes
    .replace(/-+/g, '-') // Replace multiple dashes with single dash
    .substring(0, maxLength) // Limit length
    .replace(/^-+|-+$/g, ''); // Remove dashes from start and end
}

/**
 * Ensures a slug is unique by appending a number if necessary
 * @param slug The base slug to make unique
 * @param existingSlugs Array of existing slugs to check against
 * @returns A unique slug
 */
export function makeSlugUnique(slug: string, existingSlugs: string[]): string {
  let uniqueSlug = slug;
  let counter = 1;
  
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  
  return uniqueSlug;
} 