import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'urlstate',
  description: 'Type-safe URL query-string state for vanilla JS and jQuery 3.6+',
  base: process.env.DOCS_BASE ?? '/urlstate/',
  cleanUrls: true,
  lastUpdated: true,
  themeConfig: {
    nav: [
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Vanilla JS', link: '/vanilla/' },
      { text: 'jQuery', link: '/jquery/' },
      { text: 'Server', link: '/server/' },
      { text: 'Reference', link: '/reference/parsers' },
      { text: 'Builds', link: '/guide/builds' }
    ],
    sidebar: {
      '/guide/': [
        {
          text: 'Guide',
          items: [
            { text: 'Getting started', link: '/guide/getting-started' },
            { text: 'Core concepts', link: '/guide/concepts' },
            { text: 'Builds & CDN', link: '/guide/builds' },
            { text: 'Migrating from nuqs', link: '/guide/migrating-from-nuqs' },
            { text: 'Recipes', link: '/guide/recipes' },
            { text: 'Debugging', link: '/guide/debugging' }
          ]
        }
      ],
      '/vanilla/': [
        {
          text: 'Vanilla JS',
          items: [
            { text: 'Overview', link: '/vanilla/' },
            { text: 'queryState & queryStates', link: '/vanilla/state' },
            { text: 'DOM bindings', link: '/vanilla/dom' },
            { text: 'Declarative autoBind', link: '/vanilla/auto-bind' },
            { text: 'Custom drivers', link: '/vanilla/drivers' },
            { text: 'Adapters', link: '/vanilla/adapters' },
            { text: 'Testing', link: '/vanilla/testing' }
          ]
        }
      ],
      '/jquery/': [
        {
          text: 'jQuery',
          items: [
            { text: 'Overview & install', link: '/jquery/' },
            { text: 'Binding elements', link: '/jquery/binding' },
            { text: 'Forms', link: '/jquery/forms' },
            { text: 'Widget drivers', link: '/jquery/drivers' },
            { text: 'Events', link: '/jquery/events' },
            { text: 'Compatibility (3.6 – 4.x)', link: '/jquery/compatibility' }
          ]
        }
      ],
      '/server/': [{ text: 'Server / Node', items: [{ text: 'Loaders & serializers', link: '/server/' }, { text: 'Validation', link: '/server/validation' }] }],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Parsers', link: '/reference/parsers' },
            { text: 'Options', link: '/reference/options' },
            { text: 'API', link: '/reference/api' }
          ]
        }
      ]
    },
    socialLinks: [{ icon: 'github', link: 'https://github.com/mohammadraufzahed/urlstate' }],
    search: { provider: 'local' },
    editLink: { pattern: 'https://github.com/mohammadraufzahed/urlstate/edit/main/docs/:path' },
    footer: { message: 'Released under the MIT License.' }
  }
})
