// Monta o HTML de cada tela. As capas vêm de um atlas e são recortadas num canvas.
(function () {
  const E = window.Engine
  const D = E.D
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
  const t = (pt, en) => window.Lingua.t(pt, en)
  const EN = () => window.Lingua.en()

  // ---------- inglês (cada aparelho na sua língua) ----------
  const X = window.DRAFT_EN
  const nomeDe = (l) => (EN() ? (l.src === 'mcu' && X.mcu[l.key]) || (window.IMPOSTOR_EN || {})[l.key] || X.mcu[l.key] || l.n : l.n)
  const obraDe = (w) => (EN() && X.obras[w] ? X.obras[w] : D.works[w].t)
  const idDe = (l) => (EN() && X.ids[l.id]) || l.id
  const atorDe = (l) => (EN() ? String(l.actor || '').replace('(voz)', '(voice)') : l.actor)
  const porDe = (l) => (EN() ? String(l.by || '').replace(/ e outros$/, ' and others').replace(/ e /g, ' and ') : l.by)
  const modo = (m) => (EN() ? { hq: 'Comics only', mcu: 'MCU only', both: 'Both' }[m] : E.MODES[m])
  const forca = (f) => (EN() ? ['', 'Street', 'City', 'Planet', 'Cosmic', 'Multiverse'][f] : E.FORCA[f])
  const lado = (s) => (EN() ? { H: 'Hero', V: 'Villain', A: 'Anti-hero' }[s] : E.LADO[s])

  // ---------- capas ----------
  const atlases = {}
  const cache = new Map()

  function load() {
    return Promise.all(['hq', 'mcu'].map((src) => new Promise((done) => {
      const im = new Image()
      im.onload = () => { atlases[src] = im; done() }
      im.onerror = () => done()
      im.src = D.atlas[src].src
    })))
  }

  function cellOf(lot) { return lot.src === 'hq' ? lot.i : D.works[lot.w].i }

  function coverURL(src, i) {
    const k = src + i
    if (cache.has(k)) return cache.get(k)
    const im = atlases[src]
    let url = ''
    if (im) {
      const a = D.atlas[src]
      const w = im.naturalWidth / a.cols
      const h = im.naturalHeight / a.rows
      const c = document.createElement('canvas')
      c.width = w
      c.height = h
      c.getContext('2d').drawImage(im, (i % a.cols) * w, Math.floor(i / a.cols) * h, w, h, 0, 0, w, h)
      try {
        const bin = atob(c.toDataURL('image/png').split(',')[1])
        const bytes = new Uint8Array(bin.length)
        for (let j = 0; j < bin.length; j++) bytes[j] = bin.charCodeAt(j)
        url = URL.createObjectURL(new Blob([bytes], { type: 'image/png' }))
      } catch (e) { url = '' }
    }
    cache.set(k, url)
    return url
  }

  function cover(lot) {
    const src = lot.src
    const i = cellOf(lot)
    const url = coverURL(src, i)
    if (url) return `<img class="cv" src="${url}" alt="${esc(nomeDe(lot))}" draggable="false">`
    const a = D.atlas[src]
    const x = a.cols > 1 ? ((i % a.cols) / (a.cols - 1)) * 100 : 0
    const y = a.rows > 1 ? (Math.floor(i / a.cols) / (a.rows - 1)) * 100 : 0
    return `<div class="cv" role="img" aria-label="${esc(nomeDe(lot))}" style="background-image:url(${a.src});background-size:${a.cols * 100}% ${a.rows * 100}%;background-position:${x}% ${y}%"></div>`
  }

  const frameOf = (lot) => (lot.src === 'hq' ? 'hq' : D.works[lot.w].tv ? 'serie' : 'filme')
  const kindOf = (lot) => (lot.src === 'hq' ? t('HQ', 'Comics') : 'MCU · ' + (EN() ? X.tipos[D.works[lot.w].k] || D.works[lot.w].k : D.works[lot.w].k))

  function card(lot) {
    const f = frameOf(lot)
    const corner = lot.src === 'hq' ? `<span class="corner">HQ<b>${lot.year || '—'}</b></span>` : ''
    const band = f === 'filme' ? `<span class="band">MCU · ${D.works[lot.w].y}</span>` : ''
    const knobs = f === 'serie' ? '<span class="knobs"><i></i><i></i></span>' : ''
    return `<figure class="card ${f}">${band}${cover(lot)}${corner}${knobs}</figure>`
  }

  // ---------- dinheiro em notas de real ----------
  const NOTES = [
    [200, 'n200', 'lobo-guará'], [100, 'n100', 'garoupa'], [50, 'n50', 'onça-pintada'],
    [20, 'n20', 'mico-leão-dourado'], [10, 'n10', 'arara-vermelha'], [5, 'n5', 'garça'],
    [2, 'n2', 'tartaruga-marinha'], [0, 'n1', 'moeda'],
  ]
  function bill(v) {
    const n = NOTES.find(([d]) => v >= d)
    return `<span class="bill ${n[1]}"><span class="cur">R$</span><b>${v}</b><i>${n[2]}</i></span>`
  }

  function meter(f) {
    let h = ''
    for (let i = 1; i <= 5; i++) h += `<i class="${i <= f ? 'on' : ''}"></i>`
    return `<span class="meter f${f}" aria-hidden="true">${h}</span>`
  }

  // o nome padrão ("Jogador 1") também muda de língua; nome que alguém escreveu fica como está
  const name = (S, p) => { const n = S.cfg.names[p]; return esc(!n || n === 'Jogador ' + (p + 1) ? t('Jogador ', 'Player ') + (p + 1) : n) }

  // ---------- regras ----------
  function rules(S) {
    const c = S.cfg
    const mode = (v, title, sub) => `
      <button class="mode" type="button" data-act="mode" data-v="${v}" aria-pressed="${c.mode === v}">
        <span class="stack">${S.stacks[v].map(card).join('')}</span>
        <b>${title}</b><small>${sub}</small>
      </button>`
    const preset = (v) => `<button class="preset" type="button" data-act="money-set" data-v="${v}" aria-pressed="${c.money === v}">R$${v}</button>`
    const team = c.size / 2
    const sty = (v, title, sub) => `<button class="style" type="button" data-act="style" data-v="${v}" aria-pressed="${(c.style || 'normal') === v}"><b>${title}</b><small>${sub}</small></button>`
    const isClassic = c.mode === 'both' && c.money === 20 && c.size === 8
    return `
      <h2>${t('Regras', 'Rules')}</h2>
      <div class="field">
        <span class="lbl">${t('De onde vêm os personagens', 'Where the characters come from')}</span>
        <div class="modes">
          ${mode('hq', t('HQ', 'Comics'), D.hq.length + t(' dos quadrinhos', ' from the comics'))}
          ${mode('mcu', 'MCU', D.mcu.length + t(' dos filmes e séries', ' from the movies and series'))}
          ${mode('both', t('Os dois', 'Both'), t('metade de cada', 'half of each'))}
        </div>
      </div>
      <div class="field">
        <span class="lbl">${t('Dinheiro de cada jogador', 'Money for each player')}</span>
        <div class="stepper">
          <button class="btn paper step" type="button" data-act="money" data-v="-1" aria-label="${t('Menos R$1', 'R$1 less')}" ${c.money <= 1 ? 'disabled' : ''}>−</button>
          ${bill(c.money)}
          <button class="btn paper step" type="button" data-act="money" data-v="1" aria-label="${t('Mais R$1', 'R$1 more')}" ${c.money >= 200 ? 'disabled' : ''}>+</button>
          <span class="presets">${[10, 20, 50, 100].map(preset).join('')}</span>
        </div>
      </div>
      <div class="field">
        <span class="lbl">${t('Personagens no draft', 'Characters in the draft')}</span>
        <div class="stepper">
          <button class="btn paper step" type="button" data-act="size" data-v="-2" aria-label="${t('Menos 2', '2 fewer')}" ${c.size <= 4 ? 'disabled' : ''}>−</button>
          <span class="count">${c.size}</span>
          <button class="btn paper step" type="button" data-act="size" data-v="2" aria-label="${t('Mais 2', '2 more')}" ${c.size >= 20 ? 'disabled' : ''}>+</button>
          <span class="hint">${team} ${t('pra cada time', 'per team')}</span>
        </div>
      </div>
      <div class="field">
        <span class="lbl">${t('Tipo de leilão', 'Auction type')}</span>
        <div class="styles">
          ${sty('normal', t('Lances', 'Bids'), t('Um abre, o outro cobre. Vocês batem o martelo.', 'One opens, the other outbids. You bring the hammer down.'))}
          ${sty('auto', t('Martelo automático', 'Auto hammer'), t('Depois de cada lance conta 5 segundos e vende sozinho.', 'After each bid it counts 5 seconds and sells on its own.'))}
          ${sty('drop', t('Preço caindo', 'Falling price'), t('O preço começa alto e cai R$1 por vez. Quem tocar primeiro leva.', 'The price starts high and drops R$1 at a time. First to tap takes it.'))}
        </div>
      </div>
      ${isClassic ? `<p class="classic on lbl">${t('Modo clássico', 'Classic mode')}</p>` : `<button class="classic lbl" type="button" data-act="classic">${t('Voltar pro clássico', 'Back to classic')}</button>`}`
  }

  function score(S) {
    const s = S.score
    const any = s[0] + s[1] + s[2] > 0
    return `
      <div class="scoreboard" aria-label="${t('Placar', 'Score')}">
        <span class="sp0">${name(S, 0)}</span><b>${s[0]}<i>×</i>${s[1]}</b><span class="sp1">${name(S, 1)}</span>
      </div>
      <p class="note">${s[2] ? s[2] + (s[2] > 1 ? t(' empates', ' ties') : t(' empate', ' tie')) + ' · ' : ''}${any ? `<button class="linkish" type="button" data-act="reset-score">${S.confirm === 'score' ? t('Toque de novo pra zerar', 'Tap again to reset') : t('Zerar placar', 'Reset score')}</button>` : t('O placar fica salvo neste aparelho.', 'The score is saved on this device.')}</p>`
  }

  // leilão salvo no meio: continuar ou apagar (o convidado só espera o anfitrião)
  function resume(S) {
    const g = S.game
    if (!g || E.done(g)) return ''
    if (S.me === 1) return `<div class="panel resume"><p>${t(`<b>${name(S, 0)} tem um leilão no meio.</b> Esperando ele continuar…`, `<b>${name(S, 0)} has an auction in progress.</b> Waiting for them to continue…`)}</p></div>`
    return `<div class="panel resume">
        <p>${t(`<b>Tem um leilão no meio.</b> Lote ${g.cur + 1} de ${g.lots.length}.`, `<b>There is an auction in progress.</b> Lot ${g.cur + 1} of ${g.lots.length}.`)}</p>
        <div class="resume-btns">
          <button class="btn green" type="button" data-act="resume">${t('Continuar leilão', 'Continue auction')}</button>
          <button class="btn paper" type="button" data-act="wipe">${S.confirm === 'wipe' ? t('Toque de novo pra apagar', 'Tap again to delete') : t('Apagar leilão', 'Delete auction')}</button>
        </div>
      </div>`
  }

  function setup(S) {
    const c = S.cfg
    return `
      <section class="setup">
        <div class="wire" aria-hidden="true"><div class="wire-row">${S.showcase.map((l) => `<div class="hang">${card(l)}</div>`).join('')}</div></div>
        <div id="resume"></div>
        <div class="setup-grid">
          <div class="panel rules" id="rules">${rules(S)}</div>
          <div class="panel players">
            <h2>${t('Quem joga', 'Who is playing')}</h2>
            <label class="pname p0"><span class="lbl">${t('Jogador 1', 'Player 1')}</span><input id="name0" maxlength="16" autocomplete="off" value="${name(S, 0)}"></label>
            <label class="pname p1"><span class="lbl">${t('Jogador 2', 'Player 2')}</span><input id="name1" maxlength="16" autocomplete="off" value="${name(S, 1)}"></label>
            <div id="score">${score(S)}</div>
            <div id="online"></div>
            <ol class="how">${t(`
              <li>Os lotes são sorteados e ficam virados no varal. Cada personagem só aparece quando chega a vez dele.</li>
              <li>A cada lote um jogador abre o lance. A vez de abrir alterna.</li>
              <li>Depois é só cobrir. Bateu o martelo, quem deu mais leva e paga.</li>
              <li>Pode apostar até o último real. Quem fica sem dinheiro abre por R$0 sozinho, e o lote vende sozinho quando ninguém pode cobrir.</li>
              <li>Quando um time fecha, o resto vai de graça pro outro.</li>`, `
              <li>The lots are drawn and hang face down on the line. Each character only shows up when its turn comes.</li>
              <li>On each lot one player opens the bidding. Who opens alternates.</li>
              <li>Then just outbid. When the hammer falls, the highest bidder takes it and pays.</li>
              <li>You can bet down to your last real. Whoever runs out of money opens at R$0 automatically, and the lot sells on its own when nobody can outbid.</li>
              <li>When one team is full, the rest goes to the other for free.</li>`)}
            </ol>
          </div>
        </div>
        <div class="go-row" id="go"></div>
      </section>`
  }

  const STYLES = () => ({ normal: t('lances', 'bids'), auto: t('martelo automático', 'auto hammer'), drop: t('preço caindo', 'falling price') })

  function go(S) {
    const c = S.cfg
    const sum = `<p class="lbl">${modo(c.mode)} · R$${c.money} ${t('cada', 'each')} · ${c.size} ${t('personagens', 'characters')} · ${STYLES()[c.style || 'normal']}</p>`
    if (S.me === 1) return sum + `<p class="wait-host">${t(`Esperando ${name(S, 0)} sortear os lotes…`, `Waiting for ${name(S, 0)} to draw the lots…`)}</p>`
    return sum + `<button class="btn big" type="button" data-act="start">${t('Sortear lotes', 'Draw lots')}</button>`
  }

  // sala online (código de 4 letras, sem conta)
  function online(S) {
    const n = S.net || { status: 'off' }
    const head = `<span class="lbl">${t('Jogar online', 'Play online')}</span>`
    const err = n.error ? `<p class="neterr">${esc(n.error)}</p>` : ''
    const g = S.game
    const noMeio = g && !E.done(g)
    if (S.ask === 'host') return `<div class="online ask">${head}
      <p>${t(`<b>Você tem um leilão no meio</b> (lote ${g.cur + 1} de ${g.lots.length}). O que fazer com ele?`, `<b>You have an auction in progress</b> (lot ${g.cur + 1} of ${g.lots.length}). What should we do with it?`)}</p>
      <div class="online-row">
        <button class="btn green" type="button" data-act="host-keep">${t('Continuar ele online', 'Continue it online')}</button>
        <button class="btn paper" type="button" data-act="host-new">${t('Apagar e começar outro', 'Delete it and start another')}</button>
      </div>
      <button class="linkish" type="button" data-act="ask-cancel">${t('Cancelar', 'Cancel')}</button></div>`
    if (n.status === 'creating') return `<div class="online">${head}<p>${t('Criando a sala…', 'Creating the room…')}</p><button class="linkish" type="button" data-act="net-leave">${t('Cancelar', 'Cancel')}</button></div>`
    if (n.status === 'hosting') return `<div class="online">${head}${err}<p>${t('Manda esse código pro seu amigo:', 'Send this code to your friend:')}</p><b class="code">${esc(n.code)}</b>
      <div class="online-row"><button class="btn paper" type="button" data-act="invite">${t('Copiar convite', 'Copy invite')}</button></div>
      <p class="note" id="invited" role="status">${t('O convite leva o link do site e já entra na sala, sem digitar nada.', 'The invite carries the site link and joins the room, no typing needed.')}</p>
      <p class="note">${t('Esperando ele entrar…', 'Waiting for them to join…')}</p><button class="linkish" type="button" data-act="net-leave">${t('Fechar a sala', 'Close the room')}</button></div>`
    if (n.status === 'joining') return `<div class="online">${head}<p>${t('Entrando na sala', 'Joining room')} ${esc(n.code)}…</p><button class="linkish" type="button" data-act="net-leave">${t('Cancelar', 'Cancel')}</button></div>`
    if (n.status === 'connected') return `<div class="online on">${head}<p><b>${t('Conectado!', 'Connected!')}</b> ${S.me === 0 ? t(`${name(S, 1)} está na sua sala (${esc(n.code)}). Você é o Jogador 1.`, `${name(S, 1)} is in your room (${esc(n.code)}). You are Player 1.`) : t(`Você está na sala de ${name(S, 0)}. Você é o Jogador 2.`, `You are in ${name(S, 0)}’s room. You are Player 2.`)}</p>
      <button class="linkish" type="button" data-act="net-leave">${t('Sair da sala', 'Leave room')}</button></div>`
    const guardado = noMeio ? `<p class="note">${t('Se você entrar na sala de alguém, seu leilão salvo fica guardado e volta quando você sair.', 'If you join someone’s room, your saved auction is kept and comes back when you leave.')}</p>` : ''
    return `<div class="online">${head}<p class="note">${t('Cada um no seu computador. Seu amigo não precisa de conta.', 'Each on their own computer. Your friend does not need an account.')}</p>${err}
      <div class="online-row">
        <button class="btn green" type="button" data-act="net-host">${t('Criar sala', 'Create room')}</button>
        <span class="lbl">${t('ou', 'or')}</span>
        <input id="joincode" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" aria-label="${t('Código da sala', 'Room code')}" value="${esc(n.code || '')}">
        <button class="btn paper" type="button" data-act="net-join">${t('Entrar', 'Join')}</button>
      </div>${guardado}</div>`
  }

  window.View = { esc, load, card, cover, bill, meter, name, kindOf, frameOf, rules, score, resume, setup, go, online, nomeDe, obraDe, idDe, atorDe, porDe, modo, forca, lado }
})()
