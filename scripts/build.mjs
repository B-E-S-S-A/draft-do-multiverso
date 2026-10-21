// Gera site/img/hq.png, site/img/mcu.png e site/data.js a partir do elenco + capas baixadas.
// Uso: node scripts/build.mjs
import { HQ, MCU, WORKS } from './roster.mjs'
import { readFile, writeFile } from 'node:fs/promises'
import { execFileSync } from 'node:child_process'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')
const RAW = path.join(ROOT, 'raw')
const SITE = path.join(ROOT, 'site')
const COLS = 16

const meta = JSON.parse(await readFile(path.join(RAW, 'meta.json'), 'utf8'))

function atlas(name, files, tv) {
  const manifest = path.join(RAW, name + '-manifest.txt')
  const out = path.join(SITE, 'img', name + '.png')
  return writeFile(manifest, files.join('\n')).then(() => {
    const args = ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', path.join(ROOT, 'scripts', 'atlas.ps1'),
      '-Manifest', manifest, '-Out', out, '-Cols', String(COLS)]
    if (tv) args.push('-Tv')
    const kinds = execFileSync('powershell.exe', args, { encoding: 'utf8' }).trim().split(/\r?\n/)
    return { cols: COLS, rows: Math.ceil(files.length / COLS), kinds }
  })
}

// "As Hawkeye: , Tales of Suspense #57 (September 1964) , ..." -> { issue: "Tales of Suspense #57", year: 1964 }
// Fica com a primeira revista que tem número de edição.
function debut(s) {
  if (!s) return {}
  const m = s.match(/([A-Z][^,#]*?#\s?\d+)\s*,?\s*\(([^)]*)\)/)
  if (!m) return {}
  const year = (m[2].match(/\b(19[3-9]\d|20[0-2]\d)\b/) || [])[1]
  let issue = m[1].replace(/\s+/g, ' ').trim()
  if (issue.length > 44) issue = issue.slice(0, 42).replace(/\s+\S*$/, '') + '…'
  return { issue, year: year ? Number(year) : undefined }
}

function creators(s) {
  if (!s) return ''
  const names = s.replace(/\([^)]*\)/g, '').split(/,|\band\b|&/).map((x) => x.trim()).filter((x) => x && !x.endsWith(':'))
  const uniq = [...new Set(names)]
  return uniq.length > 3 ? uniq.slice(0, 3).join(', ') + ' e outros' : uniq.join(', ').replace(/, ([^,]*)$/, ' e $1')
}

// Lacunas que a ficha da Wikipedia não trouxe num formato legível.
const FIX = {
  'spider-gwen': { debut: 'Edge of Spider-Verse #2', year: 2014 },
  namor: { year: 1939 },
  nightcrawler: { debut: 'Giant-Size X-Men #1', year: 1975 },
  psylocke: { debut: 'Captain Britain #8', year: 1976 },
  'x-23': { debut: 'NYX #3', year: 2004 },
  morbius: { by: 'Roy Thomas e Gil Kane' },
  surtur: { debut: 'Journey into Mystery #97', year: 1963, by: 'Stan Lee e Jack Kirby' },
  'captain-britain': { by: 'Chris Claremont e Herb Trimpe' },
  'squirrel-girl': { debut: 'Marvel Super-Heroes #8', year: 1992 },
}

const hqHave = HQ.filter(([key]) => meta.hq[key])
const hqAtlas = await atlas('hq', hqHave.map(([key]) => path.join(RAW, meta.hq[key].file)), false)
// a posição no atlas continua a mesma; só some do jogo quem não virou capa
const hqRows = hqHave.map((r, i) => [...r, i]).filter((r, i) => hqAtlas.kinds[i] !== 'fail')

const workHave = Object.keys(WORKS).filter((wk) => meta.works[wk] && MCU.some((m) => m[3] === wk))
const mcuAtlas = await atlas('mcu', workHave.map((wk) => path.join(RAW, meta.works[wk].file)), true)
const workKeys = workHave.filter((wk, i) => mcuAtlas.kinds[i] !== 'fail')

const data = {
  atlas: {
    hq: { src: 'img/hq.png', cols: hqAtlas.cols, rows: hqAtlas.rows },
    mcu: { src: 'img/mcu.png', cols: mcuAtlas.cols, rows: mcuAtlas.rows },
  },
  works: Object.fromEntries(workKeys.map((wk) => {
    const i = workHave.indexOf(wk)
    const [, t, y, k] = WORKS[wk]
    return [wk, { t, y, k, i, tv: mcuAtlas.kinds[i] === 'tv' }]
  })),
  hq: hqRows.map(([key, n, id, , f, s, i]) => {
    const m = meta.hq[key]
    const d = debut(m.debut)
    return { key, n, id, f, s, i, debut: d.issue || '', year: d.year || null, by: creators(m.creators), ...FIX[key] }
  }),
  mcu: MCU.filter((m) => workKeys.includes(m[3])).map(([key, n, actor, w, f, s]) => ({ key, n, actor, w, f, s })),
}

const missingHQ = HQ.filter(([key]) => !meta.hq[key]).map((r) => r[0])
const missingMCU = MCU.filter((m) => !workKeys.includes(m[3])).map((r) => r[0] + '@' + r[3])
await writeFile(path.join(SITE, 'data.js'), '// Gerado por scripts/build.mjs — não edite à mão.\nwindow.DRAFT_DATA = ' + JSON.stringify(data) + '\n')
console.log(`HQ ${data.hq.length} · MCU ${data.mcu.length} · obras ${workKeys.length}`)
if (missingHQ.length) console.log('HQ sem capa:', missingHQ.join(', '))
if (missingMCU.length) console.log('MCU sem capa:', missingMCU.join(', '))
