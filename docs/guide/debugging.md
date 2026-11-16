# Debugging

Turn on logging:

```js
localStorage.debug = 'urlstate'   // browser, then reload
```
```bash
DEBUG=urlstate node app.mjs       # Node
```

The logger prints queued updates, flushes, adapter writes and external URL changes. With debugging on, it also warns when:

- a parser threw while parsing a value (the state falls back to its default)
- the rendered URL is longer than 2000 characters
- `configure()` was called after states were created

Listen to every write:

```js
window.addEventListener('urlstate:flush', e => console.log(e.detail.url, e.detail.options))
```
