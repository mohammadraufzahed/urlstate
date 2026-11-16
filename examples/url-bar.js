// Shows the live query string on every example page.
(function () {
  var bar = document.createElement('p')
  bar.className = 'url'
  bar.setAttribute('data-testid', 'url')
  document.body.insertBefore(bar, document.body.firstChild)
  function render() { bar.textContent = location.pathname + location.search }
  window.addEventListener('urlstate:flush', render)
  window.addEventListener('popstate', render)
  render()
})()
