// Telas da Grade do Multiverso. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é grade.js.
// Cada aparelho escreve na própria língua: o anfitrião manda só ids de categoria e chaves de personagem.
(function () {
  const V = window.View
  const E = window.Engine
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const GD = () => window.GradeDados
  const COR = ['p1', 'p2']
  // os modelos prontos; mexer nas barras vira "do seu jeito"
  const MODELOS = [
    { id: 'velha', L: 3, C: 3, K: 3, pt: 'Jogo da velha', en: 'Tic-tac-toe' },
    { id: 'classico', L: 5, C: 4, K: 4, pt: 'Clássico', en: 'Classic' },
    { id: 'grandao', L: 5, C: 5, K: 5, pt: 'Grandão', en: 'Big one' },
  ]

  // personagem: capa, nome na língua de quem olha, identidade
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const nome = (key) => (indice[key] === undefined ? key : V.nomeDe(lote(key)))
  const ident = (key) => (indice[key] === undefined ? '' : V.idDe(lote(key)) || '')
  const capa = (key) => V.cover(lote(key))
  const cat = (id) => GD().porId[id]
  const rotulo = (id) => (cat(id) ? cat(id)[en() ? 'en' : 'pt'][0] : id)
  const dica = (id) => (cat(id) ? cat(id)[en() ? 'en' : 'pt'][1] : '')
  const nomeJ = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  // o porquê de um acerto que surpreende ("Tem irmão: Arno Stark, na HQ")
  const nota = (id, key) => { const n = ((window.GradeNotas || {})[id] || {})[key]; return !n ? '' : Array.isArray(n) ? n[en() ? 1 : 0] : n }
  const JOIA = { tempo: [['Joia do Tempo', 'Time Stone'], ['joga de novo', 'plays again']], poder: [['Joia do Poder', 'Power Stone'], ['toma uma casa do outro', 'takes one of the other player’s squares']] }
  const joiaNome = (tipo) => t(...JOIA[tipo][0])

  // ---------- opções: tamanho (linhas, colunas, em linha), roubar, relógio ----------
  function opcoes(o, pode, attr) {
    const dis = pode ? '' : ' disabled'
    const modelo = MODELOS.find((m) => m.L === o.L && m.C === o.C && m.K === o.K)
    const barra = (k, min, max, rot) => `<label class="gd-barra"><span>${rot}</span>
      <input type="range" min="${min}" max="${max}" step="1" value="${o[k]}" data-${attr}="${k}"${dis}><b data-x="${k}">${o[k]}</b></label>`
    const maxK = Math.max(o.L, o.C)
    const tam = `<div class="field"><span class="lbl">${t('Grid', 'Grid')}</span>
      <div class="presets">${MODELOS.map((m) => `<button class="preset" type="button" data-${attr}="modelo" data-v="${m.id}" aria-pressed="${modelo === m}"${dis}>${t(m.pt, m.en)} <small>${m.L}×${m.C}</small></button>`).join('')}
        <span class="preset gd-seu${modelo ? '' : ' on'}">${t('Do seu jeito', 'Your way')}</span></div>
      <div class="gd-barras">${barra('L', 2, 6, t('Linhas', 'Rows'))}${barra('C', 2, 6, t('Colunas', 'Columns'))}${barra('K', 2, maxK, t('Em linha pra ganhar', 'In a row to win'))}</div>
      <p class="note" data-x="resumo">${resumo(o)}</p></div>`
    const roubo = `<div class="field"><span class="lbl">${t('Casa do outro', 'Other player’s squares')}</span><div class="presets">
      <button class="preset" type="button" data-${attr}="roubar" data-v="0" aria-pressed="${!o.roubar}"${dis}>${t('Clássico: não rouba', 'Classic: no stealing')}</button>
      <button class="preset" type="button" data-${attr}="roubar" data-v="1" aria-pressed="${!!o.roubar}"${dis}>${t('Pode roubar', 'Stealing on')}</button></div>
      ${o.roubar ? `<p class="note">${t('Pra roubar, diga outro personagem que também vale na casa.', 'To steal, name another character who also fits the square.')}</p>` : ''}</div>`
    const rel = `<div class="field"><span class="lbl">${t('Relógio por vez', 'Turn clock')}</span><div class="presets">${[0, 30, 60].map((s) =>
      `<button class="preset" type="button" data-${attr}="relogio" data-v="${s}" aria-pressed="${o.relogio === s}"${dis}>${s ? s + ' s' : t('Sem relógio', 'No clock')}</button>`).join('')}</div></div>`
    return tam + roubo + rel
  }
  const resumo = (o) => t(`${o.L} linhas × ${o.C} colunas = ${o.L * o.C} casas · ganha quem fizer ${o.K} seguidas`, `${o.L} rows × ${o.C} columns = ${o.L * o.C} squares · first to get ${o.K} in a row wins`)

  function como() {
    return `<ol class="how">${t(`
      <li>Cada linha e cada coluna do grid tem uma categoria: "Fase 4 do MCU", "Tem irmão ou irmã", "Usa capa"…</li>
      <li>Na sua vez, escolha uma casa e diga um personagem que vale <b>nas duas</b>. É só começar a digitar que os nomes aparecem.</li>
      <li>Acertou: a casa é sua, com a capa do personagem. Errou: passa a vez. Cada personagem só vale uma vez.</li>
      <li>Faça a sequência (de lado, de cima pra baixo ou na diagonal) e ganhe. Se ninguém fizer, ganha quem tiver mais casas.</li>`, `
      <li>Every row and every column of the grid has a category: "MCU Phase 4", "Has a sibling", "Wears a cape"…</li>
      <li>On your turn, pick a square and name a character who fits <b>both</b>. Start typing and names show up.</li>
      <li>Right: the square is yours, with the character’s cover. Wrong: you lose the turn. Each character only counts once.</li>
      <li>Get the run (across, down or diagonal) to win. If nobody does, whoever has the most squares wins.</li>`)}
    </ol>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui) {
    return `<section class="setup gd">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Num celular só', 'On one phone')}</h2>
          <div class="field"><span class="lbl">${t('Quem joga', 'Who plays')}</span><div class="gd-dupla">
            ${[0, 1].map((p) => `<label class="imp-nome gd-nome ${COR[p]}"><span class="sr-only">${t('Jogador', 'Player')} ${p + 1}</span>
              <input id="gd-nome-${p}" maxlength="14" autocomplete="off" placeholder="${t('Jogador', 'Player')} ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('<b class="gd-vs">VS</b>')}
          </div></div>
          ${opcoes(ui, true, 'g')}
          <div class="go-row"><button class="linkish" type="button" data-g="bot">${t('testar sozinho contra o bot', 'try it alone against the bot')}</button>
            <button class="btn big" type="button" data-g="local">${t('Começar', 'Start')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como()}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="gd-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-g="criar">${t('Criar sala', 'Create room')}</button>
              <input id="gd-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-g="entrar">${t('Entrar', 'Join')}</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup gd">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n}/2</span><button class="linkish" type="button" data-g="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>${opcoes(v, v.dono, 'g')}${como()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-g="convite">${t('Copiar convite', 'Copy invite')}</button>
            ${v.pessoas.length < 2 ? `<button class="btn paper" type="button" data-g="poe-bot">+ bot</button>` : ''}</div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala gd-sala">${v.pessoas.map((p, i) => `<li class="${COR[i] || ''}${p.on ? '' : ' fora'}"><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-g="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
          ${n < 2 ? `<p class="note">${t('É 1 contra 1: falta alguém entrar (ou um bot).', 'It is 1 vs 1: someone still has to join (or a bot).')}</p>` : ''}
        </div>
      </div>
      <div class="go-row">${v.dono ? `<button class="btn big" type="button" data-g="comecar"${n < 2 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- o jogo ----------
  function placar(v, ui) {
    const fim = v.fase === 'fim'
    return `<div class="gd-placar">${[0, 1].map((j) => {
      const vez = !fim && v.vez === j
      const p = v.js[j]
      const quem = !ui.local && v.eu === j ? ` <small>${t('você', 'you')}</small>` : ''
      return `<span class="gd-jog ${COR[j]}${vez ? ' vez' : ''}"><i class="gd-ficha"></i><b>${esc(p.nome)}${quem}</b>
        <em>${p.casas} ${p.casas === 1 ? t('casa', 'square') : t('casas', 'squares')}${v.vitorias && (v.vitorias[0] + v.vitorias[1]) ? ` · ${v.vitorias[j]} ${v.vitorias[j] === 1 ? t('vitória', 'win') : t('vitórias', 'wins')}` : ''}</em></span>`
    }).join('<b class="gd-vs">VS</b>')}</div>`
  }

  function grade(v, ui) {
    const { L, C } = v
    const reta = v.fim && v.fim.reta ? v.fim.reta : []
    const minha = ui.souVez && v.fase === 'jogo'
    const tomando = minha && v.poder === v.vez
    const achadas = Object.fromEntries((v.achadas || []).map((a) => [a.casa, a.tipo]))
    const cab = (id, lado) => `<button class="gd-cab ${lado}${ui.dica === id ? ' aberta' : ''}" type="button" data-g="dica" data-v="${id}" title="${esc(dica(id))}">${esc(rotulo(id))}</button>`
    let h = `<div class="gd-canto"><b>${v.K}</b><small>${t('seguidas', 'in a row')}</small></div>`
    h += v.colunas.map((id) => cab(id, 'col')).join('')
    for (let r = 0; r < L; r++) {
      h += cab(v.linhas[r], 'lin')
      for (let c = 0; c < C; c++) {
        const i = r * C + c
        const casa = v.casas[i]
        const aberta = tomando ? !!casa && casa.dono !== v.vez : minha && v.poder < 0 && (!casa || (v.roubar && casa.dono !== v.vez))
        const cls = ['gd-casa', casa ? 'cheia ' + COR[casa.dono] : 'vazia', aberta ? (tomando ? 'pode alvo' : 'pode') : '', ui.casa === i ? 'escolhida' : '',
          reta.includes(i) ? 'reta' : '', ui.nova === i ? 'nova' : '', ui.treme === i ? 'treme' : '', ui.revela === i ? 'revelada' : ''].filter(Boolean).join(' ')
        const joia = achadas[i] ? `<i class="gd-joia ${achadas[i]}" title="${esc(joiaNome(achadas[i]))}"></i>` : ''
        const dentro = casa ? `${capa(casa.key)}<span class="gd-tarja">${esc(nome(casa.key))}</span>${joia}` : aberta ? '<i class="gd-mais">+</i>' : joia
        h += `<button class="${cls}" type="button" data-g="casa" data-v="${i}" aria-label="${esc(rotulo(v.linhas[r]) + ' × ' + rotulo(v.colunas[c]) + (casa ? ': ' + nome(casa.key) : ''))}">${dentro}</button>`
      }
    }
    return `<div class="gd-mesa"><div class="gd-tab c${Math.max(C, 3)}" style="--c:${C};--l:${L}">${h}</div></div>`
  }

  // a ficha de quem está jogando: as duas categorias da casa e o campo com os nomes aparecendo
  function ficha(v, ui) {
    if (ui.casa < 0 || !ui.souVez || v.fase !== 'jogo' || v.poder >= 0) return ''
    const l = v.linhas[Math.floor(ui.casa / v.C)]
    const c = v.colunas[ui.casa % v.C]
    const dono = v.casas[ui.casa]
    return `<div class="gd-ficha-box panel" id="gd-ficha">
      <div class="gd-regras"><span><b>${esc(rotulo(l))}</b><small>${esc(dica(l))}</small></span><i>×</i><span><b>${esc(rotulo(c))}</b><small>${esc(dica(c))}</small></span></div>
      ${dono ? `<p class="gd-roubo">${t(`Roubando de ${esc(nomeJ(v, dono.dono))}: diga outro personagem que vale aqui.`, `Stealing from ${esc(nomeJ(v, dono.dono))}: name another character who fits here.`)}</p>` : ''}
      <label class="gd-busca"><span class="sr-only">${t('Personagem', 'Character')}</span>
        <input id="gd-busca" maxlength="30" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="${t('Comece a digitar um nome…', 'Start typing a name…')}" value="${esc(ui.busca)}"></label>
      <div class="gd-sugestoes" id="gd-sugestoes">${sugestoes(v, ui)}</div>
      <div class="gd-ficha-btns"><button class="linkish" type="button" data-g="fecha">${t('outra casa', 'another square')}</button></div>
    </div>`
  }

  // os personagens que começam com o que foi digitado (todos, não só os que valem: senão era fácil demais)
  const norm = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
  let formas = null
  function achar(txt) {
    const q = norm(txt)
    if (!q) return []
    if (!formas) formas = GD().chaves.map((k) => ({ k, f: [norm(E.D.hq[indice[k]].n), norm((window.IMPOSTOR_EN || {})[k]), norm(E.D.hq[indice[k]].id)].filter(Boolean) }))
    const nota = (x) => {
      let n = 9
      for (const f of x.f) {
        if (f.startsWith(q)) n = Math.min(n, 0)
        else if (f.split(' ').some((w) => w.startsWith(q))) n = Math.min(n, 1)
      }
      return n
    }
    return formas.map((x) => ({ k: x.k, n: nota(x) })).filter((x) => x.n < 9).sort((a, b) => a.n - b.n || nome(a.k).localeCompare(nome(b.k))).map((x) => x.k)
  }
  function sugestoes(v, ui) {
    const lista = achar(ui.busca).slice(0, 7)
    if (!ui.busca.trim()) return `<p class="gd-vazio">${t('Os nomes aparecem aqui conforme você digita.', 'Names show up here as you type.')}</p>`
    if (!lista.length) return `<p class="gd-vazio">${t('Ninguém com esse nome na lista.', 'Nobody by that name on the list.')}</p>`
    return lista.map((k, i) => {
      const usado = v.usados.includes(k)
      return `<button class="gd-sug${usado ? ' usado' : ''}${i === 0 ? ' primeira' : ''}" type="button" data-g="escolhe" data-v="${k}"${usado ? ' disabled' : ''}>
        <span class="gd-mini">${capa(k)}</span><b>${esc(nome(k))}</b><small>${usado ? t('já foi usado', 'already used') : esc(ident(k))}</small></button>`
    }).join('')
  }

  // o que aconteceu na última jogada
  function noticia(v, ui) {
    if (ui.aviso) return `<p class="gd-aviso" role="status">${esc(ui.aviso)}</p>`
    const u = v.ultimo
    if (!u) return `<p class="gd-aviso calmo" role="status">${t(`${esc(nomeJ(v, v.vez))} começa. Escolha uma casa!`, `${esc(nomeJ(v, v.vez))} goes first. Pick a square!`)}</p>`
    const quem = esc(nomeJ(v, u.j))
    if (u.passou) return `<p class="gd-aviso calmo" role="status">${u.desistiu ? t(`${quem} não quis tomar casa nenhuma.`, `${quem} chose not to take a square.`)
      : u.tempo ? t(`Acabou o tempo de ${quem}.`, `${quem} ran out of time.`) : t(`${quem} passou a vez.`, `${quem} passed.`)}</p>`
    if (u.tomou) return `<p class="gd-aviso ok ${COR[u.j]}" role="status">${t(`${quem} usou a Joia do Poder e tomou <b>${esc(nome(u.key))}</b>!`, `${quem} used the Power Stone and took <b>${esc(nome(u.key))}</b>!`)}</p>`
    if (u.ok) {
      const ids = [v.linhas[Math.floor(u.casa / v.C)], v.colunas[u.casa % v.C]]
      const porque = ids.map((id) => nota(id, u.key) && `<span class="gd-porque"><b>${esc(rotulo(id))}:</b> ${esc(nota(id, u.key))}</span>`).filter(Boolean).join('')
      const joia = u.joia ? `<span class="gd-achou ${u.joia}"><i class="gd-joia ${u.joia}"></i>${t(`Tinha uma <b>${joiaNome(u.joia)}</b> escondida aqui: ${quem} ${JOIA[u.joia][1][0]}!`, `There was a <b>${joiaNome(u.joia)}</b> hidden here: ${quem} ${JOIA[u.joia][1][1]}!`)}</span>` : ''
      return `<p class="gd-aviso ok ${COR[u.j]}" role="status">${u.roubou >= 0 ? t(`${quem} roubou a casa com <b>${esc(nome(u.key))}</b>!`, `${quem} stole the square with <b>${esc(nome(u.key))}</b>!`)
        : t(`${quem} pegou a casa com <b>${esc(nome(u.key))}</b>.`, `${quem} took the square with <b>${esc(nome(u.key))}</b>.`)}${porque}${joia}</p>`
    }
    const porque = u.falhou.map((id) => `<b>${esc(rotulo(id))}</b>`).join(t(' nem ', ' nor '))
    return `<p class="gd-aviso erro" role="status">✗ ${t(`${quem} disse ${esc(nome(u.key))}, mas não vale: não é ${porque}.`, `${quem} said ${esc(nome(u.key))}, but it does not fit: not ${porque}.`)}</p>`
  }

  function rodape(v, ui) {
    if (v.fase !== 'jogo') return ''
    const contraBot = v.js.some((p) => p.bot)
    const vez = ui.local && !contraBot ? t(`vez de ${esc(nomeJ(v, v.vez))}`, `${esc(nomeJ(v, v.vez))}’s turn`) : t('sua vez', 'your turn')
    if (ui.souVez && v.poder === v.vez) return `<div class="gd-acoes"><span class="lbl">${vez} · ${t(`toque numa casa de ${esc(nomeJ(v, 1 - v.vez))} pra tomar`, `tap one of ${esc(nomeJ(v, 1 - v.vez))}’s squares to take it`)}</span>
      <button class="btn paper" type="button" data-g="passar">${t('Não tomar', 'Skip')}</button></div>`
    if (ui.souVez) return `<div class="gd-acoes"><span class="lbl">${vez}${ui.casa < 0 ? ' · ' + t('toque numa casa', 'tap a square') : ''}</span>
      <button class="btn paper" type="button" data-g="passar">${t('Passar a vez', 'Pass')}</button></div>`
    return `<div class="gd-acoes"><span class="lbl">${t(`${esc(nomeJ(v, v.vez))} está pensando…`, `${esc(nomeJ(v, v.vez))} is thinking…`)}</span></div>`
  }

  function final(v, ui) {
    if (v.fase !== 'fim') return ''
    const F = v.fim
    const titulo = F.ganhou < 0 ? t('EMPATE!', 'TIE!') : F.motivo === 'linha' ? t('LINHA!', 'LINE!') : t('FIM!', 'GAME OVER!')
    const txt = F.ganhou < 0 ? t(`Ninguém fez a sequência e deu ${F.casas[0]} a ${F.casas[1]} nas casas.`, `Nobody got the run and it was ${F.casas[0]} to ${F.casas[1]} in squares.`)
      : F.motivo === 'linha' ? t(`${esc(nomeJ(v, F.ganhou))} fez ${v.K} seguidas e ganhou!`, `${esc(nomeJ(v, F.ganhou))} got ${v.K} in a row and won!`)
        : t(`Ninguém fez a sequência. ${esc(nomeJ(v, F.ganhou))} ganhou nas casas: ${F.casas[F.ganhou]} a ${F.casas[1 - F.ganhou]}.`, `Nobody got the run. ${esc(nomeJ(v, F.ganhou))} won on squares: ${F.casas[F.ganhou]} to ${F.casas[1 - F.ganhou]}.`)
    return `<div class="gd-fim ${F.ganhou >= 0 ? COR[F.ganhou] : 'empate'}"><b class="gd-carimbo">${titulo}</b><p>${txt}</p>
      <p class="note">${t('Toque numa casa pra ver quem valia ali.', 'Tap a square to see who fit there.')}</p>
      ${ui.revela >= 0 ? revelar(v, ui.revela) : ''}
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-g="denovo">${t('Jogar de novo', 'Play again')}</button>` : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}
        <button class="linkish" type="button" data-g="sair">${t('sair', 'leave')}</button></div></div>`
  }
  function revelar(v, i) {
    const l = v.linhas[Math.floor(i / v.C)]
    const c = v.colunas[i % v.C]
    const certas = window.GradeMotor.respostas(l, c)
    return `<div class="gd-valia"><span class="lbl">${esc(rotulo(l))} × ${esc(rotulo(c))}</span>
      <div>${certas.map((k) => { const n = [nota(l, k), nota(c, k)].filter(Boolean).join(' · '); return `<span class="${v.usados.includes(k) ? 'foi' : ''}"${n ? ` title="${esc(n)}"` : ''}>${esc(nome(k))}${n ? ' *' : ''}</span>` }).join('')}</div></div>`
  }

  function jogo(v, ui) {
    const relogio = v.dur && v.fase === 'jogo' ? '<span class="gd-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' : ''
    return `<section class="gd-jogo">
      <div class="imp-topo">${placar(v, ui)}<button class="linkish" type="button" data-g="sair">${t('sair', 'leave')}</button></div>
      ${relogio}
      ${v.fase === 'jogo' ? noticia(v, ui) : ''}
      ${ui.dica ? `<p class="gd-dica" role="status"><b>${esc(rotulo(ui.dica))}:</b> ${esc(dica(ui.dica))}</p>` : ''}
      ${grade(v, ui)}
      ${ficha(v, ui)}
      ${rodape(v, ui)}
      ${final(v, ui)}
      ${ui.estouro ? `<div class="ap-estouro gd-estouro${ui.estouroJoia ? ' joia ' + ui.estouroJoia : ''}" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  window.GradeTelas = { entrada, sala, jogo, sugestoes, achar, nome, resumo, MODELOS, joiaNome }
})()
