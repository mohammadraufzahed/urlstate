import { describe, expect, it } from 'vitest'
import { createDriverRegistry } from '@/dom/drivers/registry'
import type { ElementDriver } from '@/dom/drivers/types'

describe('driver registry', () => {
  it('resolves built-ins and lets custom drivers win', () => {
    const registry = createDriverRegistry()
    const input = document.createElement('input')
    expect(registry.resolve([input]).name).toBe('input')
    const custom: ElementDriver = { name: 'custom', events: ['change'], matches: () => true, read: () => null, write: () => undefined }
    const off = registry.register(custom)
    expect(registry.resolve([input]).name).toBe('custom')
    expect(registry.get('custom')).toBe(custom)
    off()
    expect(registry.resolve([input]).name).toBe('input')
    expect(() => registry.resolve([input], 'missing')).toThrow(/missing/)
  })
})
