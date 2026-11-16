import { execFileSync } from 'node:child_process'
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const dist = resolve(root, 'dist')
const out = resolve(root, 'release')
const { version } = JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8'))
const targets = ['urlstate', 'urlstate.dom', 'urlstate.jquery', 'urlstate.jquery.full']
const builds = ['.iife.js', '.iife.min.js', '.esm.js', '.esm.min.js']
const browserBuild = /\.(iife|esm)(\.min)?\.js(\.map)?$/

rmSync(out, { recursive: true, force: true })
mkdirSync(out)
const docs = ['README.md', 'LICENSE'].map(file => resolve(root, file))

for (const target of targets) {
  const files = builds.flatMap(build => [`${target}${build}`, `${target}${build}.map`]).map(file => resolve(dist, file))
  const missing = files.filter(file => !existsSync(file))
  if (missing.length > 0) throw new Error(`Missing build output (run pnpm build): ${missing.join(', ')}`)
  execFileSync('zip', ['-q', '-j', resolve(out, `${target}-${version}.zip`), ...files, ...docs])
  for (const build of ['.iife.min.js', '.esm.min.js']) copyFileSync(resolve(dist, target + build), resolve(out, target + build))
}

const nodeFiles = readdirSync(dist, { recursive: true }).map(String).filter(file => !browserBuild.test(file) && /\.(c?js|d\.c?ts|map)$/.test(file))
execFileSync('zip', ['-q', resolve(out, `urlstate-node-${version}.zip`), ...nodeFiles], { cwd: dist })
execFileSync('zip', ['-q', '-j', resolve(out, `urlstate-node-${version}.zip`), resolve(root, 'package.json'), ...docs])
execFileSync('pnpm', ['pack', '--pack-destination', out], { cwd: root, stdio: 'ignore' })

const assets = readdirSync(out).filter(file => file !== 'SHA256SUMS.txt').sort()
const sums = assets.map(file => `${createHash('sha256').update(readFileSync(resolve(out, file))).digest('hex')}  ${file}`)
writeFileSync(resolve(out, 'SHA256SUMS.txt'), sums.join('\n') + '\n')
console.log(`release/: ${assets.length} assets + SHA256SUMS.txt`)
