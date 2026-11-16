type HistoryMethod = 'pushState' | 'replaceState'
type Hook = (method: HistoryMethod) => void

interface PatchRecord {
  readonly hooks: Set<Hook>
}

const PATCH_KEY = Symbol.for('urlstate.historyPatch')

type PatchedWindow = Window & { [PATCH_KEY]?: PatchRecord }

/**
 * Calls `hook` after any `history.pushState` / `history.replaceState`, including calls made by other libraries.
 * The patch is installed once per window and shared by every adapter.
 */
export function onHistoryChange(hook: Hook): () => void {
  const target = window as PatchedWindow
  let record = target[PATCH_KEY]
  if (!record) {
    const created: PatchRecord = { hooks: new Set() }
    record = created
    target[PATCH_KEY] = created
    for (const method of ['pushState', 'replaceState'] as const) {
      const original = history[method]
      history[method] = function patched(this: History, data: unknown, unused: string, url?: string | URL | null) {
        original.call(this, data, unused, url)
        for (const fn of created.hooks) fn(method)
      }
    }
  }
  const hooks = record.hooks
  hooks.add(hook)
  return () => {
    hooks.delete(hook)
  }
}
