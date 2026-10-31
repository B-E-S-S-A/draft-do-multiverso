// Testes das Minas do Multiverso: plantio, BOOM, dúvida, Aquele Acima de Todos e partidas inteiras só com bots.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/js/aposto-temas.js')
require('../site/js/aposto-motor.js')
require('../site/js/minas-motor.js')
const M = globalThis.MinasMotor
const temas = globalThis.ApostoTemas.todos()

// plantio: só vale nome do tema, sem repetir; depois de todos plantarem começa o duelo
{
  const J = M.novoJogo({ jogadores: [{ nome: 'a' }, { nome: 'b' }, { nome: 'c' }], temas })
  assert.strictEqual(J.fase, 'plantar')
  const um = J.tema.itens[0].n
  assert(!M.plantar(J, 0, 'nome que não existe de jeito nenhum').ok)
  assert(M.plantar(J, 0, um).ok)
  assert.strictEqual(M.plantar(J, 0, um).motivo, 'repetida')
  assert(M.plantar(J, 0, J.tema.itens[1].n).ok)
  M.tempoPlantio(J)
  assert.strictEqual(J.fase, 'duelo')
  assert(J.js.every((p) => p.minas.length === 2))
  // quem fala é o primeiro do par; BOOM de uma mina de outra pessoa tira vida de quem falou e dá vida pro dono
  const [x, y] = J.par
  const dono = [0, 1, 2].find((k) => k !== x)
  assert(M.falei(J, x))
  assert(!M.boom(J, x, 0, J.seq), 'não dá BOOM na própria fala')
  assert(M.boom(J, dono, 0, J.seq))
  assert.strictEqual(J.js[x].vidas, 2)
  assert.strictEqual(J.js[dono].vidas, Math.min(5, 4))
  assert.strictEqual(J.fase, 'resultado')
  assert.strictEqual(J.evento.tipo, 'boom')
  assert(y >= 0)
}

// dúvida: nome que não vale tira vida de quem falou; nome que vale tira de quem duvidou
{
  const J = M.novoJogo({ jogadores: [{ nome: 'a' }, { nome: 'b' }], temas })
  M.tempoPlantio(J)
  const [x, y] = J.par
  M.falei(J, x)
  M.duvidar(J, y, 'Batman')
  assert.strictEqual(J.js[x].vidas, 2)
  M.proximo(J); M.tempoPlantio(J)
  const [p, q] = J.par
  M.falei(J, p)
  M.duvidar(J, q, J.tema.itens[0].n)
  assert.strictEqual(J.evento.vale, true)
  assert.strictEqual(J.evento.vitima, q)
}

// Aquele Acima de Todos: a primeira pessoa que zeraria volta com 1 vida e o resto do jogo vale dobrado
{
  const J = M.novoJogo({ jogadores: [{ nome: 'a' }, { nome: 'b' }], vidas: 1, temas })
  M.tempoPlantio(J)
  M.tempoVez(J)
  assert.strictEqual(J.fase, 'toaa')
  assert.strictEqual(J.dobro, true)
  assert.strictEqual(J.js[J.evento.toaa].vidas, 1)
}

let partidas = 0, toaa = 0, rodadas = 0
for (let g = 0; g < 300; g++) {
  const n = 2 + (g % 6)
  const J = M.novoJogo({ jogadores: Array.from({ length: n }, (_, i) => ({ nome: 'b' + i, bot: true })), temas })
  let passos = 0
  while (J.fase !== 'fim' && passos++ < 5000) {
    if (J.fase === 'plantar') M.tempoPlantio(J)
    else if (J.fase === 'duelo') { if (Math.random() < 0.05) M.tempoVez(J); else M.botFala(J, M.falando(J)) }
    else { rodadas++; if (J.fase === 'toaa') toaa++; M.proximo(J) }
  }
  assert.strictEqual(J.fase, 'fim', 'partida terminou')
  assert.strictEqual(M.vivos(J).length, 1)
  partidas++
}
console.log(`ok · ${partidas} partidas de bots · ${Math.round(rodadas / partidas)} duelos por partida · Aquele Acima de Todos apareceu em ${Math.round(100 * toaa / partidas)}%`)
