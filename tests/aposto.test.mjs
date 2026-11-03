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

// conferir nome digitado: sem acento, apelido, pedaço do nome e erro pequeno valem; nome de fora não
{
  const t = T.montar(null, temas.find((x) => x.id === 'aranha-viloes'))
  const nome = (txt) => { const i = M.achar(t, txt); return i < 0 ? null : t.itens[i].n }
  assert.strictEqual(nome('venom'), 'Venom')
  assert.strictEqual(nome('escorpiao'), 'Escorpião')
  assert.strictEqual(nome('Hobgoblin'), 'Duende Macabro (Hobgoblin)')
  assert.strictEqual(nome('octopus'), 'Doutor Octopus')
  assert.strictEqual(nome('Electr'), 'Electro')
  assert.strictEqual(nome('Mistério'), 'Mysterio')
  assert.strictEqual(nome('Thanos'), null)
  assert.strictEqual(nome('Viúva Negra'), null)
  // em inglês também vale
  assert.strictEqual(nome('Green Goblin'), 'Duende Verde')
  assert.strictEqual(nome('lizard'), 'Lagarto')
  // todo nome da lista se acha pelo próprio nome completo, nas duas línguas
  for (const tema of temas) {
    assert(tema.en, `${tema.id}: falta o título em inglês`)
    const m = T.montar(null, tema)
    for (const [n, , en] of tema.itens) {
      assert.strictEqual(m.itens[M.achar(m, n)].n, n, `${tema.id}: ${n}`)
      if (en) assert.strictEqual(m.itens[M.achar(m, en)].n, n, `${tema.id}: ${en} (inglês)`)
    }
  }
}

// escrever em vez de falar: nome que vale conta, repetido não conta de novo, nome de fora é erro
{
  const J = M.novoJogo({ jogadores: [{ nome: 'a' }, { nome: 'b' }], truco: false, temas })
  J.vez = 0
  M.apostar(J, 0, 3); M.mandarProvar(J, 1); J.prova.comecou = true
  const um = J.tema.itens[0].n
  assert(M.escreveu(J, 0, um).vale)
  assert(M.escreveu(J, 0, um).repetido)
  assert.strictEqual(J.prova.soma, 1)
  assert.strictEqual(M.escreveu(J, 1, J.tema.itens[1].n), null, 'só quem prova escreve')
  assert.strictEqual(M.escreveu(J, 0, 'Batman').vale, false)
  assert.strictEqual(J.fase, 'resultado')
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
