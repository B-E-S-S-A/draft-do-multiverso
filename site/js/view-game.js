// Telas do leilão e do resultado.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const { esc, card, bill, meter, name, kindOf, nomeDe } = V
  const t = (pt, en) => window.Lingua.t(pt, en)
  const KEYS = [['A', 'S', 'D', 'F'], ['J', 'K', 'L', 'Ç']]
  const INCS = [1, 2, 5, 'max']

  function auction(S) {
    const c = S.game.cfg
    return `
      <section class="auction">
        <div class="topbar">
          <p class="lbl">${V.modo(c.mode)} · R$${c.money} ${t('cada', 'each')} · ${c.size} ${t('personagens', 'characters')}</p>
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
    const online = S.me != null ? `<span class="chip-btn online-chip">Online · ${t('você é', 'you are')} ${name(S, S.me)}</span>` : ''
    const sair = S.me != null ? `<button class="chip-btn" type="button" data-act="net-leave">${t('Sair da sala', 'Leave room')}</button>` : ''
    if (S.me === 1) return online + sair
    const reroll = !E.started(g) ? `<button class="chip-btn" type="button" data-act="reroll">${t('Sortear outros lotes', 'Draw other lots')}</button>` : ''
    const entrar = S.me == null ? `<button class="chip-btn" type="button" data-act="go-online">${t('Jogar online', 'Play online')}</button>` : ''
    const apagar = `<button class="chip-btn" type="button" data-act="wipe">${S.confirm === 'wipe' ? t('Toque de novo pra apagar', 'Tap again to delete') : t('Apagar leilão', 'Delete auction')}</button>`
    return `${online}${reroll}${entrar}<button class="chip-btn" type="button" data-act="leave">${t('Voltar às regras', 'Back to rules')}</button>${apagar}${sair}`
  }

  // capa virada: os próximos lotes ficam em segredo até chegar a vez deles
  const BACK = () => `<figure class="card back" aria-label="${t('Lote surpresa', 'Surprise lot')}"><b>?</b></figure>`

  function lots(S) {
    const g = S.game
    return g.lots.map((ref, i) => {
      const s = g.sold[i]
      const now = i === g.cur && !E.done(g)
      if (!s && !now) return `<div class="hang lot-mini hidden">${BACK()}</div>`
      const l = E.lotOf(ref)
      const tag = s
        ? `<span class="ribbon p${s.w}">R$${s.price} · ${name(S, s.w)}</span>`
        : `<span class="ribbon now">${t('agora', 'now')}</span>`
      return `<div class="hang lot-mini${now ? ' now' : ''}${s ? ' sold' : ''}" title="${esc(nomeDe(l))}">${card(l)}${tag}</div>`
    }).join('')
  }

  function facts(l) {
    const rows = []
    if (l.src === 'hq') {
      if (l.debut) rows.push([t('Estreia', 'Debut'), esc(l.debut) + (l.year ? ` <span class="yr">(${l.year})</span>` : '')])
      if (l.by) rows.push([t('Criação', 'Created by'), esc(V.porDe(l))])
    } else {
      const w = D.works[l.w]
      rows.push([t('Aparece em', 'Appears in'), `${esc(V.obraDe(l.w))} <span class="yr">(${w.y})</span>`])
    }
    rows.push([t('Força', 'Power'), `${meter(l.f)}${V.forca(l.f)}`])
    rows.push([t('Lado', 'Side'), V.lado(l.s)])
    return `<dl class="facts">${rows.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`
  }

  function nextUp(S) {
    const g = S.game
    if (g.cur + 1 >= g.lots.length) return `<p class="next last lbl">${t('Último lote do leilão', 'Last lot of the auction')}</p>`
    return `<div class="next"><span class="lbl">${t('Depois vem', 'Up next')}</span>${BACK()}<b>${t('Surpresa', 'Surprise')}</b><small>${t('só aparece quando chegar a vez', 'only shows up when its turn comes')}</small></div>`
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
            <p class="lbl">${t('Fim da disputa', 'Bidding is over')}</p>
            <h2 class="name">${t(`${name(S, full)} fechou o time`, `${name(S, full)} filled the team`)}</h2>
            <p class="who">${t(`${left === 1 ? 'O último lote vai' : `Os ${left} lotes que sobraram vão`} de graça para ${name(S, forced)}.`, `${left === 1 ? 'The last lot goes' : `The ${left} remaining lots go`} to ${name(S, forced)} for free.`)}</p>
          </div>
        </div>`
    }
    const l = E.lotOf(g.lots[g.cur])
    return `
      <div class="stage-card" data-lot="${g.cur}">
        <div class="stage-cover">${card(l)}</div>
        <div class="stage-info">
          <p class="lbl lotno">${t('Lote', 'Lot')} ${g.cur + 1} ${t('de', 'of')} ${g.lots.length} <span class="tag ${V.frameOf(l)}">${esc(kindOf(l))}</span></p>
          <h2 class="name">${esc(nomeDe(l))}</h2>
          <p class="who">${l.src === 'hq' ? esc(V.idDe(l)) : t('vivido por ', 'played by ') + esc(V.atorDe(l))}</p>
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
    return `<div class="stamp p${b.w}" role="status">${GAVEL}<b>${t('Vendido!', 'Sold!')}</b><span>${name(S, b.w)} · R$${b.price}</span></div>`
  }

  // estilo da partida: lances normais, martelo automático ou preço caindo
  const styleOf = (S) => (S.game.cfg.style || S.cfg.style || 'normal')

  function dropBox(S) {
    const d = S.drop
    if (!d) return `<div class="bidbox drop"><span class="lbl">${t('Preço caindo', 'Falling price')}</span><b>…</b><span>${t('Prepara', 'Get ready')}</span></div>`
    const pct = d.start ? Math.round((d.price / d.start) * 100) : 0
    const label = d.phase === 'ready' ? t('Prepara…', 'Get ready…') : d.price === 0 ? t('Ninguém quis? Vai de graça pro dono da vez', 'Nobody wanted it? It goes free to whoever’s turn it is') : t('Caindo! Quem tocar primeiro leva', 'Dropping! First to tap takes it')
    return `<div class="bidbox drop${d.phase === 'ready' ? ' ready' : ''}"><span class="lbl">${t('Preço caindo', 'Falling price')}</span><b>R$${d.price}</b><span>${label}</span>
      <span class="dropbar" aria-hidden="true"><i style="width:${pct}%"></i></span></div>`
  }

  // o martelo automático e os avisos chegam como números/códigos; cada aparelho escreve na sua língua
  const textoTimer = (tm) => (tm.step ? t(['Dou-lhe uma…', 'Dou-lhe duas…', 'Dou-lhe três…'], ['Going once…', 'Going twice…', 'Going three times…'])[tm.step - 1] : t('Alguém cobre?', 'Anyone outbid?'))
  const textoNota = (S, n) => (typeof n === 'string' ? n : n.k === 'abriu0'
    ? t(`${name(S, n.p)} está sem dinheiro e abriu por R$0.`, `${name(S, n.p)} is out of money and opened at R$0.`)
    : t(`${name(S, n.p)} não tem dinheiro pra cobrir. Vendendo…`, `${name(S, n.p)} cannot afford to outbid. Selling…`))

  function gavel(S) {
    const g = S.game
    const forced = E.forcedTo(g)
    const undoBtn = `<button class="btn paper" type="button" data-act="undo" ${S.history.length ? '' : 'disabled'}>${t('Desfazer', 'Undo')}<kbd>Z</kbd></button>`
    if (forced >= 0 && !S.busy) {
      return `<div class="gavel">
        <button class="btn big ${forced ? 'blue' : 'red'}" type="button" data-act="rest">${t('Entregar o resto', 'Hand over the rest')}</button>
        ${undoBtn}
      </div>`
    }
    if (styleOf(S) === 'drop') {
      return `<div class="gavel">${dropBox(S)}<div class="hammer-col">${undoBtn}</div></div>`
    }
    const lead = g.leader
    const op = E.opener(g)
    const log = (g.log || []).slice(-6).map(([p, v]) => `<i class="p${p}">R$${v}</i>`).join('')
    const note = S.note ? `<span class="autonote">${esc(textoNota(S, S.note))}</span>` : ''
    const box = lead >= 0
      ? `<div class="bidbox p${lead}"><span class="lbl">${t('Lance atual', 'Current bid')}</span><b>R$${g.bid}</b><span>${t(`${name(S, lead)} na frente`, `${name(S, lead)} leads`)}</span>${log ? `<span class="log" aria-label="${t('Lances deste lote', 'Bids on this lot')}">${log}</span>` : ''}${note}</div>`
      : `<div class="bidbox wait p${op}"><span class="lbl">${t('Abertura', 'Opening')}</span><b>${t(`Vez de ${name(S, op)}`, `${name(S, op)}’s turn`)}</b><span>${t(`${name(S, op)} dá o primeiro lance. Depois os dois podem cobrir.`, `${name(S, op)} makes the first bid. Then both can outbid.`)}</span></div>`
    const tm = S.timer
    const pips = styleOf(S) === 'auto' && tm ? `<div class="countdown" aria-live="polite"><span class="lbl">${textoTimer(tm)}</span><span class="pips">${[0, 1, 2].map((i) => `<i class="${i < tm.step ? 'on' : ''}"></i>`).join('')}</span></div>` : ''
    // online: só quem está atrás pode bater o martelo (é ele quem desiste)
    const online = S.me != null
    const mineLeads = online && lead === S.me
    const hammerOff = S.busy || lead < 0 || mineLeads
    const hammerLabel = online ? (mineLeads ? t('Esperando…', 'Waiting…') : t('Passo · vendido!', 'Pass · sold!')) : t('Vendido!', 'Sold!')
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
      const tm = g.teams[p][i]
      if (tm) {
        const l = E.lotOf(g.lots[tm.lot])
        h += `<div class="slot filled" title="${esc(nomeDe(l))}">${card(l)}<span class="price">R$${tm.price}</span></div>`
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
      <label class="lbl" for="rng${p}">${t('Outro valor', 'Other amount')}</label>
      <div class="custom-row">
        <input type="range" id="rng${p}" class="rng ${cls}" min="${lo}" max="${hi}" step="1" value="${lo}" data-p="${p}">
        <input type="number" id="num${p}" class="num" min="${lo}" max="${hi}" step="1" value="${lo}" inputmode="numeric" data-p="${p}" aria-label="${t('Valor do lance', 'Bid amount')}">
      </div>
      <button class="btn ${cls} give" type="button" data-act="bid-custom" data-p="${p}">${t('Dar', 'Bid')} R$<span id="give${p}">${lo}</span></button>
    </div>`
  }

  function controls(S, p, cls) {
    const g = S.game
    const open = E.open(g, p)
    if (open === 0) return { cap: t('Time completo!', 'Team complete!'), html: '' }
    if (styleOf(S) === 'drop') {
      const d = S.drop
      const price = d ? d.price : 0
      const can = d && d.phase === 'drop' && !S.busy && g.money[p] >= price
      const cap = g.money[p] < price ? t(`Você tem R$${g.money[p]}. Espera cair.`, `You have R$${g.money[p]}. Wait for it to drop.`) : t('Toca antes do outro!', 'Tap before the other one!')
      return { cap, html: `<button class="btn ${cls} grab" type="button" data-act="grab" data-p="${p}" ${can ? '' : 'disabled'}><span>${t('Pego!', 'Mine!')}</span><small>R$${price}</small><kbd>${p ? 'L' : 'A'}</kbd></button>` }
    }
    const lead = g.leader === p
    const op = E.opener(g)
    if (lead) return { cap: t('Você está na frente', 'You are in the lead'), html: '', frente: true }
    if (g.leader < 0 && p !== op) return { cap: t(`Espera ${name(S, op)} abrir o lance`, `Wait for ${name(S, op)} to open the bidding`), html: '' }
    // sem dinheiro pra cobrir: nada de botão que não funciona
    if (g.leader >= 0 && g.money[p] < g.bid + 1) return { cap: '', html: `<p class="broke">${t('Sem dinheiro pra cobrir.', 'Not enough money to outbid.')}<br>${t('Você tem', 'You have')} R$${g.money[p]}.</p>` }
    const opening = g.leader < 0 && p === op
    let html
    if (opening && g.money[p] === 0) {
      html = `<div class="bids"><button class="btn ${cls} wide" type="button" data-act="bid" data-p="${p}" data-inc="1" ${S.busy ? 'disabled' : ''}>${t('Abrir por R$0', 'Open at R$0')}</button></div>`
    } else {
      html = '<div class="bids">' + INCS.map((inc, k) => {
        const v = S.busy ? null : E.nextBid(g, p, inc)
        const label = inc === 'max' ? t('Tudo', 'All') : opening ? 'R$' + inc : '+' + inc
        return `<button class="btn ${cls}" type="button" data-act="bid" data-p="${p}" data-inc="${inc}" ${v !== null ? '' : 'disabled'}>
          <span>${label}</span><small>${v !== null ? 'R$' + v : '—'}</small><kbd>${KEYS[S.me != null ? 0 : p][k]}</kbd></button>`
      }).join('') + '</div>' + custom(S, p, cls)
    }
    const cap = opening ? t(`<b>Sua vez de abrir.</b> Você tem R$${g.money[p]}`, `<b>Your turn to open.</b> You have R$${g.money[p]}`) : t(`Pra cobrir: R$${g.bid + 1} ou mais`, `To outbid: R$${g.bid + 1} or more`)
    return { cap, html }
  }

  function player(S, p) {
    const g = S.game
    const lead = g.leader === p
    const cls = p ? 'blue' : 'red'
    const remote = S.me != null && S.me !== p
    const opening = g.leader < 0 && p === E.opener(g) && E.canBid(g, p) && styleOf(S) !== 'drop'
    let { cap, html, frente } = controls(S, p, cls)
    if (remote) {
      html = `<p class="remote">${S.me === 0 ? t('Joga do computador dele', 'Plays from their own computer') : t('Joga do computador do anfitrião', 'Plays from the host’s computer')}</p>`
      if (opening) cap = t(`Vez de ${name(S, p)} abrir o lance`, `${name(S, p)}’s turn to open the bidding`)
      else if (frente) cap = t(`${name(S, p)} está na frente`, `${name(S, p)} is in the lead`)
    }
    const flag = lead ? `<span class="flag">${t('na frente', 'leading')}</span>` : opening ? `<span class="flag">${t('sua vez', 'your turn')}</span>` : ''
    return `
      <div class="ph"><span class="lbl">${t('Jogador', 'Player')} ${p + 1}${S.me === p ? t(' · você', ' · you') : ''}</span>${flag}</div>
      <h3>${name(S, p)}</h3>
      <div class="purse">${bill(g.money[p])}</div>
      ${cap ? `<p class="cap">${cap}</p>` : ''}
      ${html}
      <p class="lbl team-lbl">${t('Time', 'Team')} ${g.teams[p].length}/${g.team}</p>
      ${slots(S, p)}`
  }

  // ---------- resultado ----------
  function side(S, p) {
    const g = S.game
    const st = E.teamStats(g, p)
    const won = g.result === p
    const conta = (n, um, varios) => n && `${n} ${n > 1 ? varios : um}`
    const sides = [conta(st.heroes, t('herói', 'hero'), t('heróis', 'heroes')), conta(st.villains, t('vilão', 'villain'), t('vilões', 'villains')), conta(st.anti, t('anti-herói', 'anti-hero'), t('anti-heróis', 'anti-heroes'))].filter(Boolean).join(' · ')
    return `
      <div class="side p${p}${won ? ' won' : ''}">
        <div class="ph"><span class="lbl">${t('Jogador', 'Player')} ${p + 1}</span>${won ? `<span class="flag">${t('venceu', 'won')}</span>` : ''}</div>
        <h3>${name(S, p)}</h3>
        <div class="stats">
          <span>${t('Gastou', 'Spent')} <b>R$${st.spent}</b></span><span>${t('Sobrou', 'Left')} <b>R$${st.left}</b></span><span>${t('Força somada', 'Total power')} <b>${st.power}</b></span>
        </div>
        <p class="note">${sides}</p>
        <div class="team-grid">${st.lots.map((l) => `
          <figure class="tcard">${card(l)}<figcaption><b>${esc(nomeDe(l))}</b><span>${esc(kindOf(l))} · R$${l.price}</span></figcaption></figure>`).join('')}
        </div>
      </div>`
  }

  // moeda de R$1 (anel dourado, miolo prateado): cara = jogador 1, coroa = jogador 2
  function coin(S) {
    const c = S.coin
    if (!c) return ''
    const face = (p) => `<span class="face f${p}"><b>${p ? t('Coroa', 'Tails') : t('Cara', 'Heads')}</b><small>${name(S, p)}</small></span>`
    return `<div class="coinbox" data-n="${c.n}">
      <div class="coin${c.spinning ? ' spin s' + c.v : ' land' + c.v}">${face(0)}${face(1)}</div>
      <p class="coin-msg" role="status">${c.spinning ? t('Girando…', 'Spinning…') : t(`Deu ${c.v ? 'coroa' : 'cara'}! ${name(S, c.v)} venceu.`, `${c.v ? 'Tails' : 'Heads'}! ${name(S, c.v)} won.`)}</p>
    </div>`
  }

  function verdict(S) {
    const g = S.game
    const pick = (v, label, cls) => `<button class="btn ${cls}" type="button" data-act="win" data-v="${v}" aria-pressed="${g.result === v}">${label}</button>`
    return `
      <h2>${t('Quem montou o melhor time?', 'Who built the best team?')}</h2>
      <p class="note">${t('Discutam e marquem. O placar fica salvo neste aparelho.', 'Discuss and pick. The score is saved on this device.')}</p>
      <div class="verdict-btns">
        ${pick(0, name(S, 0) + t(' venceu', ' won'), 'red')}${pick(2, t('Empate', 'Tie'), 'paper')}${pick(1, name(S, 1) + t(' venceu', ' won'), 'blue')}
        <button class="btn" type="button" data-act="coin" ${S.coin && S.coin.spinning ? 'disabled' : ''}>${t('Não sabemos · cara ou coroa', 'Can’t decide · flip a coin')}</button>
      </div>
      ${coin(S)}
      <div id="score">${V.score(S)}</div>
      <div class="verdict-btns end">
        ${S.me === 1 ? `<p class="note">${t(`Esperando ${name(S, 0)} começar outro draft.`, `Waiting for ${name(S, 0)} to start another draft.`)}</p>` : `<button class="btn big" type="button" data-act="again">${t('Novo draft', 'New draft')}</button>`}
        <button class="btn paper" type="button" data-act="copy">${t('Copiar times', 'Copy teams')}</button>
        ${S.me === 1 ? '' : `<button class="btn paper" type="button" data-act="rules">${t('Mudar regras', 'Change rules')}</button>`}
        ${S.me != null ? `<button class="btn paper" type="button" data-act="net-leave">${t('Sair da sala', 'Leave room')}</button>` : ''}
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
    const head = `${t('DRAFT DO MULTIVERSO', 'MULTIVERSE DRAFT')} · ${V.modo(g.cfg.mode)} · R$${g.cfg.money} · ${g.cfg.size} ${t('personagens', 'characters')}`
    const team = (p) => {
      const st = E.teamStats(g, p)
      return `${S.cfg.names[p] && S.cfg.names[p] !== 'Jogador ' + (p + 1) ? S.cfg.names[p] : t('Jogador ', 'Player ') + (p + 1)} (${t('gastou', 'spent')} R$${st.spent}):\n` +
        st.lots.map((l) => `• ${nomeDe(l)} (${l.src === 'hq' ? t('HQ', 'Comics') : 'MCU'}) R$${l.price}`).join('\n')
    }
    return `${head}\n\n${team(0)}\n\n${team(1)}`
  }

  Object.assign(window.View, { auction, topButtons, lots, stageCard, stamp, gavel, player, result, verdict, shareText })
})()

