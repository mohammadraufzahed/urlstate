# Custom drivers

A driver teaches bindings how to read and write a widget.

```ts
interface ElementDriver {
  readonly name: string
  readonly events: readonly string[]          // events that mean "user changed it"
  matches(elements: readonly Element[]): boolean
  read(elements: readonly Element[]): string | readonly string[] | null
  write(elements: readonly Element[], value: string | readonly string[] | null): void
}
```

```js
import { drivers } from 'urlstate/dom'

const off = drivers.register({
  name: 'range-slider',
  events: ['slide-end'],
  matches: ([el]) => el.classList.contains('range-slider'),
  read: ([el]) => el.dataset.value ?? null,
  write: ([el], value) => el.rangeSlider.set(value ?? 0)
})
```

Registered drivers are tried before the built-in ones. Force one with `bind(el, key, parser, { driver: 'range-slider' })` or `data-urlstate-driver`. `write()` is never treated as user input, so it cannot cause loops. For an isolated set of drivers, use `createDriverRegistry()`.
