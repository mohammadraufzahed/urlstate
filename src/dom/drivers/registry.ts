import { builtInDrivers } from '@/dom/drivers/built-in'
import type { ElementDriver } from '@/dom/drivers/types'

/**
 * Resolves the driver for a set of elements. Custom drivers registered later win over built-ins.
 */
export interface DriverRegistry {
  register(driver: ElementDriver): () => void
  get(name: string): ElementDriver | undefined
  resolve(elements: readonly Element[], name?: string): ElementDriver
  list(): readonly ElementDriver[]
}

/** Creates a registry seeded with the given drivers (built-ins by default). */
export function createDriverRegistry(initial: readonly ElementDriver[] = builtInDrivers): DriverRegistry {
  const drivers: ElementDriver[] = [...initial]
  return {
    register(driver) {
      drivers.unshift(driver)
      return () => {
        const index = drivers.indexOf(driver)
        if (index !== -1) drivers.splice(index, 1)
      }
    },
    get: name => drivers.find(d => d.name === name),
    resolve(elements, name) {
      const driver = name ? drivers.find(d => d.name === name) : drivers.find(d => d.matches(elements))
      if (!driver) throw new Error(`[urlstate] No driver ${name ? `named "${name}"` : 'matches the element(s)'}`)
      return driver
    },
    list: () => [...drivers]
  }
}

/** The shared registry used by `bind`, `autoBind` and the jQuery plugin. */
export const drivers: DriverRegistry = createDriverRegistry()
