// Monta o HTML de cada tela. As capas vêm de um atlas e são recortadas num canvas.
(function () {
  const E = window.Engine
  const D = E.D
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

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
    if (url) return `<img class="cv" src="${url}" alt="${esc(lot.n)}" draggable="false">`
    const a = D.atlas[src]
    const x = a.cols > 1 ? ((i % a.cols) / (a.cols - 1)) * 100 : 0
    const y = a.rows > 1 ? (Math.floor(i / a.cols) / (a.rows - 1)) * 100 : 0
    return `<div class="cv" role="img" aria-label="${esc(lot.n)}" style="background-image:url(${a.src});background-size:${a.cols * 100}% ${a.rows * 100}%;background-position:${x}% ${y}%"></div>`
  }

  const frameOf = (lot) => (lot.src === 'hq' ? 'hq' : D.works[lot.w].tv ? 'serie' : 'filme')
  const kindOf = (lot) => (lot.src === 'hq' ? 'HQ' : 'MCU · ' + D.works[lot.w].k)

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

  const name = (S, p) => esc(S.cfg.names[p] || 'Jogador ' + (p + 1))

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
      <h2>Regras</h2>
      <div class="field">
        <span class="lbl">De onde vêm os personagens</span>
        <div class="modes">
          ${mode('hq', 'HQ', D.hq.length + ' dos quadrinhos')}
          ${mode('mcu', 'MCU', D.mcu.length + ' dos filmes e séries')}
          ${mode('both', 'Os dois', 'metade de cada')}
        </div>
      </div>
      <div class="field">
        <span class="lbl">Dinheiro de cada jogador</span>
        <div class="stepper">
          <button class="btn paper step" type="button" data-act="money" data-v="-1" aria-label="Menos R$1" ${c.money <= 1 ? 'disabled' : ''}>−</button>
          ${bill(c.money)}
          <button class="btn paper step" type="button" data-act="money" data-v="1" aria-label="Mais R$1" ${c.money >= 200 ? 'disabled' : ''}>+</button>
          <span class="presets">${[10, 20, 50, 100].map(preset).join('')}</span>
        </div>
      </div>
      <div class="field">
        <span class="lbl">Personagens no draft</span>
        <div class="stepper">
          <button class="btn paper step" type="button" data-act="size" data-v="-2" aria-label="Menos 2" ${c.size <= 4 ? 'disabled' : ''}>−</button>
          <span class="count">${c.size}</span>
          <button class="btn paper step" type="button" data-act="size" data-v="2" aria-label="Mais 2" ${c.size >= 20 ? 'disabled' : ''}>+</button>
          <span class="hint">${team} pra cada time</span>
        </div>
      </div>
      <div class="field">
        <span class="lbl">Tipo de leilão</span>
        <div class="styles">
          ${sty('normal', 'Lances', 'Um abre, o outro cobre. Vocês batem o martelo.')}
          ${sty('auto', 'Martelo automático', 'Depois de cada lance conta 5 segundos e vende sozinho.')}
          ${sty('drop', 'Preço caindo', 'O preço começa alto e cai R$1 por vez. Quem tocar primeiro leva.')}
        </div>
      </div>
      ${isClassic ? '<p class="classic on lbl">Modo clássico</p>' : '<button class="classic lbl" type="button" data-act="classic">Voltar pro clássico</button>'}`
  }

  function score(S) {
    const s = S.score
    const any = s[0] + s[1] + s[2] > 0
    return `
      <div class="scoreboard" aria-label="Placar">
        <span class="sp0">${name(S, 0)}</span><b>${s[0]}<i>×</i>${s[1]}</b><span class="sp1">${name(S, 1)}</span>
      </div>
      <p class="note">${s[2] ? s[2] + (s[2] > 1 ? ' empates' : ' empate') + ' · ' : ''}${any ? `<button class="linkish" type="button" data-act="reset-score">${S.confirm === 'score' ? 'Toque de novo pra zerar' : 'Zerar placar'}</button>` : 'O placar fica salvo neste aparelho.'}</p>`
  }

  // leilão salvo no meio: continuar ou apagar (o convidado só espera o anfitrião)
  function resume(S) {
    const g = S.game
    if (!g || E.done(g)) return ''
    if (S.me === 1) return `<div class="panel resume"><p><b>${name(S, 0)} tem um leilão no meio.</b> Esperando ele continuar…</p></div>`
    return `<div class="panel resume">
        <p><b>Tem um leilão no meio.</b> Lote ${g.cur + 1} de ${g.lots.length}.</p>
        <div class="resume-btns">
          <button class="btn green" type="button" data-act="resume">Continuar leilão</button>
          <button class="btn paper" type="button" data-act="wipe">${S.confirm === 'wipe' ? 'Toque de novo pra apagar' : 'Apagar leilão'}</button>
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
            <h2>Quem joga</h2>
            <label class="pname p0"><span class="lbl">Jogador 1</span><input id="name0" maxlength="16" autocomplete="off" value="${name(S, 0)}"></label>
            <label class="pname p1"><span class="lbl">Jogador 2</span><input id="name1" maxlength="16" autocomplete="off" value="${name(S, 1)}"></label>
            <div id="score">${score(S)}</div>
            <div id="online"></div>
            <ol class="how">
              <li>Os lotes são sorteados e ficam virados no varal. Cada personagem só aparece quando chega a vez dele.</li>
              <li>A cada lote um jogador abre o lance. A vez de abrir alterna.</li>
              <li>Depois é só cobrir. Bateu o martelo, quem deu mais leva e paga.</li>
              <li>Pode apostar até o último real. Quem fica sem dinheiro abre por R$0 sozinho, e o lote vende sozinho quando ninguém pode cobrir.</li>
              <li>Quando um time fecha, o resto vai de graça pro outro.</li>
            </ol>
          </div>
        </div>
        <div class="go-row" id="go"></div>
      </section>`
  }

  const STYLES = { normal: 'lances', auto: 'martelo automático', drop: 'preço caindo' }

  function go(S) {
    const c = S.cfg
    const sum = `<p class="lbl">${E.MODES[c.mode]} · R$${c.money} cada · ${c.size} personagens · ${STYLES[c.style || 'normal']}</p>`
    if (S.me === 1) return sum + `<p class="wait-host">Esperando ${name(S, 0)} sortear os lotes…</p>`
    return sum + '<button class="btn big" type="button" data-act="start">Sortear lotes</button>'
  }

  // sala online (código de 4 letras, sem conta)
  function online(S) {
    const n = S.net || { status: 'off' }
    const head = '<span class="lbl">Jogar online</span>'
    if (n.status === 'hosting') return `<div class="online">${head}${n.error ? `<p class="neterr">${esc(n.error)}</p>` : ''}<p>Manda esse código pro seu amigo:</p><b class="code">${esc(n.code)}</b>
      <p class="note">Esperando ele entrar…</p><button class="linkish" type="button" data-act="net-leave">Cancelar</button></div>`
    if (n.status === 'joining') return `<div class="online">${head}<p>Entrando na sala ${esc(n.code)}…</p><button class="linkish" type="button" data-act="net-leave">Cancelar</button></div>`
    if (n.status === 'connected') return `<div class="online on">${head}<p><b>Conectado!</b> ${S.me === 0 ? `${name(S, 1)} está na sua sala (${esc(n.code)}). Você é o Jogador 1.` : `Você está na sala de ${name(S, 0)}. Você é o Jogador 2.`}</p>
      <button class="linkish" type="button" data-act="net-leave">Sair da sala</button></div>`
    const err = n.error ? `<p class="neterr">${esc(n.error)}</p>` : ''
    return `<div class="online">${head}<p class="note">Cada um no seu computador. Seu amigo não precisa de conta.</p>${err}
      <div class="online-row">
        <button class="btn green" type="button" data-act="net-host">Criar sala</button>
        <span class="lbl">ou</span>
        <input id="joincode" maxlength="4" autocomplete="off" placeholder="CÓDIGO" aria-label="Código da sala">
        <button class="btn paper" type="button" data-act="net-join">Entrar</button>
      </div></div>`
  }

  window.View = { esc, load, card, cover, bill, meter, name, kindOf, frameOf, rules, score, resume, setup, go, online }
})()
