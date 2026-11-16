/**
 * Element drivers read and write raw values of form controls (or widgets) so they can be bound to URL state.
 */
export type RawValue = string | readonly string[] | null

export interface ElementDriver {
  readonly name: string
  /** Default DOM events that signal a user change. */
  readonly events: readonly string[]
  matches(elements: readonly Element[]): boolean
  read(elements: readonly Element[]): RawValue
  write(elements: readonly Element[], value: RawValue): void
}

/** Normalizes a raw value to a list. */
export function toList(value: RawValue): readonly string[] {
  if (value === null) return []
  return typeof value === 'string' ? [value] : value
}
