// Motor do Aposto Que Sei: só regras e pontos, sem tela e sem rede (roda no anfitrião e nos testes).
// Rodada: sai um tema → cada um, na sua vez, aumenta a aposta ("acho 5") ou manda quem apostou mais PROVAR.
// Quem prova toca nos certos numa grade de 16 capas: um erro ou o tempo acabando e quem mandou provar leva os pontos.
(function (raiz) {
  const TEMPO_LANCE = 20000
  const tempoProva = (n) => 8000 + 3000 * n
  let rnd = Math.random

  // jogadores: [{ nome, bot, nivel }]; temas: lista de ApostoTemas; D: a ficha dos personagens
  function novoJogo({ jogadores, meta = 15, temas, D, aleatorio }) {
    if (aleatorio) rnd = aleatorio
    const J = { meta, temas, D, js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.6, pts: 0, provas: 0, acertou: 0 })),
      abre: Math.floor(rnd() * jogadores.length), rodada: 0, fase: 'lances', usados: [], seq: 0 }
    novaRodada(J)
    return J
  }

  function novaRodada(J) {
    J.rodada += 1
    const livres = J.temas.filter((t) => !J.usados.includes(t.id))
    const tema = livres[Math.floor(rnd() * livres.length)]
    J.usados.push(tema.id)
    if (J.usados.length > Math.min(12, J.temas.length - 1)) J.usados.shift()
    J.tema = raiz.ApostoTemas.montar(J.D, tema, rnd)
    J.fase = 'lances'
    J.vez = J.abre
    J.lance = null
    J.hist = []
    J.prova = null
    J.resultado = null
    // cada bot "conhece" alguns dos certos (quanto melhor o nível, mais conhece)
    J.js.forEach((p) => { if (p.bot) p.conhece = J.tema.grade.map((h, pos) => pos).filter((pos) => J.tema.certos.includes(J.tema.grade[pos]) && rnd() < p.nivel) })
  }

  const proxVez = (J, j) => (j + 1) % J.js.length
  const minimo = (J) => (J.lance ? J.lance.n + 1 : 1)

  function apostar(J, j, n) {
    n = Math.floor(Number(n))
    if (J.fase !== 'lances' || J.vez !== j || !(n >= minimo(J)) || n > J.tema.k) return false
    J.lance = { n, de: j }
    J.hist.push({ j, n })
    J.vez = proxVez(J, j)
    return true
  }

  function mandarProvar(J, j) {
    if (J.fase !== 'lances' || J.vez !== j || !J.lance || J.lance.de === j) return false
    J.hist.push({ j, prova: true })
    J.fase = 'prova'
    J.prova = { j: J.lance.de, n: J.lance.n, chamou: j, tocados: [], acertos: 0, comecou: false }
    return true
  }

  function tocar(J, j, pos) {
    const P = J.prova
    pos = Number(pos)
    if (J.fase !== 'prova' || !P.comecou || P.j !== j || !(pos >= 0 && pos < J.tema.grade.length) || P.tocados.some((t) => t.pos === pos)) return null
    const ok = J.tema.certos.includes(J.tema.grade[pos])
    P.tocados.push({ pos, ok })
    if (ok) P.acertos += 1
    if (!ok) encerrar(J, false, 'errou')
    else if (P.acertos >= P.n) encerrar(J, true, 'provou')
    return { ok }
  }

  function encerrar(J, ok, motivo) {
    const P = J.prova
    if (J.fase !== 'prova') return
    const quem = ok ? P.j : P.chamou
    J.js[quem].pts += P.n
    J.js[P.j].provas += 1
    if (ok) J.js[P.j].acertou += 1
    J.fase = 'resultado'
    J.resultado = { ok, motivo, j: P.j, chamou: P.chamou, n: P.n, acertos: P.acertos, ganhou: quem }
  }

  // o tempo da vez acabou: se já tem aposta, manda provar; se não, abre com 1
  function tempoAcabou(J) {
    if (J.fase === 'lances') return J.lance ? mandarProvar(J, J.vez) : apostar(J, J.vez, 1)
    if (J.fase === 'prova') return encerrar(J, false, 'tempo')
    return false
  }

  function proximo(J) {
    if (J.js.some((p) => p.pts >= J.meta)) { J.fase = 'fim'; return }
    J.abre = proxVez(J, J.abre)
    novaRodada(J)
  }

  // ---------- bots (só pra testar) ----------
  function botVez(J, j) {
    const p = J.js[j]
    const sabe = p.conhece.length
    if (!J.lance) return apostar(J, j, Math.max(1, Math.min(J.tema.k, sabe - (rnd() < 0.5 ? 1 : 0))))
    if (J.lance.n < sabe) return apostar(J, j, J.lance.n + (sabe - J.lance.n >= 3 && rnd() < 0.3 ? 2 : 1))
    if (J.lance.n < J.tema.k && rnd() < 0.12) return apostar(J, j, J.lance.n + 1) // blefe
    return mandarProvar(J, j)
  }
  function botToque(J, j) {
    const P = J.prova
    const livre = (pos) => !P.tocados.some((t) => t.pos === pos)
    const sei = J.js[j].conhece.filter(livre)
    if (sei.length) return tocar(J, j, sei[0])
    const resto = J.tema.grade.map((h, pos) => pos).filter(livre)
    return tocar(J, j, resto[Math.floor(rnd() * resto.length)]) // chute
  }

  raiz.ApostoMotor = { novoJogo, apostar, mandarProvar, tocar, encerrar, tempoAcabou, proximo, botVez, botToque, minimo, TEMPO_LANCE, tempoProva }
})(typeof window !== 'undefined' ? window : globalThis)
