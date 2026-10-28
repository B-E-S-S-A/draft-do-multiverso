// Telas do leilão e do resultado.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const { esc, card, bill, meter, name, kindOf } = V
  const KEYS = [['A', 'S', 'D', 'F'], ['J', 'K', 'L', 'Ç']]
  const INCS = [1, 2, 5, 'max']

  function auction(S) {
    const c = S.game.cfg
    return `
      <section class="auction">
        <div class="topbar">
          <p class="lbl">${E.MODES[c.mode]} · R$${c.money} cada · ${c.size} personagens</p>
          <div class="topbar-btns" id="topbtns"></div>
        </div>
        <div class="wire lots"><div class="wire-row" id="lots"></div></div>
        <div class="arena">
          <aside class="player p0" id="pl0"></aside>
          <div class="stage">
            <div id="stagecard"></div>
            <div id="stamp"></div>
            <div id="gavel"></div>
          </div>
          <aside class="player p1" id="pl1"></aside>
        </div>
      </section>`
  }

  function topButtons(S) {
    const g = S.game
    const online = S.me != null ? `<span class="chip-btn online-chip">Online · você é ${name(S, S.me)}</span>` : ''
    const sair = S.me != null ? '<button class="chip-btn" type="button" data-act="net-leave">Sair da sala</button>' : ''
    if (S.me === 1) return online + sair
    const reroll = !E.started(g) ? '<button class="chip-btn" type="button" data-act="reroll">Sortear outros lotes</button>' : ''
    const entrar = S.me == null ? '<button class="chip-btn" type="button" data-act="go-online">Jogar online</button>' : ''
    const apagar = `<button class="chip-btn" type="button" data-act="wipe">${S.confirm === 'wipe' ? 'Toque de novo pra apagar' : 'Apagar leilão'}</button>`
    return `${online}${reroll}${entrar}<button class="chip-btn" type="button" data-act="leave">Voltar às regras</button>${apagar}${sair}`
  }

  // capa virada: os próximos lotes ficam em segredo até chegar a vez deles
  const BACK = '<figure class="card back" aria-label="Lote surpresa"><b>?</b></figure>'

  function lots(S) {
    const g = S.game
    return g.lots.map((ref, i) => {
      const s = g.sold[i]
      const now = i === g.cur && !E.done(g)
      if (!s && !now) return `<div class="hang lot-mini hidden">${BACK}</div>`
      const l = E.lotOf(ref)
      const tag = s
        ? `<span class="ribbon p${s.w}">R$${s.price} · ${name(S, s.w)}</span>`
        : '<span class="ribbon now">agora</span>'
      return `<div class="hang lot-mini${now ? ' now' : ''}${s ? ' sold' : ''}" title="${esc(l.n)}">${card(l)}${tag}</div>`
    }).join('')
  }

  function facts(l) {
    const rows = []
    if (l.src === 'hq') {
      if (l.debut) rows.push(['Estreia', esc(l.debut) + (l.year ? ` <span class="yr">(${l.year})</span>` : '')])
      if (l.by) rows.push(['Criação', esc(l.by)])
    } else {
      const w = D.works[l.w]
      rows.push(['Aparece em', `${esc(w.t)} <span class="yr">(${w.y})</span>`])
    }
    rows.push(['Força', `${meter(l.f)}${E.FORCA[l.f]}`])
    rows.push(['Lado', E.LADO[l.s]])
    return `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`
  }

  function nextUp(S) {
    const g = S.game
    if (g.cur + 1 >= g.lots.length) return '<p class="next last lbl">Último lote do leilão</p>'
    return `<div class="next"><span class="lbl">Depois vem</span>${BACK}<b>Surpresa</b><small>só aparece quando chegar a vez</small></div>`
  }

  function stageCard(S) {
    const g = S.game
    const forced = E.forcedTo(g)
    if (forced >= 0 && !S.busy) {
      const full = 1 - forced
      const left = g.lots.length - g.cur
      return `
        <div class="stage-card rest">
          <div>
            <p class="lbl">Fim da disputa</p>
            <h2 class="name">${name(S, full)} fechou o time</h2>
            <p class="who">${left === 1 ? 'O último lote vai' : `Os ${left} lotes que sobraram vão`} de graça para ${name(S, forced)}.</p>
          </div>
        </div>`
    }
    const l = E.lotOf(g.lots[g.cur])
    return `
      <div class="stage-card" data-lot="${g.cur}">
        <div class="stage-cover">${card(l)}</div>
        <div class="stage-info">
          <p class="lbl lotno">Lote ${g.cur + 1} de ${g.lots.length} <span class="tag ${V.frameOf(l)}">${esc(kindOf(l))}</span></p>
          <h2 class="name">${esc(l.n)}</h2>
          <p class="who">${l.src === 'hq' ? esc(l.id) : 'vivido por ' + esc(l.actor)}</p>
          ${facts(l)}
          ${nextUp(S)}
        </div>
      </div>`
  }

  // martelinho em pixel art (cabeça + cabo em degraus), desenhado com retângulos
  const GAVEL = '<svg class="mallet" viewBox="0 0 24 24" aria-hidden="true" shape-rendering="crispEdges">' +
    '<rect x="2" y="3" width="13" height="8" fill="#1d1b2c"/><rect x="3" y="4" width="11" height="6" fill="#9a5b2b"/><rect x="3" y="4" width="11" height="2" fill="#c98446"/>' +
    '<rect x="5" y="3" width="2" height="8" fill="#1d1b2c"/><rect x="10" y="3" width="2" height="8" fill="#1d1b2c"/>' +
    '<rect x="13" y="9" width="3" height="3" fill="#1d1b2c"/><rect x="15" y="11" width="3" height="3" fill="#1d1b2c"/><rect x="17" y="13" width="3" height="3" fill="#1d1b2c"/><rect x="19" y="15" width="3" height="3" fill="#1d1b2c"/>' +
    '<rect x="14" y="10" width="2" height="1" fill="#c98446"/><rect x="16" y="12" width="2" height="1" fill="#c98446"/><rect x="18" y="14" width="2" height="1" fill="#c98446"/></svg>'

  function stamp(S) {
    if (!S.busy) return ''
    const b = S.busy
    return `<div class="stamp p${b.w}" role="status">${GAVEL}<b>Vendido!</b><span>${name(S, b.w)} · R$${b.price}</span></div>`
  }

  // estilo da partida: lances normais, martelo automático ou preço caindo
  const styleOf = (S) => (S.game.cfg.style || S.cfg.style || 'normal')

  function dropBox(S) {
    const d = S.drop
    if (!d) return '<div class="bidbox drop"><span class="lbl">Preço caindo</span><b>…</b><span>Prepara</span></div>'
    const pct = d.start ? Math.round((d.price / d.start) * 100) : 0
    const label = d.phase === 'ready' ? 'Prepara…' : d.price === 0 ? 'Ninguém quis? Vai de graça pro dono da vez' : 'Caindo! Quem tocar primeiro leva'
    return `<div class="bidbox drop${d.phase === 'ready' ? ' ready' : ''}"><span class="lbl">Preço caindo</span><b>R$${d.price}</b><span>${label}</span>
      <span class="dropbar" aria-hidden="true"><i style="width:${pct}%"></i></span></div>`
  }

  function gavel(S) {
    const g = S.game
    const forced = E.forcedTo(g)
    const undoBtn = `<button class="btn paper" type="button" data-act="undo" ${S.history.length ? '' : 'disabled'}>Desfazer<kbd>Z</kbd></button>`
    if (forced >= 0 && !S.busy) {
      return `<div class="gavel">
        <button class="btn big ${forced ? 'blue' : 'red'}" type="button" data-act="rest">Entregar o resto</button>
        ${undoBtn}
      </div>`
    }
    if (styleOf(S) === 'drop') {
      return `<div class="gavel">${dropBox(S)}<div class="hammer-col">${undoBtn}</div></div>`
    }
    const lead = g.leader
    const op = E.opener(g)
    const log = (g.log || []).slice(-6).map(([p, v]) => `<i class="p${p}">R$${v}</i>`).join('')
    const note = S.note ? `<span class="autonote">${esc(S.note)}</span>` : ''
    const box = lead >= 0
      ? `<div class="bidbox p${lead}"><span class="lbl">Lance atual</span><b>R$${g.bid}</b><span>${name(S, lead)} na frente</span>${log ? `<span class="log" aria-label="Lances deste lote">${log}</span>` : ''}${note}</div>`
      : `<div class="bidbox wait p${op}"><span class="lbl">Abertura</span><b>Vez de ${name(S, op)}</b><span>${name(S, op)} dá o primeiro lance. Depois os dois podem cobrir.</span></div>`
    const t = S.timer
    const pips = styleOf(S) === 'auto' && t ? `<div class="countdown" aria-live="polite"><span class="lbl">${t.label}</span><span class="pips">${[0, 1, 2].map((i) => `<i class="${i < t.step ? 'on' : ''}"></i>`).join('')}</span></div>` : ''
    // online: só quem está atrás pode bater o martelo (é ele quem desiste)
    const online = S.me != null
    const mineLeads = online && lead === S.me
    const hammerOff = S.busy || lead < 0 || mineLeads
    const hammerLabel = online ? (mineLeads ? 'Esperando…' : 'Passo · vendido!') : 'Vendido!'
    return `<div class="gavel">
      ${box}
      <div class="hammer-col">
        <button class="btn big green" type="button" data-act="hammer" ${hammerOff ? 'disabled' : ''}>${hammerLabel}<kbd>Enter</kbd></button>
        ${undoBtn}
      </div>
      ${pips}
    </div>`
  }

  function slots(S, p) {
    const g = S.game
    let h = ''
    for (let i = 0; i < g.team; i++) {
      const t = g.teams[p][i]
      if (t) {
        const l = E.lotOf(g.lots[t.lot])
        h += `<div class="slot filled" title="${esc(l.n)}">${card(l)}<span class="price">R$${t.price}</span></div>`
      } else h += `<div class="slot"><span>${i + 1}</span></div>`
    }
    return `<div class="slots" style="--n:${Math.min(g.team, 5)}">${h}</div>`
  }

  // valor livre: régua + campo numérico + botão
  function custom(S, p, cls) {
    const g = S.game
    if (S.busy || !E.canBid(g, p)) return ''
    const lo = E.minBid(g, p)
    const hi = E.maxBid(g, p)
    if (hi <= lo) return ''
    return `<div class="custom">
      <label class="lbl" for="rng${p}">Outro valor</label>
      <div class="custom-row">
        <input type="range" id="rng${p}" class="rng ${cls}" min="${lo}" max="${hi}" step="1" value="${lo}" data-p="${p}">
        <input type="number" id="num${p}" class="num" min="${lo}" max="${hi}" step="1" value="${lo}" inputmode="numeric" data-p="${p}" aria-label="Valor do lance">
      </div>
      <button class="btn ${cls} give" type="button" data-act="bid-custom" data-p="${p}">Dar R$<span id="give${p}">${lo}</span></button>
    </div>`
  }

  function controls(S, p, cls) {
    const g = S.game
    const open = E.open(g, p)
    if (open === 0) return { cap: 'Time completo!', html: '' }
    if (styleOf(S) === 'drop') {
      const d = S.drop
      const price = d ? d.price : 0
      const can = d && d.phase === 'drop' && !S.busy && g.money[p] >= price
      const cap = g.money[p] < price ? `Você tem R$${g.money[p]}. Espera cair.` : 'Toca antes do outro!'
      return { cap, html: `<button class="btn ${cls} grab" type="button" data-act="grab" data-p="${p}" ${can ? '' : 'disabled'}><span>Pego!</span><small>R$${price}</small><kbd>${p ? 'L' : 'A'}</kbd></button>` }
    }
    const lead = g.leader === p
    const op = E.opener(g)
    if (lead) return { cap: 'Você está na frente', html: '' }
    if (g.leader < 0 && p !== op) return { cap: `Espera ${name(S, op)} abrir o lance`, html: '' }
    // sem dinheiro pra cobrir: nada de botão que não funciona
    if (g.leader >= 0 && g.money[p] < g.bid + 1) return { cap: '', html: `<p class="broke">Sem dinheiro pra cobrir.<br>Você tem R$${g.money[p]}.</p>` }
    const opening = g.leader < 0 && p === op
    let html
    if (opening && g.money[p] === 0) {
      html = `<div class="bids"><button class="btn ${cls} wide" type="button" data-act="bid" data-p="${p}" data-inc="1" ${S.busy ? 'disabled' : ''}>Abrir por R$0</button></div>`
    } else {
      html = '<div class="bids">' + INCS.map((inc, k) => {
        const v = S.busy ? null : E.nextBid(g, p, inc)
        const label = inc === 'max' ? 'Tudo' : opening ? 'R$' + inc : '+' + inc
        return `<button class="btn ${cls}" type="button" data-act="bid" data-p="${p}" data-inc="${inc}" ${v !== null ? '' : 'disabled'}>
          <span>${label}</span><small>${v !== null ? 'R$' + v : '—'}</small><kbd>${KEYS[S.me != null ? 0 : p][k]}</kbd></button>`
      }).join('') + '</div>' + custom(S, p, cls)
    }
    const cap = opening ? `<b>Sua vez de abrir.</b> Você tem R$${g.money[p]}` : `Pra cobrir: R$${g.bid + 1} ou mais`
    return { cap, html }
  }

  function player(S, p) {
    const g = S.game
    const lead = g.leader === p
    const cls = p ? 'blue' : 'red'
    const remote = S.me != null && S.me !== p
    const opening = g.leader < 0 && p === E.opener(g) && E.canBid(g, p) && styleOf(S) !== 'drop'
    let { cap, html } = controls(S, p, cls)
    if (remote) {
      html = `<p class="remote">Joga do computador ${S.me === 0 ? 'dele' : 'do anfitrião'}</p>`
      if (opening) cap = `Vez de ${name(S, p)} abrir o lance`
      else if (cap === 'Você está na frente') cap = `${name(S, p)} está na frente`
    }
    const flag = lead ? '<span class="flag">na frente</span>' : opening ? '<span class="flag">sua vez</span>' : ''
    return `
      <div class="ph"><span class="lbl">Jogador ${p + 1}${S.me === p ? ' · você' : ''}</span>${flag}</div>
      <h3>${name(S, p)}</h3>
      <div class="purse">${bill(g.money[p])}</div>
      ${cap ? `<p class="cap">${cap}</p>` : ''}
      ${html}
      <p class="lbl team-lbl">Time ${g.teams[p].length}/${g.team}</p>
      ${slots(S, p)}`
  }

  // ---------- resultado ----------
  function side(S, p) {
    const g = S.game
    const t = E.teamStats(g, p)
    const won = g.result === p
    const sides = [t.heroes && `${t.heroes} herói${t.heroes > 1 ? 's' : ''}`, t.villains && `${t.villains} vilão${t.villains > 1 ? 'es' : ''}`, t.anti && `${t.anti} anti-herói${t.anti > 1 ? 's' : ''}`].filter(Boolean).join(' · ')
    return `
      <div class="side p${p}${won ? ' won' : ''}">
        <div class="ph"><span class="lbl">Jogador ${p + 1}</span>${won ? '<span class="flag">venceu</span>' : ''}</div>
        <h3>${name(S, p)}</h3>
        <div class="stats">
          <span>Gastou <b>R$${t.spent}</b></span><span>Sobrou <b>R$${t.left}</b></span><span>Força somada <b>${t.power}</b></span>
        </div>
        <p class="note">${sides}</p>
        <div class="team-grid">${t.lots.map((l) => `
          <figure class="tcard">${card(l)}<figcaption><b>${esc(l.n)}</b><span>${esc(kindOf(l))} · R$${l.price}</span></figcaption></figure>`).join('')}
        </div>
      </div>`
  }

  // moeda de R$1 (anel dourado, miolo prateado): cara = jogador 1, coroa = jogador 2
  function coin(S) {
    const c = S.coin
    if (!c) return ''
    const face = (p) => `<span class="face f${p}"><b>${p ? 'Coroa' : 'Cara'}</b><small>${name(S, p)}</small></span>`
    return `<div class="coinbox" data-n="${c.n}">
      <div class="coin${c.spinning ? ' spin s' + c.v : ' land' + c.v}">${face(0)}${face(1)}</div>
      <p class="coin-msg" role="status">${c.spinning ? 'Girando…' : `Deu ${c.v ? 'coroa' : 'cara'}! ${name(S, c.v)} venceu.`}</p>
    </div>`
  }

  function verdict(S) {
    const g = S.game
    const pick = (v, label, cls) => `<button class="btn ${cls}" type="button" data-act="win" data-v="${v}" aria-pressed="${g.result === v}">${label}</button>`
    return `
      <h2>Quem montou o melhor time?</h2>
      <p class="note">Discutam e marquem. O placar fica salvo neste aparelho.</p>
      <div class="verdict-btns">
        ${pick(0, name(S, 0) + ' venceu', 'red')}${pick(2, 'Empate', 'paper')}${pick(1, name(S, 1) + ' venceu', 'blue')}
        <button class="btn" type="button" data-act="coin" ${S.coin && S.coin.spinning ? 'disabled' : ''}>Não sabemos · cara ou coroa</button>
      </div>
      ${coin(S)}
      <div id="score">${V.score(S)}</div>
      <div class="verdict-btns end">
        ${S.me === 1 ? `<p class="note">Esperando ${name(S, 0)} começar outro draft.</p>` : '<button class="btn big" type="button" data-act="again">Novo draft</button>'}
        <button class="btn paper" type="button" data-act="copy">Copiar times</button>
        ${S.me === 1 ? '' : '<button class="btn paper" type="button" data-act="rules">Mudar regras</button>'}
        ${S.me != null ? '<button class="btn paper" type="button" data-act="net-leave">Sair da sala</button>' : ''}
      </div>
      <p class="note" id="copied" role="status"></p>`
  }

  function result(S) {
    return `
      <section class="result">
        <div class="vs">${side(S, 0)}<div class="vs-mark" aria-hidden="true">VS</div>${side(S, 1)}</div>
        <div class="panel verdict" id="verdict">${verdict(S)}</div>
      </section>`
  }

  function shareText(S) {
    const g = S.game
    const head = `DRAFT DO MULTIVERSO · ${E.MODES[g.cfg.mode]} · R$${g.cfg.money} · ${g.cfg.size} personagens`
    const team = (p) => {
      const t = E.teamStats(g, p)
      return `${S.cfg.names[p] || 'Jogador ' + (p + 1)} (gastou R$${t.spent}):\n` +
        t.lots.map((l) => `• ${l.n} (${l.src === 'hq' ? 'HQ' : 'MCU'}) R$${l.price}`).join('\n')
    }
    return `${head}\n\n${team(0)}\n\n${team(1)}`
  }

  Object.assign(window.View, { auction, topButtons, lots, stageCard, stamp, gavel, player, result, verdict, shareText })
})()

