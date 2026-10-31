// Testes do Aposto Que Sei: temas bem formados e partidas inteiras só com bots, nos dois modos.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/js/aposto-temas.js')
require('../site/js/aposto-motor.js')
const T = globalThis.ApostoTemas
const M = globalThis.ApostoMotor
const temas = T.todos()

for (const t of temas) {
  const nomes = t.itens.map(([n]) => n)
  assert.strictEqual(new Set(nomes).size, nomes.length, `${t.id}: nome repetido`)
  assert(t.itens.length >= 15, `${t.id}: lista curta demais pra aposta sem limite`)
  assert(t.itens.every(([n, v]) => n.length > 1 && [1, 2, 3].includes(v)), `${t.id}: item estranho`)
}

// truco: correr dá os pontos do nível aceito pro outro lado
{
  const J = M.novoJogo({ jogadores: [{ nome: 'a' }, { nome: 'b' }], truco: true, temas })
  J.vez = 0
  M.apostar(J, 0, 5); M.mandarProvar(J, 1)
  assert.strictEqual(J.fase, 'truco')
  assert(M.truco(J, 0, 'aumentar'))          // a pede TRUCO
  assert(M.truco(J, 1, 'aumentar'))          // b aceita e pede SEIS
  assert(M.truco(J, 0, 'corro'))             // a corre: b leva 5 x 2
  assert.strictEqual(J.js[1].pts, 10)
}

let rodadas = 0, provou = 0, correu = 0
for (const [raridade, truco] of [[true, false], [false, true], [true, true], [false, false]]) {
  for (let g = 0; g < 100; g++) {
    const n = 2 + (g % 6)
    const J = M.novoJogo({ jogadores: Array.from({ length: n }, (_, i) => ({ nome: 'b' + i, bot: true, nivel: 0.3 + Math.random() * 0.6 })), raridade, truco, temas })
    let passos = 0
    while (J.fase !== 'fim' && passos++ < 20000) {
      if (J.fase === 'lances') { const antes = J.lance ? J.lance.n : 0; M.botVez(J, J.vez); if (J.fase === 'lances') assert(J.lance.n > antes) }
      else if (J.fase === 'truco') M.botTruco(J, J.truco.quem)
      else if (J.fase === 'prova') { J.prova.comecou = true; if (Math.random() < 0.01) M.tempoAcabou(J); else M.botFala(J, J.prova.j) }
      else if (J.fase === 'resultado') { rodadas++; if (J.resultado.ok) provou++; if (J.resultado.motivo === 'correu') correu++; M.proximo(J) }
    }
    assert.strictEqual(J.fase, 'fim', `partida (raridade ${raridade}, truco ${truco}) terminou`)
  }
}
console.log(`ok · ${temas.length} temas · 400 partidas de bots · ${Math.round(rodadas / 400)} rodadas por partida · provaram ${Math.round(100 * provou / rodadas)}% · correram ${correu}`)
