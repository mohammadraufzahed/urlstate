---
layout: home
hero:
  name: urlstate
  text: URL state without a framework
  tagline: Typed query-string state for vanilla JS and jQuery 3.6+, with the same URL format as nuqs.
  actions:
    - { theme: brand, text: Get started, link: /guide/getting-started }
    - { theme: alt, text: Vanilla JS, link: /vanilla/ }
    - { theme: alt, text: jQuery, link: /jquery/ }
features:
  - title: Typed parsers
    details: Integers, dates, enums, arrays and JSON with schema validation. Invalid values fall back to defaults.
  - title: Batched, throttled URL writes
    details: Optimistic state; updates in the same tick become one history entry, with throttle or debounce per key.
  - title: Works with your HTML
    details: bind() any input, or use data-urlstate attributes and autoBind() with zero JS.
  - title: jQuery 3.6 – 4.x
    details: $(el).urlState(), $(form).urlStateForm(), Select2 and flatpickr drivers. Tested on full and slim builds.
  - title: Server ready
    details: createLoader / createSerializer parse and build the same URLs in Node, Deno, Bun and edge runtimes.
  - title: Small
    details: About 4 kB brotli for the core, no runtime dependencies, tree-shakeable entry points.
---
