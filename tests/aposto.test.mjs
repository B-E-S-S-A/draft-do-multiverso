// Testes do Aposto Que Sei: temas bem montados e partidas inteiras só com bots.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/aposto-temas.js')
require('../site/js/aposto-motor.js')
const D = globalThis.DRAFT_DATA
const T = globalThis.ApostoTemas
const M = globalThis.ApostoMotor
const temas = T.todos(D)
const chaves = new Set(D.hq.map((h) => h.key))

for (const t of temas) {
  for (const k of [...t.certos, ...t.ambiguos, ...t.pegadinhas]) assert(chaves.has(k), `${t.id}: ${k} não existe`)
  for (const k of t.pegadinhas) assert(!t.certos.includes(k) && !t.ambiguos.includes(k), `${t.id}: pegadinha ${k} também é certa/ambígua`)
  assert(t.certos.length >= 4, `${t.id}: poucos certos`)
  for (let r = 0; r < 30; r++) {
    const g = T.montar(D, t)
    assert.strictEqual(g.grade.length, 16)
    assert.strictEqual(new Set(g.grade).size, 16, `${t.id}: capa repetida`)
    assert.strictEqual(g.certos.length, g.k, `${t.id}: certos na grade ≠ k`)
    assert(g.grade.every((i) => !t.ambiguos.includes(D.hq[i].key) || t.certos.includes(D.hq[i].key)), `${t.id}: ambíguo na grade`)
  }
}

let rodadas = 0, provou = 0, partidas = 0
for (let g = 0; g < 300; g++) {
  const n = 2 + (g % 6)
  const J = M.novoJogo({ jogadores: Array.from({ length: n }, (_, i) => ({ nome: 'b' + i, bot: true, nivel: 0.4 + Math.random() * 0.5 })), meta: 15, temas, D })
  let passos = 0
  while (J.fase !== 'fim' && passos++ < 5000) {
    if (J.fase === 'lances') { const antes = J.lance ? J.lance.n : 0; M.botVez(J, J.vez); if (J.fase === 'lances') assert(J.lance.n > antes && J.lance.n <= J.tema.k) }
    else if (J.fase === 'prova') { J.prova.comecou = true; if (Math.random() < 0.02) M.tempoAcabou(J); else M.botToque(J, J.prova.j) }
    else if (J.fase === 'resultado') { rodadas++; if (J.resultado.ok) provou++; const total = J.js.reduce((s, p) => s + p.pts, 0); assert(total > 0); M.proximo(J) }
  }
  assert.strictEqual(J.fase, 'fim', 'partida terminou')
  assert(J.js.some((p) => p.pts >= 15))
  partidas++
}
console.log(`ok · ${temas.length} temas · ${partidas} partidas de bots · ${Math.round(rodadas / partidas)} rodadas por partida · provaram ${Math.round(100 * provou / rodadas)}%`)
