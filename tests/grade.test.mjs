// Testes da Grade do Multiverso: categorias bem formadas, grids que sempre têm resposta e partidas inteiras de bot contra bot.
import { createRequire } from 'module'
import assert from 'assert'
const require = createRequire(import.meta.url)
globalThis.window = globalThis
require('../site/data.js')
require('../site/js/impostor-nomes.js')
require('../site/js/grade-dados.js')
require('../site/js/grade-motor.js')
const G = globalThis.GradeDados
const M = globalThis.GradeMotor

// toda chave de categoria é um personagem que existe, e toda categoria tem gente suficiente
const pool = new Set(G.chaves)
for (const c of G.categorias) {
  for (const k of c.m) assert(pool.has(k), `${c.id}: ${k} não existe`)
  assert(c.m.size >= 8, `${c.id}: categoria pequena demais (${c.m.size})`)
  assert(c.pt[0] && c.pt[1] && c.en[0] && c.en[1], `${c.id}: falta texto`)
}
assert.strictEqual(new Set(G.categorias.map((c) => c.id)).size, G.categorias.length, 'id repetido')

// grids sorteados: toda casa tem resposta, e linha e coluna nunca são do mesmo grupo
for (const N of [3, 4, 5]) {
  for (let g = 0; g < 15; g++) {
    const gr = M.sortearGrade(N)
    assert.strictEqual(gr.linhas.length, N)
    assert.strictEqual(new Set([...gr.linhas, ...gr.colunas]).size, 2 * N, 'categoria repetida no grid')
    for (const l of gr.linhas) for (const c of gr.colunas) {
      assert(M.respostas(l, c).length >= 2, `${N}x${N}: ${l} x ${c} sem resposta suficiente`)
      assert.notStrictEqual(G.porId[l].grupo, G.porId[c].grupo, `${l} x ${c}: mesmo grupo`)
    }
  }
}

// jogada certa pega a casa, errada passa a vez, personagem usado não vale de novo (e não perde a vez)
{
  const J = M.novoJogo({ N: 3, jogadores: [{ nome: 'a' }, { nome: 'b' }], comeca: 0 })
  const [l, c] = M.linCol(J, 0)
  const certa = M.respostas(l, c)[0]
  assert(M.jogar(J, 0, 0, certa).ok)
  assert.strictEqual(J.casas[0].dono, 0)
  assert.strictEqual(J.vez, 1)
  assert.strictEqual(M.jogar(J, 0, 1, certa), null, 'fora da vez')
  assert(M.jogar(J, 1, 4, certa).usado, 'já usado')
  assert.strictEqual(J.vez, 1, 'usado não passa a vez')
  const [l4, c4] = M.linCol(J, 4)
  const errada = G.chaves.find((k) => !(M.vale(l4, k) && M.vale(c4, k)) && !J.usados.includes(k))
  const r = M.jogar(J, 1, 4, errada)
  assert(!r.ok && r.falhou.length >= 1)
  assert.strictEqual(J.vez, 0, 'errou passa a vez')
  assert.strictEqual(M.jogar(J, 0, 0, M.respostas(l, c)[1]), null, 'no clássico não rouba')
}

// três em linha ganha
{
  const J = M.novoJogo({ N: 3, jogadores: [{ nome: 'a' }, { nome: 'b' }], comeca: 0 })
  const pega = (j, casa) => { const [l, c] = M.linCol(J, casa); const k = M.respostas(l, c).find((x) => !J.usados.includes(x)); J.vez = j; return M.jogar(J, j, casa, k) }
  pega(0, 0); pega(1, 3); pega(0, 1); pega(1, 4); pega(0, 2)
  assert.strictEqual(J.fase, 'fim')
  assert.strictEqual(J.fim.ganhou, 0)
  assert.deepStrictEqual(J.fim.reta, [0, 1, 2])
}

// partidas inteiras de bot contra bot, nos dois modos e nos três tamanhos
let linha = 0, casas = 0, empate = 0, roubos = 0
for (const roubar of [false, true]) {
  for (const N of [3, 4, 5]) {
    for (let g = 0; g < 25; g++) {
      const J = M.novoJogo({ N, roubar, jogadores: [{ nome: 'a', bot: true }, { nome: 'b', bot: true }], comeca: g % 2 })
      let passos = 0
      while (J.fase === 'jogo' && passos++ < 500) {
        const b = M.botJogada(J, J.vez)
        const r = b.passar ? M.passar(J, J.vez) : M.jogar(J, J.vez, b.casa, b.key)
        assert(r, 'jogada do bot recusada')
        if (r.ok && r.roubou >= 0) roubos++
      }
      assert.strictEqual(J.fase, 'fim', `partida ${N}x${N} (roubar ${roubar}) terminou`)
      if (J.fim.motivo === 'linha') linha++
      else if (J.fim.ganhou < 0) empate++
      else casas++
    }
  }
}
assert(roubos > 0, 'com "pode roubar" os bots roubam')
console.log(`ok · ${G.categorias.length} categorias · 150 partidas de bots · linha ${linha} · nas casas ${casas} · empate ${empate} · roubos ${roubos}`)
