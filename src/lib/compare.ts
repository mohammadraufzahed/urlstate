/**
 * Equality helpers shared by parsers and the store.
 */
export function isEqual<T>(a: T, b: T): boolean {
  return a === b
}

/** Compares two arrays item by item with the given equality function. */
export function compareArrays<T>(a: readonly T[], b: readonly T[], eq: (x: T, y: T) => boolean): boolean {
  return a === b || (a.length === b.length && a.every((value, index) => eq(value, b[index] as T)))
}

/** Compares two raw query values (single string, list of strings or null). */
export function compareQuery(a: string | readonly string[] | null, b: string | readonly string[] | null): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a === 'string' || typeof b === 'string') return false
  return a.length === b.length && a.every((value, index) => value === b[index])
}
