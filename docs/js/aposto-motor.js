// Motor do Aposto Que Sei: só regras e pontos, sem tela e sem rede (roda no anfitrião e nos testes).
// Rodada: sai um tema → cada um, na sua vez, aumenta a aposta ("faço 8") ou manda quem apostou mais PROVAR.
// Quem prova fala os nomes em voz alta e os outros (o juiz) marcam na lista oficial. Nome fora da lista = erro.
// Modo Raridade: cada nome vale 1, 2 ou 3 pontos (raro vale mais) e a aposta é em pontos.
// Modo Clássico: cada nome vale 1 e, antes da prova, dá pra pedir TRUCO (vale 2x), SEIS, NOVE e DOZE.
(function (raiz) {
  const TEMPO_LANCE = 20000
  const TEMPO_TRUCO = 15000
  const MULT = [1, 2, 3, 4, 5]
  const GRITO = ['', 'TRUCO', 'SEIS', 'NOVE', 'DOZE']
  let rnd = Math.random

  const valor = (J, item) => (J.modo === 'raridade' ? item.v : 1)
  const tempoProva = (J, n) => Math.min(90000, J.modo === 'raridade' ? 10000 + 2500 * n : 8000 + 4000 * n)

  // jogadores: [{ nome, bot, nivel }]; temas: ApostoTemas.todos()
  function novoJogo({ jogadores, meta, modo = 'raridade', temas, aleatorio }) {
    if (aleatorio) rnd = aleatorio
    const J = { modo, meta: meta || (modo === 'raridade' ? 40 : 20), temas, js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.6, pts: 0, provas: 0, acertou: 0 })),
      abre: Math.floor(rnd() * jogadores.length), rodada: 0, fase: 'lances', usados: [] }
    novaRodada(J)
    return J
  }

  function novaRodada(J) {
    J.rodada += 1
    const livres = J.temas.filter((t) => !J.usados.includes(t.id))
    const tema = livres[Math.floor(rnd() * livres.length)]
    J.usados.push(tema.id)
    if (J.usados.length > J.temas.length - 2) J.usados.shift()
    J.tema = raiz.ApostoTemas.montar(null, tema)
    Object.assign(J, { fase: 'lances', vez: J.abre, lance: null, hist: [], truco: null, prova: null, resultado: null })
    // cada bot "lembra" de alguns nomes (os fáceis com mais chance)
    const chance = [0, 0.75, 0.4, 0.15]
    J.js.forEach((p) => {
      if (!p.bot) return
      const lembra = J.tema.itens.map((it, i) => i).filter((i) => rnd() < chance[J.tema.itens[i].v] * (0.5 + p.nivel))
      p.lembra = lembra.sort(() => rnd() - 0.5).slice(0, 5 + Math.round(p.nivel * 10)) // ninguém lembra de tudo em 1 minuto
    })
  }

  const proxVez = (J, j) => (j + 1) % J.js.length
  const minimo = (J) => (J.lance ? J.lance.n + 1 : 1)

  function apostar(J, j, n) {
    n = Math.floor(Number(n))
    if (J.fase !== 'lances' || J.vez !== j || !(n >= minimo(J)) || n > 99) return false
    J.lance = { n, de: j }
    J.hist.push({ j, n })
    J.vez = proxVez(J, j)
    return true
  }

  function mandarProvar(J, j) {
    if (J.fase !== 'lances' || J.vez !== j || !J.lance || J.lance.de === j) return false
    J.hist.push({ j, prova: true })
    J.prova = { j: J.lance.de, n: J.lance.n, chamou: j, mult: 1, marcados: [], soma: 0, comecou: false, falas: [] }
    if (J.modo === 'classico') { J.fase = 'truco'; J.truco = { nivel: 0, proposta: 0, quem: J.lance.de, gritos: [] } } else J.fase = 'prova'
    return true
  }

  // ---------- truco (só no Clássico) ----------
  // quem vai provar decide primeiro: prova valendo o que está ou pede TRUCO. Quem recebe o pedido aceita, corre ou aumenta.
  const outro = (J, j) => (j === J.prova.j ? J.prova.chamou : J.prova.j)
  function truco(J, j, escolha) {
    const T = J.truco
    if (J.fase !== 'truco' || T.quem !== j) return false
    if (escolha === 'provar' && !T.proposta) { comecarProva(J); return true }
    if (escolha === 'aumentar') {
      const novo = (T.proposta || T.nivel) + 1
      if (novo >= MULT.length) return false
      if (T.proposta) T.nivel = T.proposta // aumentar já aceita o que foi pedido
      T.proposta = novo
      T.gritos.push({ j, grito: GRITO[novo] })
      T.quem = outro(J, j)
      return true
    }
    if (escolha === 'aceito' && T.proposta) { T.nivel = T.proposta; T.proposta = 0; T.gritos.push({ j, grito: 'ACEITO' }); comecarProva(J); return true }
    if (escolha === 'corro' && T.proposta) {
      T.gritos.push({ j, grito: 'CORRO' })
      const ganhou = outro(J, j)
      const pts = J.prova.n * MULT[T.nivel]
      J.js[ganhou].pts += pts
      J.fase = 'resultado'
      J.resultado = { ok: ganhou === J.prova.j, motivo: 'correu', correu: j, j: J.prova.j, chamou: J.prova.chamou, n: J.prova.n, pts, ganhou, soma: 0, faltou: [] }
      return true
    }
    return false
  }
  function comecarProva(J) { J.prova.mult = MULT[J.truco.nivel]; J.fase = 'prova' }

  // ---------- prova ----------
  // pode julgar quem não está provando; se só sobrou bot pra julgar (testando sozinho), quem prova marca os próprios nomes
  const podeJulgar = (J, j) => j !== J.prova.j || J.js.every((p, k) => k === J.prova.j || p.bot)

  function marcar(J, j, i) {
    const P = J.prova
    i = Number(i)
    if (J.fase !== 'prova' || !P.comecou || !podeJulgar(J, j) || !J.tema.itens[i] || P.marcados.includes(i)) return false
    P.marcados.push(i)
    P.soma += valor(J, J.tema.itens[i])
    P.falas.push({ n: J.tema.itens[i].n, v: valor(J, J.tema.itens[i]) })
    if (P.soma >= P.n) encerrar(J, true, 'provou')
    return true
  }
  function desmarcar(J, j) {
    const P = J.prova
    if (J.fase !== 'prova' || !podeJulgar(J, j) || !P.marcados.length) return false
    const i = P.marcados.pop()
    P.soma -= valor(J, J.tema.itens[i])
    P.falas.pop()
    return true
  }
  function errou(J, j, fala) {
    if (J.fase !== 'prova' || !J.prova.comecou || !podeJulgar(J, j)) return false
    if (fala) J.prova.falas.push({ n: fala, v: 0 })
    encerrar(J, false, 'errou')
    return true
  }

  function encerrar(J, ok, motivo) {
    const P = J.prova
    if (J.fase !== 'prova') return
    const ganhou = ok ? P.j : P.chamou
    const pts = P.n * P.mult
    J.js[ganhou].pts += pts
    J.js[P.j].provas += 1
    if (ok) J.js[P.j].acertou += 1
    // o que dava pra ter falado (os mais raros primeiro)
    const faltou = J.tema.itens.map((it, i) => ({ ...it, i })).filter((it) => !P.marcados.includes(it.i)).sort((a, b) => b.v - a.v || a.n.localeCompare(b.n)).slice(0, 10)
    J.fase = 'resultado'
    J.resultado = { ok, motivo, j: P.j, chamou: P.chamou, n: P.n, mult: P.mult, pts, ganhou, soma: P.soma, faltou: faltou.map((it) => ({ n: it.n, v: valor(J, it) })) }
  }

  // o tempo acabou: na aposta, manda provar (ou abre com 1); no truco, aceita/prova; na prova, perdeu
  function tempoAcabou(J) {
    if (J.fase === 'lances') return J.lance ? mandarProvar(J, J.vez) : apostar(J, J.vez, 1)
    if (J.fase === 'truco') return truco(J, J.truco.quem, J.truco.proposta ? 'aceito' : 'provar')
    if (J.fase === 'prova') return encerrar(J, false, 'tempo')
    return false
  }

  function proximo(J) {
    if (J.js.some((p) => p.pts >= J.meta)) { J.fase = 'fim'; return }
    J.abre = proxVez(J, J.abre)
    novaRodada(J)
  }

  // ---------- bots (só pra testar) ----------
  const sabe = (J, j) => J.js[j].lembra.reduce((s, i) => s + valor(J, J.tema.itens[i]), 0)
  function botVez(J, j) {
    const s = sabe(J, j)
    if (!J.lance) return apostar(J, j, Math.max(1, s - 1 - Math.floor(rnd() * 3)))
    if (J.lance.n < s) return apostar(J, j, J.lance.n + 1 + (s - J.lance.n >= 4 && rnd() < 0.3 ? 2 : 0))
    if (rnd() < 0.12) return apostar(J, j, J.lance.n + 1) // blefe
    return mandarProvar(J, j)
  }
  function botTruco(J, j) {
    const T = J.truco
    const provo = j === J.prova.j
    const confiante = sabe(J, J.prova.j) >= J.prova.n + 2
    if (!T.proposta) return truco(J, j, confiante && rnd() < 0.5 ? 'aumentar' : 'provar')
    const r = rnd()
    if (provo) return truco(J, j, confiante ? (r < 0.2 && T.proposta < 4 ? 'aumentar' : 'aceito') : r < 0.5 ? 'aceito' : 'corro')
    return truco(J, j, r < 0.55 ? 'aceito' : r < 0.85 || T.proposta >= 4 ? 'corro' : 'aumentar')
  }
  // o bot "fala" um nome: um que ele lembra (o juiz marca sozinho) ou, se não lembra mais, chuta um que não vale
  function botFala(J, j) {
    const P = J.prova
    const resta = J.js[j].lembra.filter((i) => !P.marcados.includes(i))
    if (resta.length) return marcar(J, -1, resta[0])
    return errou(J, -1, 'um nome que não está na lista')
  }

  raiz.ApostoMotor = { novoJogo, apostar, mandarProvar, truco, marcar, desmarcar, errou, encerrar, tempoAcabou, proximo, podeJulgar, botVez, botTruco, botFala, minimo, valor, tempoProva, TEMPO_LANCE, TEMPO_TRUCO, MULT, GRITO }
})(typeof window !== 'undefined' ? window : globalThis)
