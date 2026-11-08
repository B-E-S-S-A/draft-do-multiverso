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
    { id: 'classico', L: 4, C: 4, K: 4, pt: 'Clássico', en: 'Classic' },
    { id: 'grandao', L: 5, C: 5, K: 5, pt: 'Grandão', en: 'Big one' },
  ]
  // de onde vêm os temas, como no Draft: HQ, filmes ou os dois
  const VERSOES = [
    { id: 'hq', pt: 'HQ', en: 'Comics', ps: 'só temas dos quadrinhos', es: 'comic-book topics only' },
    { id: 'tela', pt: 'Filmes', en: 'Movies', ps: 'só filmes e séries', es: 'movies and series only' },
    { id: 'ambos', pt: 'Os dois', en: 'Both', ps: 'tudo misturado', es: 'everything mixed' },
  ]
  const versaoDe = (id) => VERSOES.find((x) => x.id === id) || VERSOES[2]
  // Fácil, Médio e Difícil. Por dentro viram os níveis 2, 6 e 9 do motor (de 1 a 9): o grid mistura temas de vários
  // subníveis, com algumas casas mais difíceis pra nenhuma linha sair de graça, e no Médio e no Difícil nenhuma casa tem gente demais
  const NIVEIS = [
    { n: 2, pt: 'Fácil', en: 'Easy', ps: 'temas conhecidos', es: 'well-known topics' },
    { n: 6, pt: 'Médio', en: 'Medium', ps: 'pra fã', es: 'for fans' },
    { n: 9, pt: 'Difícil', en: 'Hard', ps: 'pra quem sabe tudo', es: 'for know-it-alls' },
  ]
  const nivelDe = (n) => NIVEIS[Math.min(2, Math.max(0, Math.ceil((n || 2) / 3) - 1))]
  const nomeNivel = (n) => t(nivelDe(n).pt, nivelDe(n).en)
  // a versão do jogo que está na tela (os textos de algumas categorias mudam no "só filmes e séries")
  let verAtual = 'ambos'

  // personagem: capa, nome na língua de quem olha, identidade
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const nome = (key) => (indice[key] === undefined ? key : V.nomeDe(lote(key)))
  const ident = (key) => (indice[key] === undefined ? '' : V.idDe(lote(key)) || '')
  const capa = (key) => V.cover(lote(key))
  const cat = (id) => GD().porId[id]
  const texto = (id) => GD().textos(cat(id), verAtual)[en() ? 'en' : 'pt']
  const rotulo = (id) => (cat(id) ? texto(id)[0] : id)
  const dica = (id) => (cat(id) ? texto(id)[1] : '')
  const nomeJ = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  // o porquê de um acerto que surpreende ("Tem irmão: Arno Stark, na HQ")
  // (no "só filmes e séries", as categorias que contam só as telas não usam essas notas, que falam das HQs)
  const nota = (id, key) => {
    if (verAtual === 'tela' && cat(id) && cat(id).tela) return ''
    const n = ((window.GradeNotas || {})[id] || {})[key]
    return !n ? '' : Array.isArray(n) ? n[en() ? 1 : 0] : n
  }

  // ---------- opções: de onde vêm os temas, dificuldade, tamanho, roubar, relógio (com as mesmas peças dos outros jogos) ----------
  // as capinhas dos cartões HQ / Filmes / Os dois, como no Draft (sorteadas uma vez por visita)
  let pilhas = null
  function pilha(v) {
    if (!pilhas) {
      const D = E.D
      const hq = E.shuffle(D.hq.map((_, i) => 'hq:' + i)).slice(0, 5).map(E.lotOf)
      const obras = new Set()
      const filmes = E.shuffle(D.mcu.map((_, i) => 'mcu:' + i)).map(E.lotOf).filter((l) => !D.works[l.w].tv && !obras.has(l.w) && obras.add(l.w)).slice(0, 4)
      pilhas = { hq: hq.slice(0, 3), tela: filmes.slice(0, 3), ambos: [hq[3], filmes[3], hq[4]] }
    }
    return `<span class="stack">${pilhas[v].map(V.card).join('')}</span>`
  }
  function opcoes(o, pode, attr) {
    const dis = pode ? '' : ' disabled'
    const cartao = (a, v, ativo, x, capas) => `<button class="mode" type="button" data-${attr}="${a}" data-v="${v}" aria-pressed="${ativo}"${dis}>
      ${capas ? pilha(v) : ''}<b>${t(x.pt, x.en)}</b><small>${t(x.ps, x.es)}</small></button>`
    const ref = `<div class="field"><span class="lbl">${t('De onde vêm os temas', 'Where the topics come from')}</span>
      <div class="modes">${VERSOES.map((x) => cartao('versao', x.id, versaoDe(o.versao) === x, x, true)).join('')}</div></div>`
    const niv = `<div class="field"><span class="lbl">${t('Dificuldade', 'Difficulty')}</span>
      <div class="modes">${NIVEIS.map((x) => cartao('nivel', x.n, nivelDe(o.nivel) === x, x)).join('')}</div></div>`
    // tamanho: os modelos prontos e o − / + de linhas, colunas e quantas em linha (no máximo 30 casas)
    const modelo = MODELOS.find((m) => m.L === o.L && m.C === o.C && m.K === o.K)
    const passo = (k, rot, min, max) => `<div class="gd-passo"><span class="lbl">${rot}</span><div class="stepper">
      <button class="btn paper step" type="button" data-${attr}="${k}" data-v="${o[k] - 1}" aria-label="${rot}: ${o[k] - 1}"${!pode || o[k] <= min ? ' disabled' : ''}>−</button>
      <b class="imp-n">${o[k]}</b>
      <button class="btn paper step" type="button" data-${attr}="${k}" data-v="${o[k] + 1}" aria-label="${rot}: ${o[k] + 1}"${!pode || o[k] >= max ? ' disabled' : ''}>+</button></div></div>`
    const tam = `<div class="field"><span class="lbl">${t('Tamanho do grid', 'Grid size')}</span>
      <div class="presets">${MODELOS.map((m) => `<button class="preset" type="button" data-${attr}="modelo" data-v="${m.id}" aria-pressed="${modelo === m}"${dis}>${t(m.pt, m.en)} ${m.L}×${m.C}</button>`).join('')}</div>
      <div class="gd-passos">${passo('L', t('Linhas', 'Rows'), 2, Math.min(6, Math.floor(30 / o.C)))}${passo('C', t('Colunas', 'Columns'), 2, Math.min(6, Math.floor(30 / o.L)))}${passo('K', t('Em linha', 'In a row'), 2, Math.max(o.L, o.C))}</div>
      <p class="note">${resumo(o)}</p></div>`
    // roubar e relógio: chavinhas, como nas opções do Impostor
    const chave = (id, on, txt, sub) => `<label class="switch"><input type="checkbox" id="${id}"${on ? ' checked' : ''}${dis}><span class="knob"></span>
      <span class="imp-sw"><span>${txt}</span><small>${sub}</small></span></label>`
    const ops = `<div class="field"><span class="lbl">${t('Opções', 'Options')}</span>
      ${chave('gd-roubar', o.roubar, t('Pode roubar', 'Stealing'), t('diga outro personagem que vale e tome a casa do outro', 'name another character who fits and take their square'))}
      ${chave('gd-relogio', !!o.relogio, t('Relógio', 'Clock'), t('tempo pra cada vez', 'a time limit on every turn'))}
      ${o.relogio ? `<div class="presets">${[30, 60].map((sg) => `<button class="preset" type="button" data-${attr}="relogio" data-v="${sg}" aria-pressed="${o.relogio === sg}"${dis}>${sg} s</button>`).join('')}</div>` : ''}</div>`
    return ref + niv + tam + ops
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
    const cab = (id, lado) => `<button class="gd-cab ${lado}${ui.dica === id ? ' aberta' : ''}" type="button" data-g="dica" data-v="${id}" title="${esc(dica(id))}">${esc(rotulo(id))}</button>`
    let h = `<div class="gd-canto"><b>${v.K}</b><small>${t('seguidas', 'in a row')}</small></div>`
    h += v.colunas.map((id) => cab(id, 'col')).join('')
    for (let r = 0; r < L; r++) {
      h += cab(v.linhas[r], 'lin')
      for (let c = 0; c < C; c++) {
        const i = r * C + c
        const casa = v.casas[i]
        const aberta = minha && (!casa || (v.roubar && casa.dono !== v.vez))
        const cls = ['gd-casa', casa ? 'cheia ' + COR[casa.dono] : 'vazia', aberta ? 'pode' : '', ui.casa === i ? 'escolhida' : '',
          reta.includes(i) ? 'reta' : '', ui.nova === i ? 'nova' : '', ui.treme === i ? 'treme' : '', ui.revela === i ? 'revelada' : ''].filter(Boolean).join(' ')
        const dentro = casa ? `<span class="gd-carta">${capa(casa.key)}</span><span class="gd-fita">${esc(nome(casa.key))}</span>` : aberta ? '<i class="gd-mais">+</i>' : ''
        h += `<button class="${cls}" type="button" data-g="casa" data-v="${i}" aria-label="${esc(rotulo(v.linhas[r]) + ' × ' + rotulo(v.colunas[c]) + (casa ? ': ' + nome(casa.key) : ''))}">${dentro}</button>`
      }
    }
    return `<div class="gd-mesa panel"><div class="gd-tab c${Math.max(C, 3)}" style="--c:${C};--l:${L}">${h}</div></div>`
  }

  // a ficha de quem está jogando: as duas categorias da casa e o campo com os nomes aparecendo
  function ficha(v, ui) {
    if (ui.casa < 0 || !ui.souVez || v.fase !== 'jogo') return ''
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
  const pools = {}
  function achar(txt, versao) {
    const q = norm(txt)
    if (!q) return []
    const v = GD().versao(versao)
    if (!pools[v]) pools[v] = new Set(GD().poolDa(v))
    if (!formas) formas = GD().chaves.map((k) => ({ k, f: [norm(E.D.hq[indice[k]].n), norm((window.IMPOSTOR_EN || {})[k]), norm(E.D.hq[indice[k]].id)].filter(Boolean) }))
    const nota = (x) => {
      let n = 9
      for (const f of x.f) {
        if (f.startsWith(q)) n = Math.min(n, 0)
        else if (f.split(' ').some((w) => w.startsWith(q))) n = Math.min(n, 1)
      }
      return n
    }
    return formas.filter((x) => pools[v].has(x.k)).map((x) => ({ k: x.k, n: nota(x) })).filter((x) => x.n < 9).sort((a, b) => a.n - b.n || nome(a.k).localeCompare(nome(b.k))).map((x) => x.k)
  }
  function sugestoes(v, ui) {
    const lista = achar(ui.busca, v.versao).slice(0, 7)
    if (!ui.busca.trim()) return `<p class="gd-vazio">${t('Os nomes aparecem aqui conforme você digita.', 'Names show up here as you type.')}</p>`
    if (!lista.length) return `<p class="gd-vazio">${v.versao === 'tela' ? t('Ninguém com esse nome nos filmes e séries da lista.', 'Nobody by that name in the movies & series list.')
      : t('Ninguém com esse nome na lista.', 'Nobody by that name on the list.')}</p>`
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
    if (u.passou) return `<p class="gd-aviso calmo" role="status">${u.tempo ? t(`Acabou o tempo de ${quem}.`, `${quem} ran out of time.`) : t(`${quem} passou a vez.`, `${quem} passed.`)}</p>`
    if (u.ok) {
      const ids = [v.linhas[Math.floor(u.casa / v.C)], v.colunas[u.casa % v.C]]
      const porque = ids.map((id) => nota(id, u.key) && `<span class="gd-porque"><b>${esc(rotulo(id))}:</b> ${esc(nota(id, u.key))}</span>`).filter(Boolean).join('')
      return `<p class="gd-aviso ok ${COR[u.j]}" role="status">${u.roubou >= 0 ? t(`${quem} roubou a casa com <b>${esc(nome(u.key))}</b>!`, `${quem} stole the square with <b>${esc(nome(u.key))}</b>!`)
        : t(`${quem} pegou a casa com <b>${esc(nome(u.key))}</b>.`, `${quem} took the square with <b>${esc(nome(u.key))}</b>.`)}${porque}</p>`
    }
    const porque = u.falhou.map((id) => `<b>${esc(rotulo(id))}</b>`).join(t(' nem ', ' nor '))
    return `<p class="gd-aviso erro" role="status">✗ ${t(`${quem} disse ${esc(nome(u.key))}, mas não vale: não é ${porque}.`, `${quem} said ${esc(nome(u.key))}, but it does not fit: not ${porque}.`)}</p>`
  }

  function rodape(v, ui) {
    if (v.fase !== 'jogo') return ''
    const contraBot = v.js.some((p) => p.bot)
    const vez = ui.local && !contraBot ? t(`vez de ${esc(nomeJ(v, v.vez))}`, `${esc(nomeJ(v, v.vez))}’s turn`) : t('sua vez', 'your turn')
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
    const certas = window.GradeMotor.respostas(l, c, v.versao)
    return `<div class="gd-valia"><span class="lbl">${esc(rotulo(l))} × ${esc(rotulo(c))}</span>
      <div>${certas.map((k) => { const n = [nota(l, k), nota(c, k)].filter(Boolean).join(' · '); return `<span class="${v.usados.includes(k) ? 'foi' : ''}"${n ? ` title="${esc(n)}"` : ''}>${esc(nome(k))}${n ? ' *' : ''}</span>` }).join('')}</div></div>`
  }

  function jogo(v, ui) {
    verAtual = GD().versao(v.versao)
    const modo = `<p class="gd-modo"><b>${nomeNivel(v.nivel)}</b> · ${t(versaoDe(v.versao).pt, versaoDe(v.versao).en)}</p>`
    const relogio = v.dur && v.fase === 'jogo' ? '<span class="gd-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' : ''
    return `<section class="gd-jogo">
      <div class="imp-topo">${placar(v, ui)}<button class="linkish" type="button" data-g="sair">${t('sair', 'leave')}</button></div>
      <div class="gd-palco">
        ${grade(v, ui)}
        <aside class="gd-lado">
          ${modo}
          ${relogio}
          ${v.fase === 'jogo' ? noticia(v, ui) : ''}
          ${ui.dica ? `<p class="gd-dica" role="status"><b>${esc(rotulo(ui.dica))}:</b> ${esc(dica(ui.dica))}</p>` : ''}
          ${ficha(v, ui)}
          ${rodape(v, ui)}
          ${final(v, ui)}
        </aside>
      </div>
      ${ui.estouro ? `<div class="ap-estouro gd-estouro" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  window.GradeTelas = { entrada, sala, jogo, sugestoes, achar, nome, resumo, MODELOS, VERSOES, NIVEIS }
})()
