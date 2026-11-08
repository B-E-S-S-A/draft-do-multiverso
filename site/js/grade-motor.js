// Grade do Multiverso: o jogo em si, sem tela. Testável no node (tests/grade.test.mjs).
// Um grid de L linhas x C colunas: cada linha e cada coluna tem uma categoria. Na sua vez você escolhe uma casa e diz
// um personagem que vale nas duas. Acertou, a casa é sua (com a capa do personagem). Errou, passa a vez.
// Cada personagem só vale uma vez. Ganha quem fechar K casas seguidas (de lado, de cima pra baixo ou na diagonal).
// Se ninguém conseguir, ganha quem tiver mais casas. Com "pode roubar", dá pra tomar a casa do outro dizendo outro
// personagem que também vale ali.
// Versões: 'hq' (temas de quadrinhos), 'tela' (só filmes e séries) ou 'ambos'. Nível de 1 a 9 (Fácil = 2, Médio = 6, Difícil = 9):
// o grid sai quase todo no nível escolhido, com algumas casas um pouco mais difíceis, pra nenhuma linha ficar fácil demais.
(function (raiz) {
  const G = () => raiz.GradeDados
  const MIN_RESPOSTAS = 3   // toda casa sorteada tem pelo menos isso de respostas certas (grid pequeno: 4)
  const SEM_JOGAR = 10      // tantas vezes seguidas sem ninguém pegar casa: acaba empatado
  const TAM = { min: 2, max: 6, casas: 30 }

  const cat = (id) => G().porId[id]
  // vale: o personagem cumpre a categoria (na versão "só telas", algumas categorias contam só o que aconteceu nas telas)
  const vale = (id, key, versao) => G().membros(cat(id), versao).has(key)
  // respostas: quem vale nas duas, entre os personagens da versão
  const cacheResp = new Map()
  function respostas(lin, col, versao = 'ambos') {
    const chave = lin + '|' + col + '|' + versao
    if (!cacheResp.has(chave)) cacheResp.set(chave, G().poolDa(versao).filter((k) => vale(lin, k, versao) && vale(col, k, versao)))
    return cacheResp.get(chave)
  }

  function embaralha(a, rnd) {
    for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] }
    return a
  }

  // tamanho e "em linha" sempre dentro do que dá pra jogar
  function medidas({ L = 3, C = 3, K } = {}) {
    L = Math.min(TAM.max, Math.max(TAM.min, Math.round(L) || 3))
    C = Math.min(TAM.max, Math.max(TAM.min, Math.round(C) || 3))
    while (L * C > TAM.casas) { if (L >= C) L--; else C-- }
    K = Math.min(Math.max(L, C), Math.max(2, Math.round(K) || Math.min(L, C)))
    return { L, C, K }
  }

  // ---------- o sorteio do grid, por versão e nível ----------
  // a dificuldade de uma casa: a média das duas categorias, e pesa muito quanta gente vale ali (com 40 respostas qualquer
  // chute acerta; com 4, tem que saber). 8 respostas não muda nada; cada vez que dobra fica bem mais fácil, e vice-versa.
  function difCasa(l, c, n) { return (l.d + c.d) / 2 + 1.3 * (3 - Math.log2(Math.max(1, n))) }
  // no Médio e no Difícil, nenhuma casa pode ter gente demais valendo (do nível 4 em diante: 11, 10, 8, 7, 6, 5 respostas no máximo)
  const maxRespostas = (nivel) => (nivel <= 3 ? Infinity : Math.max(5, Math.round(15 - nivel * 1.1)))
  // o nível (1 a 9) vira a dificuldade média que as casas devem ter, dentro do que cada versão consegue fazer com resposta
  // garantida em toda casa (a versão "só filmes e séries" tem menos tema difícil, então o teto dela é mais baixo)
  const FAIXA = { hq: [2.0, 5.0], ambos: [2.0, 5.2], tela: [2.0, 4.4] }
  const alvoCasa = (nivel, versao = 'ambos') => { const [lo, hi] = FAIXA[G().versao(versao)]; return lo + ((nivel - 1) / 8) * (hi - lo) }
  // sorteia n categorias com peso (sem repetir as que já saíram)
  function sorteiaComPeso(pool, n, peso, fora, rnd) {
    const sobra = pool.filter((c) => !fora.includes(c)).map((c) => ({ c, p: peso(c) }))
    const escolha = []
    while (escolha.length < n && sobra.length) {
      let r = rnd() * sobra.reduce((a, x) => a + x.p, 0)
      let i = 0
      while (i < sobra.length - 1 && (r -= sobra[i].p) > 0) i++
      escolha.push(sobra.splice(i, 1)[0].c)
    }
    return escolha
  }
  // um lado do grid traz os temas do nível; o outro, temas mais amplos (com muita gente), um pouco abaixo do nível.
  // É o cruzamento de um tema difícil com um amplo que faz casa difícil que ainda tem resposta.
  const perto = (d, centro) => 0.12 + Math.exp(-((d - centro) ** 2) / (2 * 1.6 * 1.6))
  function sorteiaCategorias(pool, nA, nB, nivel, versao, rnd) {
    const tamanho = (c) => G().membros(c, versao).size
    const a = sorteiaComPeso(pool, nA, (c) => perto(c.d, nivel), [], rnd)
    const b = sorteiaComPeso(pool, nB, (c) => perto(c.d, Math.max(1, nivel - 2)) * Math.pow(tamanho(c) / 40, 0.8), a, rnd)
    return [a, b]
  }
  // L linhas x C colunas. Regras, da mais importante pra menos:
  //  1. toda casa com respostas suficientes (4 em grid de até 20 casas, 3 nos maiores);
  //  1b. no Médio e no Difícil, nenhuma casa com gente demais valendo;
  //  2. nenhuma linha nem coluna toda fácil: em cada uma pelo menos uma casa um pouco acima do nível;
  //  3. nenhuma casa absurda pro nível;
  //  4. a dificuldade média das casas perto do nível.
  // Primeiro sorteia vários grids e fica com o melhor; depois vai trocando um tema de cada vez enquanto não piora.
  function sortearGrade(L, C, rnd = Math.random, opcoes = {}) {
    if (C === undefined || typeof C === 'function') { rnd = C || rnd; C = L } // sortearGrade(N) = N x N
    if (typeof rnd !== 'function') { opcoes = rnd || {}; rnd = Math.random }
    const versao = G().versao(opcoes.versao)
    const nivel = Math.min(9, Math.max(1, Math.round(opcoes.nivel) || 3))
    const alvo = opcoes.alvo || alvoCasa(nivel, versao)
    const pool = G().categoriasDa(versao)
    const quer = MIN_RESPOSTAS + (L * C <= 20 ? 1 : 0)
    const teto = maxRespostas(nivel)
    const melhorQue = (a, b) => { for (let k = 0; k < a.length; k++) { if (a[k] !== b[k]) return a[k] < b[k] } return false }
    // grupos repetidos no mesmo lado tudo bem; o que não pode é linha x coluna do mesmo grupo
    const cruzaGrupo = (linhas, colunas) => linhas.some((l) => colunas.some((c) => l.grupo === c.grupo))
    // o que falta pra cumprir cada regra, na ordem de importância
    function nota(linhas, colunas) {
      let pior = Infinity
      let soma = 0
      let absurdas = 0
      let demais = 0
      const difs = linhas.map((l) => colunas.map((c) => {
        const n = respostas(l.id, c.id, versao).length
        pior = Math.min(pior, n)
        if (n > teto) demais++
        const d = difCasa(l, c, n)
        soma += d
        if (d > alvo + 3) absurdas++
        return d
      }))
      const desafio = alvo + 0.7
      const facil = difs.filter((linha) => !linha.some((d) => d >= desafio)).length + colunas.filter((_, k) => !difs.some((linha) => linha[k] >= desafio)).length
      return [Math.max(0, quer - pior), demais, facil, absurdas, Math.round(Math.abs(soma / (L * C) - alvo) * 10)]
    }
    const pronto = (n) => !n[0] && !n[1] && !n[2] && !n[3] && n[4] <= 2
    let melhor = null
    const guarda = (linhas, colunas, n) => { if (!melhor || melhorQue(n, melhor.nota)) melhor = { nota: n, linhas, colunas } }
    for (let t = 0; t < 1200 && !(melhor && pronto(melhor.nota)); t++) {
      // qual lado fica com os temas do nível muda a cada tentativa
      const deitado = rnd() < 0.5
      const [a, b] = sorteiaCategorias(pool, deitado ? L : C, deitado ? C : L, nivel, versao, rnd)
      if (a.length + b.length < L + C) continue
      const linhas = embaralha(deitado ? a : b, rnd)
      const colunas = embaralha(deitado ? b : a, rnd)
      if (cruzaGrupo(linhas, colunas)) continue
      guarda(linhas, colunas, nota(linhas, colunas))
    }
    if (!melhor) return sortearGrade(L, C, rnd, { versao, nivel: Math.max(1, nivel - 1) })
    // ajuste fino: troca um tema por outro que não está no grid e fica com a troca se não piorou
    let lin = melhor.linhas
    let col = melhor.colunas
    let atual = melhor.nota
    for (let t = 0; t < 2500 && !pronto(melhor.nota); t++) {
      const naLinha = rnd() < L / (L + C)
      const lado = naLinha ? [...lin] : [...col]
      const fora = pool.filter((c) => !lin.includes(c) && !col.includes(c))
      lado[Math.floor(rnd() * lado.length)] = fora[Math.floor(rnd() * fora.length)]
      const nl = naLinha ? lado : lin
      const nc = naLinha ? col : lado
      if (cruzaGrupo(nl, nc)) continue
      const n = nota(nl, nc)
      if (melhorQue(atual, n)) continue
      lin = nl; col = nc; atual = n
      guarda(lin, col, n)
    }
    // não achou grid com resposta suficiente em toda casa (acontece nos grids gigantes bem difíceis): desce um subnível
    if (melhor.nota[0] >= 2 && nivel > 1 && !opcoes.alvo) return sortearGrade(L, C, rnd, { versao, nivel: nivel - 1 })
    return { linhas: melhor.linhas.map((c) => c.id), colunas: melhor.colunas.map((c) => c.id) }
  }

  // todas as sequências que ganham: K casas seguidas de lado, de cima pra baixo e nas duas diagonais
  function retas(L, C, K) {
    if (C === undefined) { C = L; K = L } // retas(N) = N x N, N em linha
    const r = []
    const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
    for (let y = 0; y < L; y++) for (let x = 0; x < C; x++) for (const [dy, dx] of dirs) {
      const fimY = y + dy * (K - 1)
      const fimX = x + dx * (K - 1)
      if (fimY < 0 || fimY >= L || fimX < 0 || fimX >= C) continue
      r.push(Array.from({ length: K }, (_, k) => (y + dy * k) * C + (x + dx * k)))
    }
    return r
  }

  function novoJogo({ L, C, K, N, roubar = false, versao, nivel = 3, jogadores, comeca = 0, grade, aleatorio }) {
    const rnd = aleatorio || Math.random
    const m = medidas(N ? { L: N, C: N, K: K || N } : { L, C, K })
    versao = G().versao(versao)
    nivel = Math.min(9, Math.max(1, Math.round(nivel) || 3))
    const g = grade || sortearGrade(m.L, m.C, rnd, { versao, nivel })
    return {
      L: m.L, C: m.C, K: m.K, roubar: !!roubar, versao, nivel, linhas: g.linhas, colunas: g.colunas, casas: Array(m.L * m.C).fill(null), usados: [],
      js: jogadores.map((p) => ({ nome: p.nome, bot: !!p.bot, nivel: p.nivel || 0.75 })),
      vez: comeca, fase: 'jogo', ultimo: null, seq: 0, semJogar: 0, fim: null,
    }
  }

  const linCol = (J, casa) => [J.linhas[Math.floor(casa / J.C)], J.colunas[casa % J.C]]
  const contaCasas = (J, j) => J.casas.filter((c) => c && c.dono === j).length
  // a casa está aberta pra j? (vazia, ou do outro se pode roubar)
  const aberta = (J, j, casa) => !J.casas[casa] || (J.roubar && J.casas[casa].dono !== j)
  // ainda tem resposta que ninguém usou pra essa casa?
  const sobra = (J, casa) => { const [l, c] = linCol(J, casa); return respostas(l, c, J.versao).filter((k) => !J.usados.includes(k)) }
  const podeJogar = (J, j) => J.casas.some((_, i) => aberta(J, j, i) && sobra(J, i).length > 0)
  const retaDe = (J, j) => retas(J.L, J.C, J.K).find((r) => r.every((i) => J.casas[i] && J.casas[i].dono === j))
  // ainda dá pra j fechar alguma sequência? Cada casa da reta tem que ser de j ou dar pra pegar (vazia, ou do outro se pode
  // roubar) com alguém que ainda vale ali
  const daPraFechar = (J, j) => retas(J.L, J.C, J.K).some((r) => r.every((i) => (J.casas[i] && J.casas[i].dono === j) || (aberta(J, j, i) && sobra(J, i).length > 0)))

  function proximaVez(J) {
    if (J.fase !== 'jogo') return
    J.vez = 1 - J.vez
    if (!daPraFechar(J, 0) && !daPraFechar(J, 1)) empatar(J, 'travou')
    else if (J.semJogar >= SEM_JOGAR || (!podeJogar(J, 0) && !podeJogar(J, 1))) empatar(J, 'parou')
  }

  // ninguém fez a sequência: empate (travou = não dá mais pra ninguém fechar; parou = ninguém pegou casa por muito tempo)
  function empatar(J, motivo) {
    J.fase = 'fim'
    J.fim = { motivo, ganhou: -1, casas: [contaCasas(J, 0), contaCasas(J, 1)] }
  }

  // depois de pegar uma casa: fechou a linha? senão, próxima vez (que vê se ainda dá pra alguém fechar)
  function depoisDePegar(J, j) {
    const reta = retaDe(J, j)
    if (reta) { J.fase = 'fim'; J.fim = { motivo: 'linha', ganhou: j, reta, casas: [contaCasas(J, 0), contaCasas(J, 1)] }; return }
    proximaVez(J)
  }

  // a jogada: j escolheu a casa e disse o personagem key
  function jogar(J, j, casa, key) {
    if (J.fase !== 'jogo' || j !== J.vez || !(casa >= 0 && casa < J.casas.length) || !aberta(J, j, casa)) return null
    if (!G().chaves.includes(key)) return null
    if (J.usados.includes(key)) return { ok: false, usado: true } // já foi usado: não perde a vez, escolhe outro
    const [l, c] = linCol(J, casa)
    const falhou = [l, c].filter((id) => !vale(id, key, J.versao))
    J.seq += 1
    if (falhou.length) {
      J.ultimo = { j, casa, key, ok: false, falhou, seq: J.seq }
      J.semJogar += 1
      proximaVez(J)
      return J.ultimo
    }
    const antes = J.casas[casa]
    J.casas[casa] = { dono: j, key }
    J.usados.push(key)
    J.semJogar = 0
    J.ultimo = { j, casa, key, ok: true, roubou: antes ? antes.dono : -1, seq: J.seq }
    depoisDePegar(J, j)
    return J.ultimo
  }

  function passar(J, j, tempo) {
    if (J.fase !== 'jogo' || j !== J.vez) return null
    J.seq += 1
    J.ultimo = { j, passou: true, tempo: !!tempo, seq: J.seq }
    J.semJogar += 1
    proximaVez(J)
    return J.ultimo
  }

  // ---------- bot (pra testar sozinho) ----------
  // nota de uma casa pra j: fecha a linha, bloqueia o outro, ajuda a montar uma linha
  function notaCasa(J, j, i, rnd) {
    const outro = 1 - j
    let n = rnd()
    for (const r of retas(J.L, J.C, J.K)) {
      if (!r.includes(i)) continue
      const meus = r.filter((k) => J.casas[k] && J.casas[k].dono === j).length
      const dele = r.filter((k) => J.casas[k] && J.casas[k].dono === outro).length
      const minha = J.casas[i] && J.casas[i].dono === outro ? 1 : 0
      if (meus === J.K - 1) n += 100
      if (dele - minha === J.K - 1) n += 50
      if (!dele || minha) n += 1 + meus
    }
    return n
  }
  function botJogada(J, j, rnd = Math.random) {
    const abertas = J.casas.map((_, i) => i).filter((i) => aberta(J, j, i) && sobra(J, i).length)
    if (!abertas.length) return { passar: true }
    const casa = abertas.sort((a, b) => notaCasa(J, j, b, rnd) - notaCasa(J, j, a, rnd))[0]
    if (rnd() < J.js[j].nivel) {
      const certas = sobra(J, casa)
      return { casa, key: certas[Math.floor(rnd() * certas.length)] }
    }
    // errou: chuta alguém que não vale (e que ninguém usou)
    const [l, c] = linCol(J, casa)
    const erradas = G().poolDa(J.versao).filter((k) => !J.usados.includes(k) && !(vale(l, k, J.versao) && vale(c, k, J.versao)))
    return { casa, key: erradas[Math.floor(rnd() * erradas.length)] }
  }

  raiz.GradeMotor = { medidas, sortearGrade, difCasa, alvoCasa, respostas, retas, novoJogo, jogar, passar, botJogada, linCol, aberta, sobra, podeJogar, daPraFechar, contaCasas, vale, MIN_RESPOSTAS, TAM }
})(typeof window !== 'undefined' ? window : globalThis)
