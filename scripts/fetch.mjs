// Busca capa (imagem principal), estreia e criadores na Wikipedia.
// Uso: node scripts/fetch.mjs [--only chave1,chave2]
import { HQ, MCU, WORKS } from './roster.mjs'
import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/(\w:)/, '$1')), '..')
const RAW = path.join(ROOT, 'raw')
const UA = 'MultiversoDraft/1.0 (personal fan project; contact via en.wikipedia talk)'
const API = 'https://en.wikipedia.org/w/api.php'

const onlyArg = process.argv.indexOf('--only')
const ONLY = onlyArg > 0 ? new Set(process.argv[onlyArg + 1].split(',')) : null
const FORCE = process.argv.includes('--force')

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))

async function getOK(url) {
  for (let i = 0; i < 6; i++) {
    const res = await fetch(url, { headers: { 'User-Agent': UA } })
    if (res.ok) return res
    const wait = Number(res.headers.get('retry-after')) || 0
    await sleep(Math.max(wait * 1000, 2000 * 2 ** i))
  }
  throw new Error('falhou ' + url)
}
const getJSON = async (url) => (await getOK(url)).json()

async function page(title) {
  const q = new URLSearchParams({
    action: 'query', format: 'json', formatversion: '2', redirects: '1',
    prop: 'pageimages|revisions|pageprops', piprop: 'thumbnail|name', pithumbsize: '400',
    pilicense: 'any', rvprop: 'content', rvslots: 'main', titles: title,
  })
  const j = await getJSON(API + '?' + q)
  const p = j.query.pages[0]
  if (p.missing) return { missing: true }
  return {
    resolved: p.title,
    disambig: !!(p.pageprops && 'disambiguation' in p.pageprops),
    thumb: p.thumbnail ? p.thumbnail.source : null,
    imageName: p.pageimage || null,
    wikitext: p.revisions ? p.revisions[0].slots.main.content : '',
  }
}

function clean(s) {
  return s
    .replace(/<ref[^>]*\/>/g, '')
    .replace(/<ref[^>]*>[\s\S]*?<\/ref>/g, '')
    .replace(/<ref[^>]*>.*$/gm, '')
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<br\s*\/?>/gi, ', ')
    .replace(/\[\[(?:[^|\]]*\|)?([^\]]*)\]\]/g, '$1')
    .replace(/\{\{\s*(?:ubl|unbulleted list|plainlist|plain list|flatlist|hlist|nowrap|nobr)\s*\|([^{}]*)\}\}/gi, (_, x) => x.replace(/\|/g, ', '))
    .replace(/\{\{\s*(?:plainlist|plain list|flatlist)\s*\|?/gi, '')
    .replace(/\}\}/g, '')
    .replace(/\{\{[^{}]*$/g, '')
    .replace(/^\s*\*\s*/gm, ', ')
    .replace(/'{2,}/g, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/(,\s*)+/g, ', ')
    .replace(/^[,\s]+|[,\s]+$/g, '')
    .trim()
}

function field(wt, name) {
  const re = new RegExp('\\|\\s*' + name + '\\s*=([\\s\\S]*?)\\n\\s*\\|\\s*[a-z_ ]+\\s*=', 'i')
  const m = wt.match(re)
  return m ? clean(m[1]) : ''
}

async function download(url, dest) {
  const res = await getOK(url)
  await writeFile(dest, Buffer.from(await res.arrayBuffer()))
}

function extOf(url) {
  const m = url.toLowerCase().match(/\.(jpe?g|png|gif|webp)(?:$|\?)/)
  return m ? m[1].replace('jpeg', 'jpg') : 'jpg'
}

async function main() {
  await mkdir(path.join(RAW, 'img', 'hq'), { recursive: true })
  await mkdir(path.join(RAW, 'img', 'mcu'), { recursive: true })
  const metaPath = path.join(RAW, 'meta.json')
  const meta = existsSync(metaPath) ? JSON.parse(await readFile(metaPath, 'utf8')) : { hq: {}, works: {} }
  const problems = []

  const jobs = []
  const want = (kind, key) => (ONLY ? ONLY.has(key) : FORCE || !meta[kind][key])
  for (const [key, , , title] of HQ) if (want('hq', key)) jobs.push(['hq', key, title])
  const usedWorks = new Set(MCU.map((m) => m[3]))
  for (const [wk, w] of Object.entries(WORKS)) if (usedWorks.has(wk) && want('works', wk)) jobs.push(['works', wk, w[0]])

  let i = 0
  async function worker() {
    while (i < jobs.length) {
      const [kind, key, title] = jobs[i++]
      try {
        const p = await page(title)
        if (p.missing) { problems.push(`${key}: página não existe (${title})`); continue }
        if (p.disambig) problems.push(`${key}: desambiguação (${p.resolved})`)
        if (!p.thumb) { problems.push(`${key}: sem imagem (${p.resolved})`); continue }
        const file = path.join('img', kind === 'hq' ? 'hq' : 'mcu', key + '.' + extOf(p.thumb))
        await download(p.thumb, path.join(RAW, file))
        const entry = { title, resolved: p.resolved, thumb: p.thumb, image: p.imageName, file }
        if (kind === 'hq') {
          entry.debut = field(p.wikitext, 'debut')
          entry.creators = field(p.wikitext, 'creators')
        }
        meta[kind][key] = entry
        process.stdout.write('.')
      } catch (e) {
        problems.push(`${key}: ${e.message}`)
      }
      await sleep(700)
    }
  }
  await worker()
  await writeFile(metaPath, JSON.stringify(meta, null, 1))
  console.log(`\n${jobs.length} buscas, ${problems.length} problemas`)
  for (const p of problems) console.log(' - ' + p)
}

main()
