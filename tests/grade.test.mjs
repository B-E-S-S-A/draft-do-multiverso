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

// grids sorteados (quadrados e retangulares): toda casa tem resposta, e linha e coluna nunca são do mesmo grupo
for (const [L, C] of [[3, 3], [4, 4], [5, 5], [5, 4], [2, 6], [6, 5], [3, 5]]) {
  for (let g = 0; g < 8; g++) {
    const gr = M.sortearGrade(L, C)
    assert.strictEqual(gr.linhas.length, L)
    assert.strictEqual(gr.colunas.length, C)
    assert.strictEqual(new Set([...gr.linhas, ...gr.colunas]).size, L + C, 'categoria repetida no grid')
    for (const l of gr.linhas) for (const c of gr.colunas) {
      // sempre mais de um personagem possível por casa (até 24 casas, pelo menos 3)
      assert(M.respostas(l, c).length >= (L * C > 24 ? 2 : 3), `${L}x${C}: ${l} x ${c} sem resposta suficiente`)
      assert.notStrictEqual(G.porId[l].grupo, G.porId[c].grupo, `${l} x ${c}: mesmo grupo`)
    }
  }
}

// toda categoria tem referência (hq, tela, ambos) e dificuldade de 1 a 9; as listas "só nas telas" são de gente que existe
for (const c of G.categorias) {
  assert(['hq', 'tela', 'ambos'].includes(c.ref), `${c.id}: sem referência`)
  assert(Number.isInteger(c.d) && c.d >= 1 && c.d <= 9, `${c.id}: dificuldade fora de 1-9`)
  if (c.tela) { for (const k of c.tela.m) assert(pool.has(k), `${c.id} (telas): ${k} não existe`); assert(c.tela.m.size >= 8, `${c.id} (telas): pequena demais`) }
}
for (const k of G.TELA) assert(pool.has(k), `TELA: ${k} não existe`)
assert(!G.categoriasDa('hq').some((c) => c.ref === 'tela'), 'só HQ sem tema de filme')
assert(!G.categoriasDa('tela').some((c) => c.ref === 'hq'), 'só telas sem tema de HQ')
assert.strictEqual(G.categoriasDa('ambos').length, G.categorias.length)

// as três versões em vários níveis: toda casa com resposta, só temas e personagens da versão, e o nível mexe na dificuldade
const media = (gr, v) => { let s = 0; for (const l of gr.linhas) for (const c of gr.colunas) s += M.difCasa(G.porId[l], G.porId[c], M.respostas(l, c, v).length); return s / (gr.linhas.length * gr.colunas.length) }
for (const versao of ['hq', 'ambos', 'tela']) {
  const temas = new Set(G.categoriasDa(versao).map((c) => c.id))
  const gente = new Set(G.poolDa(versao))
  const dif = {}
  for (const nivel of [1, 5, 9]) {
    dif[nivel] = 0
    for (const [L, C] of [[3, 3], [4, 4], [5, 5], [6, 5]]) {
      for (let g = 0; g < 2; g++) {
        const gr = M.sortearGrade(L, C, Math.random, { versao, nivel })
        assert.strictEqual(new Set([...gr.linhas, ...gr.colunas]).size, L + C, 'categoria repetida no grid')
        for (const l of gr.linhas) for (const c of gr.colunas) {
          assert(temas.has(l) && temas.has(c), `${versao}: tema de fora da versão (${l} / ${c})`)
          const r = M.respostas(l, c, versao)
          assert(r.length >= (L * C > 24 ? 2 : 3), `${versao} nível ${nivel} ${L}x${C}: ${l} x ${c} só tem ${r.length}`)
          assert(r.every((k) => gente.has(k)), `${versao}: resposta de fora da versão`)
        }
        if (L === 4) dif[nivel] += media(gr, versao) / 2
      }
    }
  }
  assert(dif[1] < dif[5] && dif[5] < dif[9], `${versao}: o nível não deixa mais difícil (${dif[1].toFixed(1)} ${dif[5].toFixed(1)} ${dif[9].toFixed(1)})`)
}
// no "só filmes e séries", quem nunca apareceu nas telas não vale
{
  const fora = G.chaves.find((k) => !G.TELA.has(k) && G.porId.mulher.m.has(k))
  if (fora) assert(!G.poolDa('tela').includes(fora))
}

// tamanho sempre jogável: no máximo 30 casas e "em linha" entre 2 e o maior lado
assert.deepStrictEqual(M.medidas({ L: 9, C: 9, K: 9 }), { L: 5, C: 6, K: 6 })
assert.deepStrictEqual(M.medidas({ L: 5, C: 4 }), { L: 5, C: 4, K: 4 })
// sequências num 5x4 com 4 seguidas: 2 por linha de lado, 2 por coluna, e as diagonais que cabem
assert.strictEqual(M.retas(5, 4, 4).length, 5 * 1 + 4 * 2 + 2 * 2)

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

// num 5x4 valendo 4 seguidas, quatro de lado numa linha ganham
{
  const J = M.novoJogo({ L: 5, C: 4, K: 4, jogadores: [{ nome: 'a' }, { nome: 'b' }], comeca: 0 })
  const pega = (j, casa) => { const [l, c] = M.linCol(J, casa); const k = M.respostas(l, c).find((x) => !J.usados.includes(x)); J.vez = j; return M.jogar(J, j, casa, k) }
  pega(0, 4); pega(0, 5); pega(0, 6); assert.strictEqual(J.fase, 'jogo'); pega(0, 7)
  assert.strictEqual(J.fase, 'fim')
  assert.deepStrictEqual(J.fim.reta, [4, 5, 6, 7])
}

// partidas inteiras de bot contra bot, nos dois modos e nos três tamanhos
let linha = 0, casas = 0, empate = 0, roubos = 0
for (const roubar of [false, true]) {
  for (const [L, C, K] of [[3, 3, 3], [4, 4, 4], [5, 5, 5], [5, 4, 4], [6, 5, 4], [2, 5, 3]]) {
    for (let g = 0; g < 12; g++) {
      const versao = ['hq', 'ambos', 'tela'][g % 3]
      const J = M.novoJogo({ L, C, K, roubar, versao, nivel: 1 + (g % 9), jogadores: [{ nome: 'a', bot: true, nivel: 0.7 }, { nome: 'b', bot: true, nivel: 0.7 }], comeca: g % 2 })
      let passos = 0
      while (J.fase === 'jogo' && passos++ < 500) {
        const b = M.botJogada(J, J.vez)
        const r = b.passar ? M.passar(J, J.vez) : M.jogar(J, J.vez, b.casa, b.key)
        assert(r, 'jogada do bot recusada')
        if (r.ok && r.roubou >= 0) roubos++
      }
      assert.strictEqual(J.fase, 'fim', `partida ${L}x${C} (roubar ${roubar}) terminou`)
      if (J.fim.motivo === 'linha') linha++
      else if (J.fim.ganhou < 0) empate++
      else casas++
    }
  }
}
assert(roubos > 0, 'com "pode roubar" os bots roubam')
console.log(`ok · ${G.categorias.length} categorias · 144 partidas de bots · linha ${linha} · nas casas ${casas} · empate ${empate} · roubos ${roubos}`)
