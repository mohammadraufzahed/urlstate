import { describe, expect, it } from 'vitest'
import { browserAdapter, createAdapter, createSerializer, createUrlState, debounce, memoryAdapter, parseAsInteger, parseAsString } from '@/index'
import { inputDriver } from '@/dom/drivers/built-in'

const sleep = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms))

describe('regressions', () => {
  it('serializer keeps everything after the first # in the base', () => {
    const serialize = createSerializer({ page: parseAsInteger })
    expect(serialize('/p?a=1#x#y', { page: 2 })).toBe('/p?a=1&page=2#x#y')
  })

  it('destroy settles pending debounced updates', async () => {
    const instance = createUrlState({ adapter: memoryAdapter() })
    const pending = instance.queryState('q', parseAsString).set('x', { limitUrlUpdates: debounce(1000) })
    instance.destroy()
    await expect(pending).resolves.toBeInstanceOf(URLSearchParams)
  })

  it('rejects set() when processUrlSearchParams throws', async () => {
    const instance = createUrlState({
      adapter: memoryAdapter(),
      processUrlSearchParams: () => {
        throw new Error('boom')
      }
    })
    await expect(instance.queryState('q').set('x')).rejects.toThrow('boom')
    instance.destroy()
  })

  it('waits for an in-flight async write before the next flush', async () => {
    let url = new URLSearchParams()
    const adapter = createAdapter({
      name: 'slow',
      defaultThrottleMs: 0,
      read: () => new URLSearchParams(url),
      write: async search => {
        await sleep(20)
        url = new URLSearchParams(search)
      },
      subscribe: () => () => undefined
    })
    const instance = createUrlState({ adapter })
    const first = instance.queryState('a').set('1')
    await sleep(5)
    const second = instance.queryState('b').set('2')
    await Promise.all([first, second])
    expect(url.toString()).toBe('a=1&b=2')
    instance.destroy()
  })

  it('unicode writes do not cancel other queued updates', async () => {
    history.replaceState(null, '', '/')
    const instance = createUrlState({ adapter: browserAdapter() })
    const later = instance.queryState('b', parseAsString).set('later', { limitUrlUpdates: debounce(30) })
    await instance.queryState('a', parseAsString).set('سلام')
    await later
    expect(new URLSearchParams(location.search).get('b')).toBe('later')
    expect(new URLSearchParams(location.search).get('a')).toBe('سلام')
    instance.destroy()
  })

  it('input driver maps repeated text fields by position', () => {
    document.body.innerHTML = '<input name="t[]"><input name="t[]">'
    const fields = Array.from(document.querySelectorAll('input'))
    expect(inputDriver.matches(fields)).toBe(true)
    inputDriver.write(fields, ['a', 'b'])
    expect(fields.map(field => field.value)).toEqual(['a', 'b'])
    expect(inputDriver.read(fields)).toEqual(['a', 'b'])
  })
})
