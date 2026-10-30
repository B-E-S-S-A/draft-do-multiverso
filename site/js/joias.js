// Joias do Infinito: vire cartas do monte pra juntar joias na mão e pare quando quiser pra guardar na sua Manopla.
// Se vier o Thanos: ESTALO. Some a mão inteira e metade da sua Manopla (vira pó). Quem montar a Manopla com as
// 6 joias diferentes ganha na hora; se o monte acabar, ganha quem tiver mais joias.
// Cartas especiais: Doutor Estranho (escudo contra um estalo), Loki (rouba uma joia de alguém) e Viúva Negra (espia a próxima).
// Este arquivo tem as regras, as peças de tela e o jogo num aparelho só; o online fica em joias-online.js.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const X = window.Sfx
  const el = document.getElementById('joias')
  const esc = V.esc
  const SAVE = 'mvd-joias'
  const JOIAS = [
    { n: 'Espaço', de: 'do', cor: '#2f7bf5' }, { n: 'Mente', de: 'da', cor: '#f5c518' }, { n: 'Realidade', de: 'da', cor: '#e8322c' },
    { n: 'Poder', de: 'do', cor: '#9a4be0' }, { n: 'Tempo', de: 'do', cor: '#1fae5b' }, { n: 'Alma', de: 'da', cor: '#f08a24' },
  ]
  const nomeJoia = (c) => `Joia ${JOIAS[c].de} ${JOIAS[c].n}`
  const ESPECIAIS = {
    thanos: { key: 'thanos', n: 'Thanos', txt: 'ESTALO!' },
    estranho: { key: 'doctor-strange', n: 'Doutor Estranho', txt: 'Escudo contra um estalo' },
    loki: { key: 'loki', n: 'Loki', txt: 'Rouba uma joia de alguém' },
    viuva: { key: 'black-widow', n: 'Viúva Negra', txt: 'Espia a próxima carta' },
  }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const lot = (key) => E.lotOf('hq:' + D.hq.findIndex((h) => h.key === key))

  const C = { n: 3, nomes: Array(6).fill('') }
  try { Object.assign(C, JSON.parse(localStorage.getItem(SAVE) || '{}')) } catch (e) {}
  C.n = Math.min(6, Math.max(2, Number(C.n) || 3))
  C.nomes = [0, 1, 2, 3, 4, 5].map((i) => String((C.nomes && C.nomes[i]) || ''))
  const salvar = () => { try { localStorage.setItem(SAVE, JSON.stringify(C)) } catch (e) {} }

  // ---------- regras ----------
  function novoJogo(nomes) {
    const monte = []
    for (let c = 0; c < 6; c++) for (let k = 0; k < 7; k++) monte.push({ t: 'joia', c })
    for (let k = 0; k < 8; k++) monte.push({ t: 'thanos' })
    for (const t of ['estranho', 'loki', 'viuva']) for (let k = 0; k < 4; k++) monte.push({ t })
    return {
      jogadores: nomes.map((nome) => ({ nome, manopla: [0, 0, 0, 0, 0, 0], escudo: false })),
      vez: 0, monte: E.shuffle(monte), mao: [], ultima: null, evento: null, espiada: null, pendente: null, fim: null, seq: 0, viradas: 0,
    }
  }
  const total = (j) => j.manopla.reduce((a, b) => a + b, 0)
  const cores = (j) => j.manopla.filter((x) => x > 0).length
  const thanosNoMonte = (J) => J.monte.filter((c) => c.t === 'thanos').length
  const evento = (J, tipo, extra = {}) => { J.seq += 1; J.evento = { id: J.seq, tipo, jogador: J.vez, ...extra } }

  function virar(J) {
    if (J.fim || J.pendente || !J.monte.length) return null
    const card = J.monte.pop()
    const eu = J.jogadores[J.vez]
    J.ultima = card
    J.espiada = null
    J.viradas += 1
    if (card.t === 'joia') { J.mao.push(card); evento(J, 'joia', { c: card.c }) }
    else if (card.t === 'thanos') {
      if (eu.escudo) { eu.escudo = false; evento(J, 'salvo') }
      else { estalo(J); return card }
    } else if (card.t === 'estranho') {
      if (eu.escudo) evento(J, 'nada', { msg: 'Você já tem o escudo do Doutor Estranho.' })
      else { eu.escudo = true; evento(J, 'escudo') }
    } else if (card.t === 'loki') {
      if (J.jogadores.some((j, i) => i !== J.vez && total(j) > 0)) { J.pendente = 'loki'; evento(J, 'loki') }
      else evento(J, 'nada', { msg: 'Loki não achou ninguém com joias pra roubar.' })
    } else if (card.t === 'viuva') {
      J.espiada = J.monte.length ? J.monte[J.monte.length - 1] : null
      evento(J, 'viuva')
    }
    if (!J.monte.length && !J.pendente) guardarEPassar(J, true)
    return card
  }

  // Thanos estala: a mão some e metade das joias guardadas viram pó
  function estalo(J) {
    const eu = J.jogadores[J.vez]
    const todas = []
    eu.manopla.forEach((n, c) => { for (let k = 0; k < n; k++) todas.push(c) })
    const perdidas = E.shuffle(todas).slice(0, Math.floor(todas.length / 2))
    perdidas.forEach((c) => { eu.manopla[c] -= 1 })
    const mao = J.mao.map((x) => x.c)
    J.mao = []
    evento(J, 'estalo', { perdidas, mao })
    passarVez(J)
  }

  function roubar(J, alvo) {
    if (J.pendente !== 'loki' || alvo === J.vez || !J.jogadores[alvo] || total(J.jogadores[alvo]) === 0) return false
    const vitima = J.jogadores[alvo]
    const tem = []
    vitima.manopla.forEach((n, c) => { if (n > 0) tem.push(c) })
    const c = tem[Math.floor(Math.random() * tem.length)]
    vitima.manopla[c] -= 1
    J.mao.push({ t: 'joia', c })
    J.pendente = null
    evento(J, 'roubou', { alvo, c })
    if (!J.monte.length) guardarEPassar(J, true)
    return true
  }

  function parar(J) {
    if (J.fim || J.pendente || J.viradas < 1) return false
    guardarEPassar(J, false)
    return true
  }

  function guardarEPassar(J, monteAcabou) {
    const eu = J.jogadores[J.vez]
    const guardadas = J.mao.map((x) => x.c)
    guardadas.forEach((c) => { eu.manopla[c] += 1 })
    J.mao = []
    if (cores(eu) === 6) { J.fim = { vencedor: J.vez, motivo: 'manopla' }; evento(J, 'manopla'); return }
    if (!monteAcabou) evento(J, 'guardou', { guardadas })
    passarVez(J)
  }

  function passarVez(J) {
    J.espiada = null
    J.viradas = 0
    J.pendente = null
    if (!J.monte.length && !J.fim) {
      const max = Math.max(...J.jogadores.map(total))
      const topo = J.jogadores.map((j, i) => (total(j) === max ? i : -1)).filter((i) => i >= 0)
      J.fim = { vencedor: topo.length === 1 ? topo[0] : null, empate: topo, motivo: 'monte' }
      return
    }
    J.vez = (J.vez + 1) % J.jogadores.length
  }

  // ---------- peças de tela (também usadas no online) ----------
  const cor = (p) => `--cor: var(--c${p % 10})`
  const gema = (c, extra = '') => `<span class="jo-gema${extra}" style="--g:${JOIAS[c].cor}" title="${nomeJoia(c)}"></span>`

  function carta(card, grande) {
    if (!card) return `<div class="jo-carta vazia${grande ? ' grande' : ''}"><b>?</b></div>`
    if (card.t === 'joia') {
      const j = JOIAS[card.c]
      return `<div class="jo-carta joia${grande ? ' grande' : ''}" style="--g:${j.cor}">${gema(card.c, ' big')}<span class="jo-rotulo">${nomeJoia(card.c)}</span></div>`
    }
    const s = ESPECIAIS[card.t]
    return `<div class="jo-carta esp ${card.t}${grande ? ' grande' : ''}">${V.cover(lot(s.key))}<span class="jo-rotulo"><b>${s.n}</b>${s.txt}</span></div>`
  }

  function manopla(j, perdidas) {
    const slots = JOIAS.map((g, c) => `<span class="jo-slot${j.manopla[c] ? ' tem' : ''}" style="--g:${g.cor}">${gema(c)}${j.manopla[c] > 1 ? `<i>${j.manopla[c]}</i>` : ''}</span>`).join('')
    const po = perdidas && perdidas.length ? `<span class="jo-po">${perdidas.map((c) => gema(c, ' poeira')).join('')}</span>` : ''
    return `<span class="jo-manopla">${slots}</span>${po}`
  }

  function jogadores(J, eu) {
    const ev = J.evento
    return `<div class="jo-jogadores">${J.jogadores.map((j, i) => `<div class="jo-jog${i === J.vez && !J.fim ? ' vez' : ''}" style="${cor(i)}">
      <div class="jo-jog-topo"><b>${esc(j.nome)}</b>${i === eu ? '<small>você</small>' : ''}${j.escudo ? '<span class="jo-escudo" title="Escudo do Doutor Estranho">◆</span>' : ''}<span class="jo-total">${total(j)}</span></div>
      ${manopla(j, ev && ev.tipo === 'estalo' && ev.jogador === i ? ev.perdidas : null)}
    </div>`).join('')}</div>`
  }

  function mensagem(J) {
    const ev = J.evento
    if (!ev) return 'Vire a primeira carta!'
    const nome = esc(J.jogadores[ev.jogador].nome)
    switch (ev.tipo) {
      case 'joia': return `${nomeJoia(ev.c)}! Vira mais uma ou guarda?`
      case 'estalo': return `<b>ESTALO!</b> ${nome} perdeu a mão${ev.perdidas.length ? ` e ${ev.perdidas.length} ${ev.perdidas.length === 1 ? 'joia' : 'joias'} da Manopla` : ''}.`
      case 'salvo': return 'O Thanos estalou, mas o Doutor Estranho voltou no tempo! O escudo foi gasto.'
      case 'escudo': return 'Doutor Estranho! Você ganhou um escudo contra o próximo estalo.'
      case 'loki': return 'Loki! Escolha de quem roubar uma joia.'
      case 'roubou': return `${nome} roubou a ${nomeJoia(ev.c).toLowerCase()} de ${esc(J.jogadores[ev.alvo].nome)}. Ela está na mão (em risco)!`
      case 'viuva': return 'A Viúva Negra espiou a próxima carta.'
      case 'guardou': return `${nome} guardou ${ev.guardadas.length} ${ev.guardadas.length === 1 ? 'joia' : 'joias'} na Manopla.`
      case 'manopla': return `${nome} completou a Manopla!`
      default: return ev.msg || ''
    }
  }

  // a mesa: monte, carta virada, mão em risco e botões. podeJogar = é a vez deste aparelho; attr = atributo das ações
  function mesa(J, podeJogar, attr = 'data-j', verEspiada = true) {
    const eu = J.jogadores[J.vez]
    const th = J.thanos != null ? J.thanos : thanosNoMonte(J) // no online o anfitrião manda a conta pronta
    const risco = J.monte.length ? Math.round((th / J.monte.length) * 100) : 0
    const acoes = !podeJogar ? `<p class="hint">Vez de ${esc(eu.nome)}</p>`
      : J.pendente === 'loki' ? `<div class="jo-alvos"><span class="lbl">Roubar de quem?</span>${J.jogadores.map((j, i) => i === J.vez || !total(j) ? ''
        : `<button class="btn" type="button" ${attr}="roubar" data-v="${i}" style="${cor(i)}">${esc(j.nome)} · ${total(j)}</button>`).join('')}</div>`
        : `<button class="btn big jo-virar" type="button" ${attr}="virar">Virar carta</button>
           <button class="btn green" type="button" ${attr}="parar"${J.viradas < 1 ? ' disabled' : ''}>Parar e guardar${J.mao.length ? ` (${J.mao.length})` : ''}</button>`
    return `<div class="jo-mesa">
      <div class="jo-monte"><div class="jo-verso"><b>${J.monte.length}</b><small>no monte</small></div>
        <p class="jo-risco" title="Chance da próxima carta ser o Thanos">Thanos: ${th} · ${risco}% de chance</p></div>
      <div class="jo-centro">${carta(J.ultima, true)}<p class="jo-msg">${mensagem(J)}</p></div>
      <div class="jo-mao"><span class="lbl">Na mão de ${esc(eu.nome)} · em risco</span>
        <div class="jo-mao-gemas">${J.mao.length ? J.mao.map((x) => gema(x.c, ' big')).join('') : '<small>vazia</small>'}</div>
        ${J.espiada && verEspiada ? `<div class="jo-espiada"><span class="lbl">A próxima carta é</span>${carta(J.espiada)}</div>` : ''}
      </div>
    </div>
    <div class="jo-acoes">${acoes}</div>`
  }

  function textoFim(J) {
    const f = J.fim
    if (f.motivo === 'manopla') return { titulo: `${esc(J.jogadores[f.vencedor].nome)} completou a Manopla!`, sub: 'As 6 joias do Infinito em uma mão só.' }
    if (f.vencedor != null) return { titulo: `${esc(J.jogadores[f.vencedor].nome)} venceu!`, sub: 'O monte acabou e ninguém completou a Manopla: ganhou quem tinha mais joias.' }
    return { titulo: 'Empate!', sub: `${f.empate.map((i) => esc(J.jogadores[i].nome)).join(' e ')} terminaram com o mesmo número de joias.` }
  }

  function telaFim(J, botoes, eu) {
    const t = textoFim(J)
    return `<section class="jo-jogo"><div class="panel jo-final"><h2>${t.titulo}</h2><p>${t.sub}</p></div>
      ${jogadores(J, eu)}<div class="go-row">${botoes}</div></section>`
  }

  const COMO = `<ol class="how">
    <li>Na sua vez, <b>vire cartas</b> do monte. As joias vão pra sua mão.</li>
    <li>Quando quiser, <b>pare e guarde</b>: as joias da mão vão pra sua <b>Manopla</b> e ficam seguras.</li>
    <li>Se virar o <b>Thanos</b>: ESTALO! Você perde a mão e <b>metade da Manopla</b> vira pó.</li>
    <li>Quem juntar as <b>6 joias diferentes</b> na Manopla ganha na hora. Se o monte acabar, ganha quem tiver mais joias.</li>
  </ol>`

  function legenda() {
    return `<div class="jo-legenda">${['thanos', 'estranho', 'loki', 'viuva'].map((t) => carta({ t })).join('')}</div>`
  }

  // ---------- jogo num aparelho só ----------
  let J = null
  let tela = 'regras'
  let animado = 0

  function telaRegras() {
    const nomes = [...Array(C.n).keys()].map((p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">Jogador ${p + 1}</span>
      <input id="jo-nome-${p}" maxlength="14" autocomplete="off" placeholder="Jogador ${p + 1}" value="${esc(C.nomes[p])}"></label>`).join('')
    const online = window.JoiasOnline ? `<div class="panel">${window.JoiasOnline.caixa()}</div>` : ''
    return `<section class="setup jo">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Regras</h2>
          <div class="field"><span class="lbl">Jogadores</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-j="n" data-v="-1" aria-label="Um a menos"${C.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${C.n}</b>
              <button class="btn paper step" type="button" data-j="n" data-v="1" aria-label="Um a mais"${C.n >= 6 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          <div class="field"><span class="lbl">Como jogar</span>${COMO}</div>
          <div class="field"><span class="lbl">Cartas especiais</span>${legenda()}</div>
        </div>
        <div class="imp-coluna">${online}</div>
      </div>
      <div class="go-row"><span class="lbl">Num aparelho só: passem o celular na vez de cada um</span>
        <button class="btn big" type="button" data-j="comecar">Começar</button></div>
    </section>`
  }

  function render() {
    if (window.JoiasOnline && window.JoiasOnline.ativo()) { el.innerHTML = window.JoiasOnline.tela(); window.JoiasOnline.depois(); efeitos(window.JoiasOnline.jogo()); return }
    if (tela !== 'regras' && !J) tela = 'regras'
    if (tela === 'regras') { el.innerHTML = telaRegras(); return }
    if (J.fim) {
      el.innerHTML = telaFim(J, `<button class="btn paper" type="button" data-j="regras">Regras</button><button class="btn big" type="button" data-j="comecar">Jogar de novo</button>`)
    } else {
      el.innerHTML = `<section class="jo-jogo">
        <div class="imp-topo"><span class="hint" style="${cor(J.vez)}">Vez de ${esc(J.jogadores[J.vez].nome)}</span>
          <button class="linkish" type="button" data-j="regras">Regras</button></div>
        ${jogadores(J)}${mesa(J, true)}</section>`
    }
    efeitos(J)
  }

  // sons e o pó do estalo (cada acontecimento anima uma vez só)
  function efeitos(J) {
    const ev = J && J.evento
    if (!ev || ev.id === animado) return
    animado = ev.id
    if (ev.tipo === 'estalo') { som('hammer'); poeira(); el.querySelector('.jo-jogo') && el.querySelector('.jo-jogo').classList.add('tremendo') }
    else if (ev.tipo === 'joia' || ev.tipo === 'roubou') som('tick')
    else if (ev.tipo === 'salvo' || ev.tipo === 'escudo') som('draw')
    else if (ev.tipo === 'guardou') som('sold')
    else if (ev.tipo === 'manopla') som('win')
    else if (ev.tipo === 'loki' || ev.tipo === 'viuva') som('bid', 1)
  }

  // as joias perdidas no estalo se desfazem em pó (partículas num canvas por cima da página)
  function poeira() {
    const gemas = [...el.querySelectorAll('.jo-gema.poeira')]
    if (!gemas.length || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const cv = document.createElement('canvas')
    cv.className = 'jo-po-canvas'
    cv.width = innerWidth
    cv.height = innerHeight
    document.body.appendChild(cv)
    const ctx = cv.getContext('2d')
    const ps = []
    for (const g of gemas) {
      const r = g.getBoundingClientRect()
      const cor = getComputedStyle(g).getPropertyValue('--g') || '#888'
      for (let k = 0; k < 46; k++) {
        ps.push({ x: r.left + Math.random() * r.width, y: r.top + Math.random() * r.height, vx: 0.6 + Math.random() * 2.2, vy: -0.4 - Math.random() * 1.4,
          t: Math.random() * 25, cor: Math.random() < 0.3 ? '#3b3530' : cor.trim(), s: 2 + Math.floor(Math.random() * 3) })
      }
    }
    let f = 0
    const passo = () => {
      f += 1
      ctx.clearRect(0, 0, cv.width, cv.height)
      for (const p of ps) {
        if (f < p.t) { ctx.globalAlpha = 1 } else { p.x += p.vx; p.y += p.vy; p.vy -= 0.01; ctx.globalAlpha = Math.max(0, 1 - (f - p.t) / 70) }
        ctx.fillStyle = p.cor
        ctx.fillRect(Math.round(p.x), Math.round(p.y), p.s, p.s)
      }
      if (f < 100) requestAnimationFrame(passo)
      else cv.remove()
    }
    requestAnimationFrame(passo)
  }

  const acoes = {
    n: (v) => { C.n = Math.min(6, Math.max(2, C.n + Number(v))); salvar() },
    comecar: () => {
      J = novoJogo([...Array(C.n).keys()].map((p) => (C.nomes[p] && C.nomes[p].trim()) || `Jogador ${p + 1}`))
      tela = 'jogo'
      som('draw')
      window.scrollTo(0, 0)
    },
    regras: () => { tela = 'regras' },
    virar: () => virar(J),
    parar: () => parar(J),
    roubar: (v) => roubar(J, Number(v)),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-j]')
    if (!b || b.disabled) return
    acoes[b.dataset.j](b.dataset.v)
    render()
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^jo-nome-(\d)$/)
    if (!m) return
    C.nomes[Number(m[1])] = ev.target.value.slice(0, 14)
    salvar()
  })

  let pronto = null
  window.Joias = {
    letreiro: () => ['Joias do <em>Infinito</em>', 'junte as 6 antes do estalo'],
    abrir() { if (!pronto) pronto = V.load(); pronto.then(render) },
    render,
    _: { novoJogo, virar, parar, roubar, total, jogadores, mesa, telaFim, COMO, legenda, cor, esc, som },
  }
})()
