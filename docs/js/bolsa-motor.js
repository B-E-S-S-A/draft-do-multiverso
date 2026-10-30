// Motor da Bolsa do Multiverso: só regras e contas, sem tela e sem rede (roda no anfitrião e nos testes).
// Cada rodada: leitura das dicas → pregão (comprar sobe o preço R$1, vender desce R$1) → Clarim Diário.
// No fechamento a "bolha" do pregão murcha: o preço volta pro de abertura e só as notícias mexem nele.
(function (raiz) {
  const B = raiz.BolsaDados
  const CAIXA = 100
  const MAX_COMPRA = 20
  const MAX_QUEDA = 5   // dá pra apostar na queda de até 5 ações de cada personagem
  const BOATO = 5       // preço pra plantar um boato
  const MULTA = 20      // denúncia errada: o denunciante paga isso pro acusado
  const PREMIO = 20     // denúncia certa: prêmio pago pela bolsa
  let rnd = Math.random
  const sorteia = (l) => l[Math.floor(rnd() * l.length)]
  const embaralha = (l) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const k = Math.floor(rnd() * (i + 1)); [a[i], a[k]] = [a[k], a[i]] } return a }

  // acoes: [{ key, nome, hq }] (o anfitrião sorteia); nomes: [{ nome, bot }]
  function novoJogo({ acoes, jogadores, rodadas = 8, skrull = true, aleatorio }) {
    if (aleatorio) rnd = aleatorio
    const J = {
      rodada: 0, total: rodadas, fase: 'leitura', estalou: false, arcos: [], usadas: new Set(), noticias: [], boatosAtivos: [],
      acoes: acoes.map((a) => { const p = 8 + Math.floor(rnd() * 11); return { key: a.key, nome: a.nome, hq: a.hq, t: B.ACOES[a.key] || a.key.slice(0, 4).toUpperCase() + '3', preco: p, abre: p, hist: [p] } }),
      js: jogadores.map((j) => ({ nome: j.nome, bot: !!j.bot, caixa: CAIXA, pos: acoes.map(() => 0), dicas: [], skrull: false, pego: false,
        denunciou: false, boato: null, boatos: 0, hist: [CAIXA], negocios: 0, plano: null })),
      fita: [], jornal: null, avisos: [], seq: 0, skrullModo: skrull && jogadores.length >= 3,
    }
    if (J.skrullModo) sorteia(J.js).skrull = true
    novaRodada(J)
    return J
  }

  const patrimonio = (J, j) => J.js[j].caixa + J.js[j].pos.reduce((s, q, a) => s + q * J.acoes[a].preco, 0)

  // ---------- notícias ----------
  function escolher(J, a) {
    const ac = J.acoes[a]
    const livres = (lista) => lista.filter(([, txt]) => !J.usadas.has(txt.replace('{n}', ac.nome)))
    const proprias = livres(B.PROPRIAS[ac.key] || [])
    if (!J.arcos.some((x) => x.a === a) && rnd() < 0.08 && J.rodada <= J.total - 2) {
      if (rnd() < 0.75) J.arcos.push({ a, rodada: J.rodada + 2 + Math.floor(rnd() * 2) })
      return B.MORTE
    }
    if (proprias.length && rnd() < 0.4) return sorteia(proprias)
    return sorteia(livres(rnd() < 0.5 ? B.BOAS : B.RUINS)) || sorteia(B.BOAS)
  }

  function gerarNoticias(J) {
    const N = []
    const usados = new Set()
    for (const x of J.arcos.filter((x) => x.rodada === J.rodada)) { N.push({ a: x.a, d: B.VOLTA[0], txt: B.VOLTA[1].replace('{n}', J.acoes[x.a].nome) }); usados.add(x.a) }
    J.arcos = J.arcos.filter((x) => x.rodada > J.rodada)
    const quantas = Math.min(J.acoes.length - 1, 2 + (rnd() < 0.5 ? 1 : 0))
    if (!J.estalou && J.rodada >= 4 && rnd() < 0.12) {
      J.estalou = true
      N.push({ a: -2, alvos: embaralha(J.acoes.map((_, i) => i)).slice(0, Math.ceil(J.acoes.length / 2)), txt: B.ESTALO })
    } else if (rnd() < 0.12) {
      const [d, txt] = sorteia(B.GERAIS)
      N.push({ a: -1, d, txt })
    }
    for (const a of embaralha(J.acoes.map((_, i) => i))) {
      if (N.filter((x) => x.a >= 0).length >= quantas) break
      if (usados.has(a)) continue
      const [d, txt] = escolher(J, a)
      const t = txt.replace('{n}', J.acoes[a].nome)
      J.usadas.add(t)
      N.push({ a, d, txt: t })
      usados.add(a)
    }
    return N
  }

  // preço de cada ação depois das notícias desta rodada (a partir do preço de abertura)
  function previsto(J) {
    const novo = J.acoes.map((ac) => ac.abre)
    for (const x of J.noticias) {
      if (x.a >= 0) novo[x.a] += x.d
      if (x.a === -1) novo.forEach((_, i) => { novo[i] += x.d })
    }
    for (const x of J.noticias) if (x.a === -2) for (const i of x.alvos) novo[i] = Math.ceil(novo[i] / 2)
    return novo.map((p) => Math.max(1, Math.min(99, p)))
  }

  // ---------- dicas ----------
  // cada um recebe 2 fatos verdadeiros e diferentes; juntando a mesa toda, dá pra saber quase tudo.
  // Boatos plantados na rodada anterior entram no lugar da 2ª dica de até 2 pessoas (e parecem iguais às verdadeiras).
  function distribuirDicas(J) {
    const novo = previsto(J)
    const fatos = J.acoes.map((ac, a) => {
      const ch = novo[a] - ac.abre
      return { a, tipo: ch >= 5 ? 'sobeMuito' : ch > 0 ? 'sobe' : ch <= -5 ? 'caiMuito' : ch < 0 ? 'cai' : 'nada' }
    })
    const importantes = embaralha(fatos.filter((f) => f.tipo !== 'nada'))
    if (J.noticias.some((x) => x.a < 0)) importantes.push({ a: -1, tipo: 'geral' })
    const resto = embaralha(fatos.filter((f) => f.tipo === 'nada'))
    const comuns = J.js.map((p, j) => j).filter((j) => !J.js[j].skrull || J.js[j].pego)
    comuns.forEach((j, k) => {
      const um = importantes[k % Math.max(1, importantes.length)] || resto[0]
      const outros = embaralha([...importantes, ...resto].filter((f) => f !== um))
      J.js[j].dicas = [um, outros[0]].filter(Boolean).map((f) => ({ ...f }))
    })
    J.js.forEach((p) => { if (p.skrull && !p.pego) p.dicas = [] })
    J.boatosAtivos = []
    for (const [j, p] of J.js.entries()) {
      if (!p.boato) continue
      const b = p.boato
      p.boato = null
      J.boatosAtivos.push({ de: j, a: b.a, sobe: b.sobe })
      // não vai pra quem já sabe a verdade sobre esse personagem (senão as duas dicas brigam e o boato fica óbvio)
      const alvos = embaralha(comuns.filter((k) => k !== j && !J.js[k].dicas.some((d) => d.boato || d.a === b.a))).slice(0, 2)
      for (const k of alvos) J.js[k].dicas[J.js[k].dicas.length - 1] = { a: b.a, tipo: b.sobe ? 'sobe' : 'cai', boato: true }
      for (const k of alvos) J.js[k].dicas = embaralha(J.js[k].dicas)
    }
  }

  function novaRodada(J) {
    J.rodada += 1
    J.fase = 'leitura'
    J.acoes.forEach((ac) => { ac.abre = ac.preco })
    J.noticias = gerarNoticias(J)
    distribuirDicas(J)
    J.js.forEach((p, j) => { if (p.bot) p.plano = planoBot(J, j) })
  }

  // ---------- ações dos jogadores ----------
  function negociar(J, j, a, compra) {
    const p = J.js[j]
    const ac = J.acoes[a]
    if (J.fase !== 'pregao' || !p || !ac) return false
    if (compra) {
      if (p.pos[a] >= MAX_COMPRA || p.caixa < ac.preco) return false
      p.caixa -= ac.preco
      p.pos[a] += 1
      ac.preco = Math.min(99, ac.preco + 1)
    } else {
      if (p.pos[a] <= -MAX_QUEDA) return false
      ac.preco = Math.max(1, ac.preco - 1)
      p.caixa += ac.preco
      p.pos[a] -= 1
    }
    p.negocios += 1
    J.fita.push({ j, a, c: compra, p: compra ? ac.preco - 1 : ac.preco, n: ++J.seq })
    if (J.fita.length > 14) J.fita.shift()
    return true
  }

  function plantar(J, j, a, sobe) {
    const p = J.js[j]
    if (!p || p.boato || J.fase === 'jornal' || J.fase === 'fim' || J.rodada >= J.total || !J.acoes[a] || p.caixa < BOATO) return false
    p.caixa -= BOATO
    p.boato = { a, sobe: !!sobe }
    p.boatos += 1
    return true
  }

  function denunciar(J, j, alvo) {
    const p = J.js[j]
    const q = J.js[alvo]
    if (!J.skrullModo || !p || !q || j === alvo || p.denunciou || J.js.some((x) => x.pego) || J.fase === 'fim') return null
    p.denunciou = true
    const certo = q.skrull
    if (certo) {
      // o Skrull desmascarado: a S.H.I.E.L.D. vende tudo dele e confisca metade do dinheiro
      q.caixa = patrimonio(J, alvo)
      q.pos = q.pos.map(() => 0)
      if (q.caixa > 0) q.caixa = Math.floor(q.caixa / 2)
      q.pego = true
      p.caixa += PREMIO
    } else {
      p.caixa -= MULTA
      q.caixa += MULTA
    }
    const aviso = { quem: j, alvo, certo, n: ++J.seq }
    J.avisos.push(aviso)
    return aviso
  }

  // ---------- fechamento ----------
  function fechar(J) {
    const novo = previsto(J)
    const itens = J.noticias.map((x) => {
      const quais = x.a >= 0 ? [x.a] : x.a === -1 ? J.acoes.map((_, i) => i) : x.alvos
      return { txt: x.txt, a: x.a, d: x.d, mud: quais.map((a) => ({ a })) }
    })
    const boatos = J.boatosAtivos.map((b) => ({ a: b.a, sobe: b.sobe, verdade: b.sobe ? novo[b.a] > J.acoes[b.a].abre : novo[b.a] < J.acoes[b.a].abre }))
    const antes = J.acoes.map((ac) => ac.abre)
    // preço do fim do pregão que não bate com o fechamento: a bolha que murchou (ou o buraco que fechou)
    const bolhas = J.acoes.map((ac, a) => ({ a, de: ac.preco, para: novo[a] })).filter((b) => Math.abs(b.de - b.para) >= 2)
    J.acoes.forEach((ac, a) => { ac.preco = novo[a]; ac.abre = novo[a]; ac.hist.push(novo[a]) })
    const ganhos = J.js.map((p, j) => {
      const pat = patrimonio(J, j)
      const g = pat - p.hist[p.hist.length - 1]
      p.hist.push(pat)
      return g
    })
    J.jornal = { rodada: J.rodada, itens, boatos, bolhas, ganhos, antes, depois: novo }
    J.fase = 'jornal'
    return J.jornal
  }

  function proximo(J) {
    if (J.rodada >= J.total) { J.fase = 'fim'; return }
    novaRodada(J)
  }

  // ---------- bots (bem simples, só pra testar) ----------
  // No começo da rodada cada bot decide quantas ações quer de cada personagem e quanto o preço pode subir antes de parar.
  function planoBot(J, j) {
    const p = J.js[j]
    const alvo = J.acoes.map(() => null)
    const teto = J.acoes.map(() => 0)
    if (p.skrull && !p.pego) {
      const novo = previsto(J)
      J.acoes.forEach((ac, a) => {
        if (rnd() < 0.3) return // disfarça: às vezes ignora o que sabe
        const ch = novo[a] - ac.abre
        alvo[a] = ch > 0 ? Math.min(6, ch) : ch < 0 ? Math.max(-MAX_QUEDA, ch) : 0
        teto[a] = Math.abs(ch) - 1
      })
    } else {
      for (const d of p.dicas) {
        if (d.a < 0) continue
        const forte = d.tipo === 'sobeMuito' || d.tipo === 'caiMuito'
        alvo[d.a] = d.tipo === 'nada' ? 0 : (d.tipo.startsWith('sobe') ? 1 : -1) * (forte ? 5 : 3)
        teto[d.a] = forte ? 4 : 1
      }
    }
    if (rnd() < 0.3) { const a = Math.floor(rnd() * J.acoes.length); if (alvo[a] === null) { alvo[a] = rnd() < 0.5 ? 2 : -2; teto[a] = 1 } }
    return { alvo, teto, boato: rnd() < 0.25, denuncia: J.skrullModo && !p.denunciou && J.rodada >= 3 && rnd() < 0.2 }
  }

  function botAgir(J, j) {
    const p = J.js[j]
    const pl = p.plano
    if (!pl || J.fase !== 'pregao') return null
    if (pl.boato) { pl.boato = false; const a = Math.floor(rnd() * J.acoes.length); if (plantar(J, j, a, rnd() < 0.5)) return { tipo: 'boato' } }
    if (pl.denuncia && rnd() < 0.15) {
      pl.denuncia = false
      const outros = J.js.map((x, k) => k).filter((k) => k !== j)
      const alvo = outros.sort((x, y) => patrimonio(J, y) - patrimonio(J, x))[0]
      const av = denunciar(J, j, alvo)
      if (av) return { tipo: 'denuncia', aviso: av }
    }
    const opcoes = []
    J.acoes.forEach((ac, a) => {
      const q = p.pos[a]
      const bolha = ac.preco - ac.abre
      if (pl.alvo[a] === null) {
        if (q > 0 && bolha >= 3) opcoes.push([a, false])   // alguém inflou e eu tenho: vendo caro
        if (q < 0 && bolha <= -3) opcoes.push([a, true])
        return
      }
      if (pl.alvo[a] > q && bolha <= pl.teto[a]) opcoes.push([a, true])
      else if (pl.alvo[a] < q && -bolha <= pl.teto[a]) opcoes.push([a, false])
      else if (q > 0 && bolha > pl.teto[a] + 1) opcoes.push([a, false]) // subiu demais: realiza o lucro
    })
    const op = opcoes.length ? sorteia(opcoes) : null
    if (op && negociar(J, j, op[0], op[1])) return { tipo: 'negocio' }
    return null
  }

  raiz.BolsaMotor = { novoJogo, negociar, plantar, denunciar, fechar, proximo, patrimonio, previsto, botAgir, CAIXA, BOATO, MULTA, PREMIO, MAX_QUEDA }
})(typeof window !== 'undefined' ? window : globalThis)
