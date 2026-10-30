// Impostor do Multiverso: de 3 a 10 jogadores. Todo mundo recebe o mesmo personagem de HQ,
// menos o impostor, que recebe um parecido (ou nenhum). Telas: regras → cartas → dicas → votos → fim.
// Este arquivo é o jogo num aparelho só; o online (impostor-online.js) usa as mesmas peças de tela.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const { PARES, TXT } = window.ImpostorDados
  const EN = window.IMPOSTOR_EN
  const X = window.Sfx
  const SAVE = 'mvd-impostor'
  const el = document.getElementById('impostor')
  const IDX = {}
  D.hq.forEach((h, i) => { IDX[h.key] = i })
  const PARES_OK = PARES.filter(([a, b]) => a in IDX && b in IDX)
  const MIN = 3
  const MAX = 10

  const C = { n: 3, usarNomes: false, nomes: Array(MAX).fill(''), modo: 'um', votar: false, tempo: false, segs: 90, lingua: 'pt', placar: Array(MAX).fill(0) }
  let R = null              // a rodada atual
  let tela = 'regras'
  let ultimo = -1
  let confirmar = null      // botão que pede um segundo toque (revelar, zerar)
  let relogio = null        // { fim, restante, rodando }
  let laco = null

  const T = () => TXT[C.lingua]
  const esc = V.esc
  const rand = (n) => Math.floor(Math.random() * n)
  const online = () => window.ImpostorOnline && window.ImpostorOnline.ativo()

  try { Object.assign(C, JSON.parse(localStorage.getItem(SAVE) || '{}')) } catch (e) {}
  C.n = Math.min(MAX, Math.max(MIN, Number(C.n) || 3))
  C.placar = Array.from({ length: MAX }, (_, i) => Number(C.placar && C.placar[i]) || 0)
  C.nomes = Array.from({ length: MAX }, (_, i) => String((C.nomes && C.nomes[i]) || ''))
  if (!TXT[C.lingua]) C.lingua = 'pt'
  function salvar() { try { localStorage.setItem(SAVE, JSON.stringify(C)) } catch (e) {} }
  const som = (f) => { if (X && X.on) X[f]() }

  const nome = (p) => (C.usarNomes && C.nomes[p] && C.nomes[p].trim()) || T().jogador(p + 1)
  const pers = (key) => (C.lingua === 'en' ? EN[key] : D.hq[IDX[key]].n)
  const capa = (key) => V.card(E.lotOf('hq:' + IDX[key]))
  const ehImpostor = (p) => R.impostores.includes(p)
  const qtdImpostores = (n) => (C.modo === 'dois' && n >= 6 ? 2 : 1)

  // sorteia um par parecido (nunca o mesmo da rodada anterior) e quem fica com qual lado
  function sortearPar() {
    let k
    do { k = rand(PARES_OK.length) } while (PARES_OK.length > 1 && k === ultimo)
    ultimo = k
    const [a, b] = Math.random() < 0.5 ? PARES_OK[k] : [PARES_OK[k][1], PARES_OK[k][0]]
    return { comum: a, diferente: C.modo === 'cego' ? null : b }
  }

  // conta os votos: quem leva mais votos sozinho é o "pego". Pontos só com a votação ligada.
  function contar(n, votos, impostores, semVotos) {
    const contagem = Array(n).fill(0)
    if (!semVotos) votos.forEach((v) => { if (v != null) contagem[v] += 1 })
    const max = Math.max(...contagem)
    const topo = contagem.map((v, i) => (v === max ? i : -1)).filter((i) => i >= 0)
    const pego = !semVotos && topo.length === 1 && impostores.includes(topo[0])
    const ganhos = Array(n).fill(0)
    if (C.votar && !semVotos) {
      if (pego) votos.forEach((v, eleitor) => { if (impostores.includes(v) && !impostores.includes(eleitor)) ganhos[eleitor] += 1 })
      else impostores.forEach((i) => { ganhos[i] += 2 })
    }
    return { contagem, pego, empate: !semVotos && topo.length > 1, semVotos: !!semVotos, ganhos, alvo: pego ? topo[0] : -1, adivinhou: null }
  }

  // ---------- rodada ----------
  function novaRodada() {
    R = {
      ...sortearPar(),
      impostores: E.shuffle([...Array(C.n).keys()]).slice(0, qtdImpostores(C.n)),
      vistos: Array(C.n).fill(false), comeca: rand(C.n), votos: [], votante: 0, fim: null,
    }
    confirmar = null
    pararRelogio()
    relogio = { restante: C.segs * 1000, rodando: false, fim: 0 }
    tela = 'cartas'
    som('draw')
    render()
  }

  function proximaDepoisDasCartas() {
    if (C.tempo) return 'dicas'
    return C.votar ? 'votos' : null
  }

  function votar(alvo) {
    R.votos[R.votante] = alvo
    R.votante += 1
    som('tick')
    if (R.votante >= C.n) resolver()
    else render()
  }

  function resolver(semVotos) {
    R.fim = contar(C.n, R.votos, R.impostores, semVotos)
    if (C.votar && !semVotos) {
      R.fim.ganhos.forEach((g, i) => { C.placar[i] += g })
      salvar()
    }
    pararRelogio()
    tela = 'fim'
    som(R.fim.pego || semVotos ? 'win' : 'undo')
    render()
  }

  function adivinhou(sim) {
    R.fim.adivinhou = sim
    if (sim) { R.fim.ganhos[R.fim.alvo] += 2; C.placar[R.fim.alvo] += 2; salvar(); som('sold') }
    render()
  }

  // ---------- relógio das dicas ----------
  function pararRelogio() { clearInterval(laco); laco = null; if (relogio) relogio.rodando = false }
  function alternarRelogio() {
    if (!relogio || relogio.restante <= 0) relogio = { restante: C.segs * 1000, rodando: false, fim: 0 }
    if (relogio.rodando) {
      relogio.restante = Math.max(0, relogio.fim - Date.now())
      pararRelogio()
    } else {
      relogio.rodando = true
      relogio.fim = Date.now() + relogio.restante
      let ultimoSeg = -1
      laco = setInterval(() => {
        relogio.restante = Math.max(0, relogio.fim - Date.now())
        const s = Math.ceil(relogio.restante / 1000)
        if (s !== ultimoSeg && s <= 5 && s > 0) som('tick')
        ultimoSeg = s
        if (relogio.restante <= 0) { pararRelogio(); som('hammer') }
        pintarRelogio(relogio.restante)
      }, 200)
    }
    render()
  }
  function textoRelogio(ms) {
    const s = Math.ceil(ms / 1000)
    return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  }
  function pintarRelogio(ms) {
    const b = document.getElementById('imp-relogio')
    if (!b) return
    b.textContent = ms <= 0 ? T().acabou : textoRelogio(ms)
    b.classList.toggle('fim', ms <= 0)
    const bt = document.getElementById('imp-relogio-bt')
    if (bt && ms <= 0) bt.textContent = T().iniciar
  }

  // ---------- peças de tela (usadas também no online) ----------
  const cor = (p) => `--cor: var(--c${p % 10})`
  const toggle = (id, on, txt, sub) => `<label class="switch"><input type="checkbox" id="${id}"${on ? ' checked' : ''}><span class="knob"></span>
    <span class="imp-sw"><span>${txt}</span>${sub ? `<small>${sub}</small>` : ''}</span></label>`

  function blocoLingua() {
    return `<div class="presets" role="group" aria-label="${T().lingua}">
      <button class="preset" type="button" data-a="lingua" data-v="pt" aria-pressed="${C.lingua === 'pt'}">PT</button>
      <button class="preset" type="button" data-a="lingua" data-v="en" aria-pressed="${C.lingua === 'en'}">EN</button></div>`
  }
  function blocoModo(n) {
    const t = T()
    return `<div class="field"><span class="lbl">${t.modo}</span><div class="modes">${t.modos.map(([v, b, s]) =>
      `<button class="mode" type="button" data-a="modo" data-v="${v}" aria-pressed="${C.modo === v}"${v === 'dois' && n < 6 ? ' disabled' : ''}><b>${b}</b><small>${s}</small></button>`).join('')}</div></div>`
  }
  function blocoOpcoes() {
    const t = T()
    const tempos = C.tempo ? `<div class="presets">${[60, 90, 120, 180].map((s) =>
      `<button class="preset" type="button" data-a="segs" data-v="${s}" aria-pressed="${C.segs === s}">${t.segundos(s)}</button>`).join('')}</div>` : ''
    return `<div class="field"><span class="lbl">${t.extras}</span>
      ${toggle('imp-votar', C.votar, t.votar, t.votarSub)}
      ${toggle('imp-tempo', C.tempo, t.tempo, t.tempoSub)}${tempos}</div>`
  }
  // lista de pontos: itens = [{ nome, lugar, pontos, ganho }]
  function listaPontos(itens) {
    return `<ol class="imp-placar">${[...itens].sort((a, b) => b.pontos - a.pontos).map((i) => `<li style="${cor(i.lugar)}"><span>${esc(i.nome)}</span>
      ${i.ganho ? `<i>${T().pontos(i.ganho)}</i>` : ''}<b>${i.pontos}</b></li>`).join('')}</ol>`
  }
  // painel do relógio e de quem começa (o botão só aparece pra quem controla)
  function painelDicas(nomeComeca, lugar, ms, rodando, botao) {
    const t = T()
    const fim = ms <= 0
    const rotulo = rodando ? t.pausar : ms < C.segs * 1000 && !fim ? t.continuar : t.iniciar
    return `<div class="panel imp-dicas" style="${cor(lugar)}">
      <div><span class="lbl">${t.quemComeca}</span><b class="imp-grande">${esc(nomeComeca)}</b><p>${t.sentido}</p></div>
      <div class="imp-tempo"><b id="imp-relogio" class="${fim ? 'fim' : ''}">${fim ? t.acabou : textoRelogio(ms)}</b>
        ${botao ? `<button class="btn green" type="button" id="imp-relogio-bt" ${botao}>${rotulo}</button>` : ''}</div>
    </div>`
  }

  // a revelação do fim, igual no local e no online. d = { nomes, impostores, comum, diferente, fim, chute, placar, botoes, topo }
  function telaRevelacao(d) {
    const t = T()
    const f = d.fim
    const muitos = d.impostores.length > 1
    const imp = d.impostores.map((p) => esc(d.nomes[p])).join(' + ')
    const titulo = f.semVotos ? (muitos ? t.eram : t.era) + ' ' + imp
      : f.empate ? t.empate : f.pego ? (muitos ? t.pegaramDois : t.pegaram) : (muitos ? t.escaparam : t.escapou)
    const quem = f.semVotos ? '' : `<p class="imp-quem-era">${muitos ? t.eram : t.era} <b>${imp}</b></p>`
    const lado = (rotulo, key) => `<figure class="imp-lado"><span class="lbl">${rotulo}</span>
      ${key ? capa(key) : '<span class="imp-verso grande"><b>?</b></span>'}<figcaption>${key ? esc(pers(key)) : t.nenhum}</figcaption></figure>`
    const chute = d.chute ? `<div class="imp-chute"><p>${t.adivinhou}</p><div class="go-row">
        <button class="btn green" type="button" ${d.chute}="chute" data-v="1">${t.acertou}</button>
        <button class="btn paper" type="button" ${d.chute}="chute" data-v="0">${t.errou}</button></div></div>` : ''
    const jogadores = d.nomes.map((n, p) => {
      const imp = d.impostores.includes(p)
      const key = imp ? d.diferente : d.comum
      return `<li class="imp-rev${imp ? ' imp' : ''}" style="${cor(p)}">
        <span class="imp-quem">${esc(n)}</span>
        ${key ? capa(key) : '<span class="imp-verso"><b>?</b></span>'}
        ${imp ? `<span class="imp-selo">${t.impostor}</span>` : ''}
        ${f.semVotos ? '' : `<span class="imp-votos">${t.votos(f.contagem[p])}</span>`}
        ${f.ganhos[p] ? `<span class="imp-ganho">${t.pontos(f.ganhos[p])}</span>` : ''}</li>`
    }).join('')
    return `<section class="imp-jogo">${d.topo || ''}
      <div class="panel imp-veredito${f.pego || f.semVotos ? ' pego' : ''}">
        <h2>${titulo}</h2>${quem}
        <div class="imp-dupla">${lado(t.comum, d.comum)}${lado(t.diferente, d.diferente)}</div>
        ${chute}
      </div>
      <ul class="imp-revelados">${jogadores}</ul>
      ${d.placar ? `<div class="panel"><h2>${t.placar}</h2>${d.placar}</div>` : ''}
      <div class="go-row">${d.botoes}</div>
    </section>`
  }

  // ---------- telas do jogo num aparelho só ----------
  function telaRegras() {
    const t = T()
    const nomes = C.usarNomes ? `<div class="imp-nomes">${[...Array(C.n).keys()].map((p) =>
      `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">${esc(t.jogador(p + 1))}</span>
        <input id="imp-nome-${p}" maxlength="14" autocomplete="off" placeholder="${esc(t.jogador(p + 1))}" value="${esc(C.nomes[p])}"></label>`).join('')}</div>` : ''
    const temPontos = C.placar.slice(0, C.n).some((v) => v > 0)
    const placar = C.votar ? `<div class="field"><span class="lbl">${t.placar}</span>${listaPlacar()}
      ${temPontos ? `<button class="linkish" type="button" data-a="zerar">${confirmar === 'zerar' ? t.zerarDeNovo : t.zerar}</button>` : ''}</div>` : ''
    const caixaOnline = window.ImpostorOnline ? `<div class="panel">${window.ImpostorOnline.caixa()}</div>` : ''
    return `<section class="setup imp">
      <div class="setup-grid">
        <div class="panel rules">
          <div class="imp-cabeca"><h2>${t.regras}</h2>${blocoLingua()}</div>
          <div class="field"><span class="lbl">${t.jogadores}</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-a="n" data-v="-1" aria-label="−1"${C.n <= MIN ? ' disabled' : ''}>−</button>
              <b class="imp-n">${C.n}</b>
              <button class="btn paper step" type="button" data-a="n" data-v="1" aria-label="+1"${C.n >= MAX ? ' disabled' : ''}>+</button>
            </div>
            ${toggle('imp-usar-nomes', C.usarNomes, t.nomes)}${nomes}
          </div>
          ${blocoModo(C.n)}
          ${blocoOpcoes()}
        </div>
        <div class="imp-coluna">
          ${caixaOnline}
          <div class="panel">
            <h2>${t.como}</h2>
            <ol class="how">${t.passos.map((s) => `<li>${s}</li>`).join('')}</ol>
            ${placar}
          </div>
        </div>
      </div>
      <div class="go-row"><button class="btn big" type="button" data-a="distribuir">${t.distribuir}</button></div>
    </section>`
  }

  function listaPlacar(ganhos) {
    return listaPontos([...Array(C.n).keys()].map((p) => ({ nome: nome(p), lugar: p, pontos: C.placar[p], ganho: ganhos && ganhos[p] })))
  }

  function carta(p) {
    const t = T()
    return `<button class="imp-carta${R.vistos[p] ? ' vista' : ''}" type="button" data-p="${p}" style="${cor(p)}">
      <span class="imp-quem">${esc(nome(p))}</span>
      <span class="imp-frente"><span class="imp-verso"><b>?</b></span></span>
      <span class="imp-dica">${R.vistos[p] ? t.jaViu : t.segure}</span></button>`
  }

  // o que aparece na frente da carta: capa e nome, ou "você é o impostor" no modo sem personagem
  function frente(key) {
    const t = T()
    return key ? `${capa(key)}<span class="imp-nome-pers">${esc(pers(key))}</span>`
      : `<span class="imp-cego"><b>?</b><span>${t.voceImpostor}</span><small>${t.descubra}</small></span>`
  }

  function abrirCarta(p) {
    const c = el.querySelector(`.imp-carta[data-p="${p}"]`)
    if (!c || c.classList.contains('aberta')) return
    c.classList.add('aberta')
    c.querySelector('.imp-frente').innerHTML = frente(ehImpostor(p) ? R.diferente : R.comum)
    c.querySelector('.imp-dica').textContent = T().solte
    if (!R.vistos[p]) { R.vistos[p] = true; som('tick') }
  }

  function fecharCarta(p) {
    const c = el.querySelector(`.imp-carta[data-p="${p}"]`)
    if (!c || !c.classList.contains('aberta')) return
    c.classList.remove('aberta')
    c.classList.add('vista')
    c.querySelector('.imp-frente').innerHTML = '<span class="imp-verso"><b>?</b></span>'
    c.querySelector('.imp-dica').textContent = T().jaViu
    const h = document.getElementById('imp-viram')
    if (h) h.textContent = T().viram(R.vistos.filter(Boolean).length, C.n)
  }

  function botaoRevelar(attr) {
    const t = T()
    return `<button class="btn big red" type="button" ${attr}="revelar">${confirmar === 'revelar' ? t.revelarDeNovo : t.revelar}</button>`
  }

  function botaoSeguir() {
    const t = T()
    const prox = proximaDepoisDasCartas()
    if (prox === 'dicas') return `<button class="btn big green" type="button" data-a="ir" data-v="dicas">${t.paraDicas}</button>`
    if (prox === 'votos') return `<button class="btn big" type="button" data-a="ir" data-v="votos">${t.paraVotar}</button>`
    return botaoRevelar('data-a')
  }

  function telaCartas() {
    const t = T()
    return `<section class="imp-jogo">
      <div class="imp-topo"><span class="hint" id="imp-viram">${t.viram(R.vistos.filter(Boolean).length, C.n)}</span>
        <button class="linkish" type="button" data-a="regras">${t.regras}</button></div>
      <div class="imp-mesa">${[...Array(C.n).keys()].map(carta).join('')}</div>
      <div class="go-row">${botaoSeguir()}</div>
    </section>`
  }

  function telaDicas() {
    const t = T()
    const depois = C.votar ? `<button class="btn big" type="button" data-a="ir" data-v="votos">${t.paraVotar}</button>` : botaoRevelar('data-a')
    return `<section class="imp-jogo">
      <div class="imp-topo"><span class="hint">${t.quemComeca}</span>
        <button class="linkish" type="button" data-a="ir" data-v="cartas">${C.lingua === 'en' ? 'Cards' : 'Cartas'}</button></div>
      ${painelDicas(nome(R.comeca), R.comeca, relogio.restante, relogio.rodando, 'data-a="relogio"')}
      <div class="go-row">${depois}</div>
    </section>`
  }

  function telaVotos() {
    const t = T()
    const v = R.votante
    return `<section class="imp-jogo">
      <div class="imp-topo"><span class="hint">${t.votoDe(v + 1, C.n)}</span>
        <button class="linkish" type="button" data-a="pular">${t.pularVoto}</button></div>
      <div class="panel imp-voto" style="${cor(v)}">
        <h2>${esc(t.vezDeVotar(nome(v)))}</h2>
        <div class="imp-opcoes">${[...Array(C.n).keys()].filter((p) => p !== v).map((p) =>
          `<button class="btn imp-alvo" type="button" data-a="votar" data-v="${p}" style="${cor(p)}">${esc(nome(p))}</button>`).join('')}</div>
        <p class="imp-passe">${t.passe}</p>
      </div>
    </section>`
  }

  function telaFim() {
    const t = T()
    return telaRevelacao({
      nomes: [...Array(C.n).keys()].map(nome), impostores: R.impostores, comum: R.comum, diferente: R.diferente, fim: R.fim,
      chute: !R.diferente && R.fim.pego && R.fim.adivinhou === null && C.votar ? 'data-a' : '',
      placar: C.votar && !R.fim.semVotos ? listaPlacar(R.fim.ganhos) : '',
      botoes: `<button class="btn paper" type="button" data-a="regras">${t.regras}</button>
        <button class="btn big" type="button" data-a="nova">${t.nova}</button>`,
    })
  }

  function render() {
    if (online()) { el.innerHTML = window.ImpostorOnline.tela(); window.ImpostorOnline.depois(); return }
    if (tela !== 'regras' && !R) tela = 'regras'
    el.innerHTML = tela === 'regras' ? telaRegras() : tela === 'cartas' ? telaCartas()
      : tela === 'dicas' ? telaDicas() : tela === 'votos' ? telaVotos() : telaFim()
  }

  // ---------- eventos ----------
  const acoes = {
    n: (v) => {
      C.n = Math.min(MAX, Math.max(MIN, C.n + Number(v)))
      if (C.modo === 'dois' && C.n < 6) C.modo = 'um'
      salvar()
    },
    modo: (v) => { C.modo = v; salvar() },
    segs: (v) => { C.segs = Number(v); salvar() },
    lingua: (v) => { C.lingua = v; salvar(); if (window.Hub) window.Hub.letreiro() },
    zerar: () => {
      if (confirmar !== 'zerar') { confirmar = 'zerar'; return }
      C.placar = Array(MAX).fill(0); confirmar = null; salvar()
    },
    distribuir: () => novaRodada(),
    nova: () => novaRodada(),
    regras: () => { pararRelogio(); tela = 'regras'; confirmar = null },
    ir: (v) => {
      if (tela === 'dicas' && relogio && relogio.rodando) { relogio.restante = Math.max(0, relogio.fim - Date.now()); pararRelogio() }
      tela = v
      confirmar = null
    },
    relogio: () => alternarRelogio(),
    votar: (v) => votar(Number(v)),
    pular: () => resolver(true),
    chute: (v) => adivinhou(v === '1'),
    revelar: () => {
      if (confirmar !== 'revelar') { confirmar = 'revelar'; return }
      resolver(true)
    },
  }
  const semRender = new Set(['distribuir', 'nova', 'relogio', 'votar', 'pular', 'chute'])

  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-a]')
    if (!b || b.disabled) return
    const a = b.dataset.a
    if (a !== 'zerar' && a !== 'revelar') confirmar = null
    acoes[a](b.dataset.v)
    if (!semRender.has(a) && !(a === 'revelar' && tela === 'fim')) render()
    if (a === 'regras' || a === 'ir' || a === 'distribuir' || a === 'nova') window.scrollTo(0, 0)
  })
  el.addEventListener('change', (ev) => {
    const id = ev.target.id
    if (id === 'imp-usar-nomes') C.usarNomes = ev.target.checked
    else if (id === 'imp-votar') C.votar = ev.target.checked
    else if (id === 'imp-tempo') C.tempo = ev.target.checked
    else return
    salvar()
    render()
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^imp-nome-(\d+)$/)
    if (!m) return
    C.nomes[Number(m[1])] = ev.target.value.slice(0, 14)
    salvar()
  })
  // segurar a carta pra ver (dedo, mouse ou espaço/enter); soltar esconde
  el.addEventListener('pointerdown', (ev) => {
    const c = ev.target.closest('.imp-carta')
    if (!c) return
    ev.preventDefault()
    abrirCarta(Number(c.dataset.p))
  })
  for (const nomeEv of ['pointerup', 'pointercancel']) {
    el.addEventListener(nomeEv, () => el.querySelectorAll('.imp-carta.aberta').forEach((c) => fecharCarta(Number(c.dataset.p))))
  }
  el.addEventListener('pointerout', (ev) => {
    const c = ev.target.closest('.imp-carta.aberta')
    if (c && !c.contains(ev.relatedTarget)) fecharCarta(Number(c.dataset.p))
  })
  el.addEventListener('contextmenu', (ev) => { if (ev.target.closest('.imp-carta')) ev.preventDefault() })
  el.addEventListener('keydown', (ev) => {
    const c = ev.target.closest && ev.target.closest('.imp-carta')
    if (c && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); if (!ev.repeat) abrirCarta(Number(c.dataset.p)) }
  })
  el.addEventListener('keyup', (ev) => {
    const c = ev.target.closest && ev.target.closest('.imp-carta')
    if (c && (ev.key === ' ' || ev.key === 'Enter')) fecharCarta(Number(c.dataset.p))
  })
  el.addEventListener('focusout', (ev) => {
    const c = ev.target.closest && ev.target.closest('.imp-carta.aberta')
    if (c) fecharCarta(Number(c.dataset.p))
  })

  let pronto = null
  window.Impostor = {
    letreiro: () => [T().titulo, T().sub],
    abrir() {
      if (!pronto) pronto = V.load()
      pronto.then(render)
    },
    render,
    // peças pro modo online
    _: {
      C, T, esc, cor, capa, pers, som, salvar, rand, MAX, sortearPar, contar, qtdImpostores, frente, textoRelogio, pintarRelogio,
      blocoLingua, blocoModo, blocoOpcoes, listaPontos, painelDicas, telaRevelacao,
    },
  }
})()
