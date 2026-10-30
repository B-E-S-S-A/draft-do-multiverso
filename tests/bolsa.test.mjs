// Testes do motor da Bolsa: partidas inteiras só com bots, conferindo as regras e as contas.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/js/bolsa-dados.js')
require('../site/js/bolsa-motor.js')
const M = globalThis.BolsaMotor
const B = globalThis.BolsaDados
const chaves = Object.keys(B.ACOES)
const acoes = () => chaves.sort(() => Math.random() - 0.5).slice(0, 6).map((key, hq) => ({ key, nome: key, hq }))

// ida e volta não cria dinheiro: comprar e vender de novo (ou o contrário) termina com o mesmo patrimônio
{
  const J = M.novoJogo({ acoes: acoes(), jogadores: [{ nome: 'a' }, { nome: 'b' }], skrull: false })
  J.fase = 'pregao'
  const antes = J.js[0].caixa
  for (let k = 0; k < 5; k++) assert(M.negociar(J, 0, 0, true))
  for (let k = 0; k < 5; k++) assert(M.negociar(J, 0, 0, false))
  assert.strictEqual(J.js[0].caixa, antes)
  for (let k = 0; k < 5; k++) assert(M.negociar(J, 0, 1, false))
  assert(!M.negociar(J, 0, 1, false), 'limite de apostar na queda')
  for (let k = 0; k < 5; k++) assert(M.negociar(J, 0, 1, true))
  assert.strictEqual(J.js[0].caixa, antes)
  assert(!M.negociar({ ...J, fase: 'leitura' }, 0, 0, true), 'não negocia na leitura')
}

// partidas completas com bots
let skrullVenceu = 0, skrullPego = 0, partidas = 0, estalos = 0, mortes = 0
for (let g = 0; g < 400; g++) {
  const n = 3 + (g % 6)
  const J = M.novoJogo({ acoes: acoes(), jogadores: Array.from({ length: n }, (_, i) => ({ nome: 'bot' + i, bot: true })), rodadas: 6 + (g % 3) * 2 })
  assert.strictEqual(J.js.filter((p) => p.skrull).length, 1)
  while (J.fase !== 'fim') {
    for (const p of J.js) {
      if (p.skrull && !p.pego) assert.strictEqual(p.dicas.length, 0)
      else { assert.strictEqual(p.dicas.length, 2); assert.notDeepStrictEqual(p.dicas[0], p.dicas[1]) }
    }
    J.fase = 'pregao'
    for (let t = 0; t < 120; t++) M.botAgir(J, Math.floor(Math.random() * n))
    for (const ac of J.acoes) assert(ac.preco >= 1 && ac.preco <= 99)
    const caixaAntes = J.js.reduce((s, p) => s + p.caixa, 0)
    const jor = M.fechar(J)
    assert.strictEqual(J.js.reduce((s, p) => s + p.caixa, 0), caixaAntes, 'fechar não mexe no caixa')
    jor.itens.forEach((x) => { if (x.a === -2) estalos++; if (/MORRE/.test(x.txt)) mortes++ })
    for (const ac of J.acoes) assert.strictEqual(ac.preco, ac.abre)
    M.proximo(J)
  }
  for (const p of J.js) assert.strictEqual(p.hist.length, J.total + 1)
  const pats = J.js.map((p, j) => M.patrimonio(J, j))
  const sk = J.js.findIndex((p) => p.skrull)
  if (J.js[sk].pego) skrullPego++
  if (pats[sk] === Math.max(...pats)) skrullVenceu++
  partidas++
}
console.log(`ok · ${partidas} partidas de bots · Skrull venceu ${Math.round(100 * skrullVenceu / partidas)}% · pego ${Math.round(100 * skrullPego / partidas)}% · ${estalos} estalos · ${mortes} mortes`)
