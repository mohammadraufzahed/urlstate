# Getting started

## Pick your target

| You use | Install | Read next |
| --- | --- | --- |
| A bundler (Vite, webpack, esbuild) | `npm i urlstate` | [Vanilla JS](/vanilla/) |
| jQuery pages (Laravel, WordPress, Rails, …) | `npm i urlstate jquery` or a `<script>` tag | [jQuery](/jquery/) |
| Plain HTML, no build step | `<script>` tag | [Declarative autoBind](/vanilla/auto-bind) |
| Node / edge / SSR | `npm i urlstate` | [Server](/server/) |

## Install

::: code-group
```bash [npm]
npm i urlstate
```
```bash [pnpm]
pnpm add urlstate
```
```bash [yarn]
yarn add urlstate
```
```html [script tag]
<script src="https://unpkg.com/urlstate/dist/urlstate.iife.min.js"></script>
```
:::

See [Builds & CDN](./builds) for every bundle.

## First state

```js
import { queryState, parseAsInteger } from 'urlstate'

const page = queryState('page', parseAsInteger.withDefault(1))

page.get()                                  // ?page=3 -> 3, missing -> 1
page.set(p => p + 1)                        // ?page=4 (history.replaceState)
page.set(1)                                 // default -> key removed: ?
page.subscribe(value => renderPage(value))  // also fires on Back/Forward
```

## Entry points

| Import | Contents |
| --- | --- |
| `urlstate` | parsers, `queryState`, `queryStates`, adapters, server helpers |
| `urlstate/dom` | `bind`, `autoBind`, drivers |
| `urlstate/jquery` | `installUrlState` (auto-installs on `window.jQuery`) |
| `urlstate/jquery/drivers` | Select2 and flatpickr drivers |
| `urlstate/server` | browser-free subset: parsers, `createLoader`, `createSerializer` |
| `urlstate/adapters/{browser,hash,memory}` | individual adapters |
