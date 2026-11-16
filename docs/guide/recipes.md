# Recipes

## Laravel / PHP filter form

```blade
<form id="filters" action="{{ route('tires.index') }}">
  <input name="q" value="{{ request('q') }}">
  @foreach ($brands as $brand)
    <label><input type="checkbox" name="brands[]" value="{{ $brand }}" @checked(in_array($brand, request('brands', [])))> {{ $brand }}</label>
  @endforeach
</form>
<script>$('#filters').urlStateForm(null, { shallow: false, live: false })</script>
```

With `shallow: false`, each submit loads the page normally and the server renders the result. Remove it and listen to `urlstate:change` to fetch results with AJAX instead.

## DataTables

```js
var P = $.urlState.parsers
var s = $.urlStates({ page: P.parseAsIndex.withDefault(0), search: P.parseAsString.withDefault(''), sort: P.parseAsInteger.withDefault(0), dir: P.parseAsStringLiteral(['asc', 'desc']).withDefault('asc') })
var v = s.get()
var table = $('#tires').DataTable({ displayStart: v.page * 10, search: { search: v.search }, order: [[v.sort, v.dir]] })
table.on('page.dt search.dt order.dt', function () {
  var o = table.order()[0] || [0, 'asc']
  s.set({ page: table.page.info().page, search: table.search(), sort: o[0], dir: o[1] })
})
s.subscribe(function (v, meta) { if (meta.source !== 'set') table.search(v.search).order([v.sort, v.dir]).page(v.page).draw(false) })
```

## Select2

See [Widget drivers](/jquery/drivers).

## Turbo / htmx

The browser adapter sees `pushState`/`replaceState` calls made by Turbo and htmx (`source: 'external'`). After a Turbo page swap, call `autoBind()` again, or use `autoBind(document, { observe: true })`.

## Share links from the server

```js
const serialize = createSerializer(schema)
const next = serialize(request.url, { page: page + 1 })
```
