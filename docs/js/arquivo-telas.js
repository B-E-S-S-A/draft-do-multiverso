// Telas do Arquivo Secreto. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é arquivo.js.
(function () {
  const V = window.View
  const E = window.Engine
  const M = window.ArquivoMotor
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const GD = () => window.GradeDados
  const GT = () => window.GradeTelas
  const cor = (i) => `--cor: var(--c${i % 10})`
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const capa = (key) => V.cover(lote(key))
  const nome = (key) => GT().nome(key)
  const ident = (key) => V.idDe(lote(key)) || ''
  const qualVersao = (id) => ({ hq: t('HQ', 'Comics'), tela: t('Filmes', 'Movies'), ambos: t('Os dois', 'Both') }[id] || '')

  // o que cada pista diz, na língua de quem olha: [frase, explicação]
  function textoPista(p, versao) {
    if (p.t === 'tema') { const c = GD().porId[p.id]; return GD().textos(c, versao)[en() ? 'en' : 'pt'] }
    if (p.t === 'iniciais') return [t(`Nome verdadeiro: ${p.v}`, `Real name: ${p.v}`), t('As iniciais do nome de verdade.', 'The initials of their real name.')]
    if (p.t === 'tamanho') return [t(`O nome tem ${p.pt} letras`, `The name has ${p.en} letters`), '']
    return [t(`O nome começa com ${p.pt}`, `The name starts with ${p.en}`), '']
  }

  function como() {
    return `<ol class="how">${t(`
      <li>Abre a ficha secreta de um personagem, com uma pista de cada vez: "Voa", "Já foi X-Men", "Estreou nos anos 60"…</li>
      <li>Digite o nome de quem você acha que é. Quanto antes acertar, mais pontos: 6 na primeira pista, 1 na última.</li>
      <li>Errou: perde 1 ponto, mas pode tentar de novo na próxima pista.</li>
      <li>Cada um no seu celular, todos chutam ao mesmo tempo e quem acerta primeiro ganha +1. Num celular só, cada pista é de uma pessoa.</li>`, `
      <li>A character’s secret file opens one clue at a time: "Can fly", "Has been an X-Man", "Debuted in the 1960s"…</li>
      <li>Type who you think it is. The sooner you get it, the more points: 6 on the first clue, 1 on the last.</li>
      <li>Wrong: you lose 1 point, but you can try again on the next clue.</li>
      <li>Each on their own phone, everyone guesses at once and the first to get it earns +1. On one phone, each clue belongs to one person.</li>`)}
    </ol>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui, m) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">${t('Jogador', 'Player')} ${p + 1}</span>
      <input id="aq-nome-${p}" maxlength="14" autocomplete="off" placeholder="${t('Jogador', 'Player')} ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup aq">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Num celular só', 'On one phone')}</h2>
          <div class="field"><span class="lbl">${t('Jogadores', 'Players')}</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-q="n" data-v="-1" aria-label="${t('Um a menos', 'One fewer')}"${ui.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-q="n" data-v="1" aria-label="${t('Um a mais', 'One more')}"${ui.n >= 8 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${GT().blocoVersao(ui, true, 'q', t('De onde vêm os personagens', 'Where the characters come from'))}
          <div class="go-row"><button class="linkish" type="button" data-q="bots">${t('testar sozinho contra 3 bots', 'try it alone against 3 bots')}</button>
            <button class="btn big" type="button" data-q="local">${t('Começar', 'Start')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como()}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="aq-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-q="criar">${t('Criar sala', 'Create room')}</button>
              <input id="aq-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-q="entrar">${t('Entrar', 'Join')}</button></div>
            ${m.erro ? `<p class="neterr" role="alert">${esc(m.erro)}</p>` : ''}${m.status ? `<p class="note" role="status">${esc(m.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup aq">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n}/8</span><button class="linkish" type="button" data-q="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>
          ${GT().blocoVersao(v, v.dono, 'q', t('De onde vêm os personagens', 'Where the characters come from'))}${como()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-q="convite">${t('Copiar convite', 'Copy invite')}</button>
            ${v.pessoas.length < 8 ? `<button class="btn paper" type="button" data-q="poe-bot">+ bot</button>` : ''}</div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-q="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
          ${n < 2 ? `<p class="note">${t('Falta pelo menos mais uma pessoa (ou um bot).', 'At least one more person (or a bot) is needed.')}</p>` : ''}
        </div>
      </div>
      <div class="go-row">${v.dono ? `<button class="btn big" type="button" data-q="comecar"${n < 2 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- a ficha ----------
  // entrou: a pista acabou de aparecer (só aí ela anima; quando a tela redesenha, não)
  function pasta(v, entrou) {
    const revelada = v.fase === 'revela'
    const linhas = M.PONTOS.map((pts, i) => {
      const p = v.pistas[i]
      if (!p) return `<li class="tarja"><small>${pts}</small><i style="width:${52 + ((i * 37) % 40)}%"></i></li>`
      const [frase, dica] = textoPista(p, v.versao)
      return `<li class="${!revelada && i === v.pista ? 'atual' + (entrou ? ' entrou' : '') : ''}"><small>${pts}</small><span><b>${esc(frase)}</b>${dica ? `<em>${esc(dica)}</em>` : ''}</span></li>`
    }).join('')
    return `<div class="panel aq-pasta" id="aq-pasta">
      <div class="aq-cabeca">
        <div class="aq-foto">${revelada ? capa(v.revela.key) : '<b>?</b>'}</div>
        <div class="aq-titulo">
          <span class="lbl">${v.rotulo ? esc(v.rotulo) : `${t('Ficha', 'File')} ${v.n + 1} ${t('de', 'of')} ${v.total} · ${qualVersao(v.versao)}`}</span>
          ${revelada ? `<h2>${esc(nome(v.revela.key))}</h2><p>${esc(ident(v.revela.key))}</p>` : `<h2>${t('Identidade sigilosa', 'Classified identity')}</h2><p>${t('Quem é?', 'Who is it?')}</p>`}
        </div>
        <b class="aq-carimbo${revelada ? ' aberto' : ''}">${revelada ? t('Revelado', 'Revealed') : t('Confidencial', 'Classified')}</b>
      </div>
      <ol class="aq-pistas">${linhas}</ol>
    </div>`
  }

  function placar(v) {
    const lista = v.js.map((p, i) => ({ ...p, i })).sort((a, b) => b.pts - a.pts)
    return `<ol class="aq-placar" id="aq-placar">${lista.map((p) => {
      const estado = p.acertou ? '<i class="ok">✓</i>' : v.fase === 'pista' && p.tentou ? '<i>…</i>' : ''
      const vez = v.fase === 'pista' && v.modo === 'turno' && p.i === v.vez
      return `<li style="${cor(p.i)}"${vez ? ' class="vez"' : ''}><span>${esc(p.nome)}${p.i === v.eu && !v.local ? ` <small>${t('você', 'you')}</small>` : ''}</span>${estado}<b>${p.pts}</b></li>`
    }).join('')}</ol>`
  }

  function sugestoes(v, ui) {
    const lista = GT().achar(ui.busca, v.versao).slice(0, 6)
    if (!ui.busca.trim()) return `<p class="gd-vazio">${t('Os nomes aparecem aqui conforme você digita.', 'Names show up here as you type.')}</p>`
    if (!lista.length) return `<p class="gd-vazio">${t('Ninguém com esse nome na lista.', 'Nobody by that name on the list.')}</p>`
    return lista.map((k, i) => {
      const errou = v.meu.errados.includes(k)
      return `<button class="gd-sug${errou ? ' usado' : ''}${i === 0 ? ' primeira' : ''}" type="button" data-q="escolhe" data-v="${k}"${errou ? ' disabled' : ''}>
        <span class="gd-mini">${capa(k)}</span><b>${esc(nome(k))}</b><small>${errou ? t('você já errou com esse', 'you already missed with this one') : esc(ident(k))}</small></button>`
    }).join('')
  }

  // a pista da vez, repetida em cima do campo: no celular, com o teclado aberto, a ficha fica fora da tela
  const atual = (v) => { const p = v.pistas[v.pista]; return p ? esc(textoPista(p, v.versao)[0]) : '' }
  // o campo de chutar, ou o que a pessoa está esperando
  function jogada(v, ui) {
    const vale = M.PONTOS[v.pista]
    if (v.pode) {
      const quem = v.modo === 'turno' ? t(`Vez de ${esc(v.js[v.vez].nome)}`, `${esc(v.js[v.vez].nome)}’s turn`) : t('Quem é?', 'Who is it?')
      return `<div class="panel aq-chute">
        <span class="lbl">${quem} · ${t(`vale ${vale}`, `worth ${vale}`)}</span>
        <p class="aq-atual" id="aq-atual">${atual(v)}</p>
        <label class="gd-busca"><span class="sr-only">${t('Personagem', 'Character')}</span>
          <input id="aq-busca" maxlength="30" autocomplete="off" autocapitalize="words" enterkeyhint="go" placeholder="${t('Comece a digitar um nome…', 'Start typing a name…')}" value="${esc(ui.busca)}"></label>
        <div class="gd-sugestoes" id="aq-sugestoes">${sugestoes(v, ui)}</div>
        <button class="btn paper" type="button" data-q="passa">${v.pista < M.PONTOS.length - 1 ? t('Passar pra próxima pista', 'Skip to the next clue') : t('Desistir dessa', 'Give up on this one')}</button>
      </div>`
    }
    if (v.modo === 'junto' && v.meu.acertou >= 0) return `<p class="gd-aviso ok">${t(`Você acertou! +${v.meu.ganho} pontos. Esperando os outros…`, `You got it! +${v.meu.ganho} points. Waiting for the others…`)}</p>`
    return `<p class="gd-aviso calmo">${t('Esperando a próxima pista…', 'Waiting for the next clue…')}</p>`
  }

  function resultado(v, ui) {
    const acertos = v.js.map((p, i) => ({ ...p, i })).filter((p) => p.acertou).sort((a, b) => a.pistaAcerto - b.pistaAcerto || b.ganho - a.ganho)
    const lista = acertos.length ? `<ol class="aq-acertos">${acertos.map((p) => `<li style="${cor(p.i)}"><span>${esc(p.nome)}</span><small>${t(`na pista ${p.pistaAcerto + 1}`, `on clue ${p.pistaAcerto + 1}`)}${p.primeiro ? t(' · primeiro!', ' · first!') : ''}</small><b>+${p.ganho}</b></li>`).join('')}</ol>`
      : `<p class="gd-aviso calmo">${t('Ninguém acertou essa.', 'Nobody got this one.')}</p>`
    const botao = ui.podeSeguir ? `<button class="btn big" type="button" data-q="seguir">${v.n + 1 < v.total ? t('Próxima ficha', 'Next file') : t('Ver o resultado', 'See the results')}</button>`
      : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`
    return `<div class="panel aq-chute"><span class="lbl">${t('Quem acertou', 'Who got it')}</span>${lista}<div class="go-row">${botao}</div></div>`
  }

  function final(v, ui) {
    const lista = [...v.js].map((p, i) => ({ ...p, i })).sort((a, b) => b.pts - a.pts || b.certos - a.certos)
    const venceu = lista.filter((p) => p.pts === lista[0].pts && p.certos === lista[0].certos)
    return `<section class="aq-jogo"><div class="panel aq-fim">
      <b class="gd-carimbo">${venceu.length > 1 ? t('EMPATE!', 'DRAW!') : t('CASO ENCERRADO', 'CASE CLOSED')}</b>
      <h2>${venceu.length > 1 ? esc(venceu.map((p) => p.nome).join(t(' e ', ' and '))) : t(`${esc(venceu[0].nome)} ganhou!`, `${esc(venceu[0].nome)} wins!`)}</h2>
      <ol class="aq-acertos">${lista.map((p) => `<li style="${cor(p.i)}"><span>${esc(p.nome)}</span><small>${p.certos} ${p.certos === 1 ? t('acerto', 'correct') : t('acertos', 'correct')}</small><b>${p.pts}</b></li>`).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-q="denovo">${t('Jogar de novo', 'Play again')}</button>` : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}
        <button class="linkish" type="button" data-q="sair">${t('sair', 'leave')}</button></div>
    </div></section>`
  }

  function jogo(v, ui) {
    if (v.fase === 'fim') return final(v, ui)
    const relogio = v.dur && v.fase === 'pista' ? '<span class="gd-relogio" id="aq-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' : ''
    return `<section class="aq-jogo">
      <div class="imp-topo"><span class="hint">${t('Arquivo Secreto', 'Secret File')}</span><button class="linkish" type="button" data-q="sair">${t('sair', 'leave')}</button></div>
      <div class="aq-palco">
        ${pasta(v, ui.entrou)}
        <aside class="aq-lado">
          ${relogio}
          <div id="aq-aviso">${aviso(ui)}</div>
          ${v.fase === 'pista' ? jogada(v, ui) : resultado(v, ui)}
          ${placar(v)}
        </aside>
      </div>
      <div id="aq-estouro">${estouro(ui)}</div>
    </section>`
  }
  const aviso = (ui) => (ui.aviso ? `<p class="gd-aviso ${ui.avisoTipo || 'calmo'}" role="status">${esc(ui.aviso)}</p>` : '')
  const estouro = (ui) => (ui.estouro ? `<div class="ap-estouro" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : '')

  window.ArquivoTelas = { entrada, sala, jogo, pasta, placar, sugestoes, aviso, estouro, nome, atual }
})()
