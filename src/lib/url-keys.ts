/**
 * Maps variable names to shorter URL keys.
 */
export type UrlKeys<S> = Partial<Record<keyof S & string, string>>

/** Resolves the URL key for a variable name. */
export function getUrlKey<S>(urlKeys: UrlKeys<S> | undefined, key: keyof S & string): string {
  if (!urlKeys) return key
  return Object.hasOwn(urlKeys, key) ? (urlKeys[key] ?? key) : key
}
