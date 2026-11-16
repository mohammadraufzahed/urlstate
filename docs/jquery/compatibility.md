# Compatibility (3.6 – 4.x)

Peer range: `jquery >=3.6.0 <5`. CI runs the unit suite on **3.6.0, 3.6.4, 3.7.1 and 4.0.0**, each in the full and slim builds. The browser tests run on all four versions.

The plugin only uses APIs that exist in 3.6 and are unchanged in 4.0: `$.fn.extend`, `.on`, `.off`, `.trigger`, `.val`, `.toArray` and `$(element)`. It uses none of the helpers removed in 4.0 (`$.isArray`, `$.trim`, `$.parseJSON`, `$.type`, `$.isFunction`, `$.isNumeric`, `$.now`) and needs no ajax or effects, so the slim build works.

- **Multiple jQuery copies:** call `installUrlState($)` for each one. Installation is idempotent per copy.
- **`noConflict`:** works; the IIFE installs on whatever `window.jQuery` is at load time.
- **Older than 3.6:** may work but is not tested or supported.
- **Browsers:** ES2018 (the IIFE target). `URLSearchParams` and `CustomEvent` are required; there is no IE11 support.
