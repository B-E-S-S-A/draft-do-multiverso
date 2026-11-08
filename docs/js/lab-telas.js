// Telas do Laboratório do Alto Evolucionário. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é lab.js.
(function () {
  const V = window.View
  const E = window.Engine
  const LD = window.LabDados
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const lang = () => (en() ? 1 : 0)
  const cor = (i) => `--cor: var(--c${i % 10})`
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const capa = (key) => V.cover(lote(key))
  const nomePers = (key) => V.nomeDe(lote(key))
  const poder = (i) => LD.PODERES[i][lang()]
  const fraqueza = (i) => LD.FRAQUEZAS[i][lang()]
  const nomeHeroi = (h) => (h.pronto >= 0 ? LD.NOMES[h.pronto][lang()] : h.nome)
  const rodada = (vivos) => (vivos <= 2 ? t('Final', 'Final') : vivos <= 4 ? t('Semifinal', 'Semifinal') : t('Quartas', 'Quarterfinal'))

  function como() {
    return `<ol class="how">${t(`
      <li>Cada um monta um herói: um corpo, um poder, uma fraqueza e um nome. Quanto mais absurdo, melhor.</li>
      <li>Os heróis se enfrentam em mata-mata, dois a dois, sem ninguém saber quem criou cada um.</li>
      <li>Todo mundo vota em cada duelo, menos os dois criadores. Quem já perdeu continua votando.</li>
      <li>Deu empate, quem decide é o Vigia. O último herói de pé é o campeão.</li>`, `
      <li>Everyone builds a hero: a body, a power, a weakness and a name. The more absurd, the better.</li>
      <li>The heroes face off two by two in a knockout, and nobody knows who made which.</li>
      <li>Everyone votes on each duel, except the two creators. Those already out keep voting.</li>
      <li>On a tie, the Watcher decides. The last hero standing is the champion.</li>`)}
    </ol>`
  }

  function opcoes(o, pode) {
    const dis = pode ? '' : ' disabled'
    const cartao = (id, a, b, c, d) => `<button class="mode" type="button" data-l="modo" data-v="${id}" aria-pressed="${o.modoMontar === id}"${dis}><b>${t(a, b)}</b><small>${t(c, d)}</small></button>`
    return `<div class="field"><span class="lbl">${t('Como montar o herói', 'How to build the hero')}</span><div class="modes lab-modos">
      ${cartao('escolhe', 'Escolher', 'Choose', 'recebe 3 cartas de cada e escolhe', 'get 3 cards of each and choose')}
      ${cartao('sorteio', 'Sorteado', 'Random', 'o site sorteia, você só dá o nome', 'the site deals, you just name it')}</div></div>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui, m) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">${t('Jogador', 'Player')} ${p + 1}</span>
      <input id="lab-nome-${p}" maxlength="14" autocomplete="off" placeholder="${t('Jogador', 'Player')} ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup lab">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Num celular só', 'On one phone')}</h2>
          <div class="field"><span class="lbl">${t('Jogadores', 'Players')}</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-l="n" data-v="-1" aria-label="${t('Um a menos', 'One fewer')}"${ui.n <= 3 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-l="n" data-v="1" aria-label="${t('Um a mais', 'One more')}"${ui.n >= 8 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${opcoes(ui, true)}
          <div class="go-row"><button class="linkish" type="button" data-l="bots">${t('testar sozinho contra 3 bots', 'try it alone against 3 bots')}</button>
            <button class="btn big" type="button" data-l="local">${t('Começar', 'Start')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como()}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="lab-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-l="criar">${t('Criar sala', 'Create room')}</button>
              <input id="lab-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-l="entrar">${t('Entrar', 'Join')}</button></div>
            ${m.erro ? `<p class="neterr" role="alert">${esc(m.erro)}</p>` : ''}${m.status ? `<p class="note" role="status">${esc(m.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup lab">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n}/8</span><button class="linkish" type="button" data-l="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>${opcoes(v, v.dono)}${como()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-l="convite">${t('Copiar convite', 'Copy invite')}</button>
            ${v.pessoas.length < 8 ? `<button class="btn paper" type="button" data-l="poe-bot">+ bot</button>` : ''}</div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-l="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
          ${n < 3 ? `<p class="note">${t('Precisa de pelo menos 3 (dá pra pôr bots).', 'At least 3 are needed (bots count).')}</p>` : ''}
        </div>
      </div>
      <div class="go-row">${v.dono ? `<button class="btn big" type="button" data-l="comecar"${n < 3 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- a carta do herói ----------
  function carta(h) {
    const nome = h.nome !== undefined ? nomeHeroi(h) : ''
    return `<div class="lab-heroi">
      <div class="lab-foto">${h.corpo ? capa(h.corpo) : '<b>?</b>'}</div>
      <div class="lab-ficha">
        <h3>${nome ? esc(nome) : '<span class="lab-vazio">' + t('Sem nome', 'No name') + '</span>'}</h3>
        <small>${h.corpo ? t(`corpo de ${esc(nomePers(h.corpo))}`, `${esc(nomePers(h.corpo))}’s body`) : t('sem corpo', 'no body yet')}</small>
        <p><span class="lbl">${t('Poder', 'Power')}</span>${h.poder >= 0 ? esc(poder(h.poder)) : '…'}</p>
        <p class="fraca"><span class="lbl">${t('Fraqueza', 'Weakness')}</span>${h.fraqueza >= 0 ? esc(fraqueza(h.fraqueza)) : '…'}</p>
      </div>
    </div>`
  }

  // passando o celular: ninguém vê o que o outro está fazendo
  const passa = (v, msg) => `<div class="ap-passa" role="dialog"><div><span class="lbl">${t('passa o celular', 'pass the phone')}</span>
    <h3>${t(`Pra ${esc(v.js[v.eu].nome)}`, `To ${esc(v.js[v.eu].nome)}`)}</h3><p>${msg}</p>
    <button class="btn big" type="button" data-l="visto">${t('Sou eu', 'It’s me')}</button></div></div>`

  function relogio(v) { return v.dur ? '<span class="gd-relogio" id="lab-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' : '' }
  const faltam = (v) => (v.faltam.length ? t(`Faltam: ${v.faltam.map(esc).join(', ')}`, `Waiting for: ${v.faltam.map(esc).join(', ')}`) : '')
  const topo = (rotulo) => `<div class="imp-topo"><span class="hint">${rotulo}</span><button class="linkish" type="button" data-l="sair">${t('sair', 'leave')}</button></div>`

  // ---------- montar ----------
  function montar(v, ui) {
    const titulo = topo(t('Laboratório', 'Laboratory'))
    if (!v.meu) return `<section class="lab-jogo">${titulo}<p class="gd-aviso calmo" id="lab-faltam">${faltam(v)}</p></section>`
    if (v.meu.heroi) return `<section class="lab-jogo">${titulo}${relogio(v)}<div class="panel lab-pronto"><span class="lbl">${t('Seu herói saiu do tanque', 'Your hero left the tank')}</span>${carta(v.meu.heroi)}
      <p class="gd-aviso calmo" id="lab-faltam">${faltam(v)}</p></div></section>`
    const m = v.meu.mao
    const e = ui.esc
    const grupo = (rot, itens) => `<div class="lab-grupo"><span class="lbl">${rot}</span>${itens}</div>`
    const opcaoTexto = (tipo, i, txt) => `<button class="lab-carta" type="button" data-l="${tipo}" data-v="${i}" aria-pressed="${e[tipo] === i}">${esc(txt)}</button>`
    const escolhas = v.modoMontar === 'sorteio' ? '' : `<div class="panel lab-mesa">
      ${grupo(t('Corpo', 'Body'), `<div class="lab-corpos">${m.corpos.map((k) => `<button class="lab-corpo" type="button" data-l="corpo" data-v="${k}" aria-pressed="${e.corpo === k}"><span class="lab-foto">${capa(k)}</span>${esc(nomePers(k))}</button>`).join('')}</div>`)}
      ${grupo(t('Poder', 'Power'), `<div class="lab-cartas">${m.poderes.map((i) => opcaoTexto('poder', i, poder(i))).join('')}</div>`)}
      ${grupo(t('Fraqueza', 'Weakness'), `<div class="lab-cartas">${m.fraquezas.map((i) => opcaoTexto('fraqueza', i, fraqueza(i))).join('')}</div>`)}
    </div>`
    const pronto = e.corpo && e.poder >= 0 && e.fraqueza >= 0
    const previa = { corpo: e.corpo, poder: e.poder, fraqueza: e.fraqueza, nome: e.nome, pronto: -1 }
    return `<section class="lab-jogo">${titulo}${relogio(v)}
      <div class="lab-bancada${v.modoMontar === 'sorteio' ? ' so-nome' : ''}">
        ${escolhas}
        <div class="panel lab-previa">
          <span class="lbl">${t('Seu herói', 'Your hero')}</span>
          <div id="lab-carta">${carta(previa)}</div>
          <label class="imp-meu-nome"><span class="lbl">${t('Nome do herói', 'Hero name')}</span>
            <input id="lab-heroi" maxlength="26" autocomplete="off" placeholder="${t('vazio = nome surpresa', 'empty = surprise name')}" value="${esc(e.nome)}"></label>
          <button class="btn big" type="button" data-l="pronto"${pronto ? '' : ' disabled'}>${t('Pronto!', 'Done!')}</button>
          <p class="note" id="lab-faltam">${faltam(v)}</p>
        </div>
      </div>
      ${ui.precisaPassar ? passa(v, t('Monte seu herói sem ninguém olhar.', 'Build your hero with nobody looking.')) : ''}
    </section>`
  }

  // ---------- os duelos ----------
  function lado(v, id, h, fim) {
    const venceu = fim && v.resultado.ganhou === id
    const cls = 'lab-lado' + (fim ? (venceu ? ' venceu' : ' perdeu') : '')
    const placa = fim ? `<div class="lab-placa"><b>${v.resultado.placar[id === 'a' ? 0 : 1]} ${v.resultado.placar[id === 'a' ? 0 : 1] === 1 ? t('voto', 'vote') : t('votos', 'votes')}</b>
      <span>${t('criado por', 'made by')} ${esc(v.resultado.donos[id === 'a' ? 0 : 1])}</span></div>` : ''
    if (v.podeVotar) return `<button class="${cls}" type="button" data-l="voto" data-v="${id}">${carta(h)}<span class="btn lab-votar">${t('Votar neste', 'Vote for this one')}</span></button>`
    return `<div class="${cls}">${venceu ? `<b class="lab-selo">${t('Venceu', 'Won')}</b>` : ''}${carta(h)}${placa}</div>`
  }
  function duelo(v, ui) {
    const fim = v.fase === 'resultado'
    const d = v.duelo
    const titulo = `${rodada(d.vivos)} · ${t('duelo', 'duel')} ${d.nDuelo} ${t('de', 'of')} ${d.total}`
    const status = fim ? (v.resultado.desempate ? t('Empatou! Quem desempatou foi o Vigia.', 'A tie! The Watcher broke it.') : '')
      : v.podeVotar ? t('Vote no melhor. Ninguém sabe quem criou.', 'Vote for the best one. Nobody knows who made them.')
        : v.meu.noDuelo ? t('Seu herói está na arena. Aguenta firme.', 'Your hero is in the arena. Hang in there.')
          : t('Esperando os votos…', 'Waiting for the votes…')
    const seguir = fim ? `<div class="go-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-l="seguir">${d.ultimo ? t('Ver o campeão', 'See the champion') : t('Próximo duelo', 'Next duel')}</button>`
      : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}</div>` : ''
    return `<section class="lab-jogo">${topo(titulo)}${fim ? '' : relogio(v)}
      <div class="lab-arena">${lado(v, 'a', d.a, fim)}<b class="lab-vs">VS</b>${lado(v, 'b', d.b, fim)}</div>
      ${status ? `<p class="gd-aviso calmo" id="lab-faltam">${status}${!fim && !v.podeVotar && v.faltam.length ? ' ' + faltam(v) : ''}</p>` : ''}
      ${seguir}
      ${ui.precisaPassar ? passa(v, t('Sua vez de votar, escondido.', 'Your turn to vote, in secret.')) : ''}
    </section>`
  }

  // ---------- o campeão ----------
  function final(v, ui) {
    const c = v.campeao
    return `<section class="lab-jogo"><div class="panel lab-fim">
      <b class="lab-grito">${t('CAMPEÃO', 'CHAMPION')}</b>
      <div class="lab-lado venceu">${carta(c)}<div class="lab-placa"><span>${t('criado por', 'made by')} <b>${esc(c.donoNome)}</b></span></div></div>
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-l="denovo">${t('Jogar de novo', 'Play again')}</button>` : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}
        <button class="linkish" type="button" data-l="sair">${t('sair', 'leave')}</button></div>
      <h3 class="lab-sub">${t('O que rolou', 'What happened')}</h3>
      <ol class="lab-historia">${v.historia.map((h) => `<li><small>${rodada(h.vivos)}</small><span><b>${esc(nomeHeroi(h.ganhou))}</b> ${t('venceu', 'beat')} ${esc(nomeHeroi(h.perdeu))}</span><em>${h.placar[0]} × ${h.placar[1]}${h.desempate ? t(' · Vigia', ' · Watcher') : ''}</em></li>`).join('')}</ol>
    </div></section>`
  }

  function jogo(v, ui) {
    if (v.fase === 'montar') return montar(v, ui)
    if (v.fase === 'fim') return final(v, ui)
    return duelo(v, ui)
  }

  window.LabTelas = { entrada, sala, jogo, carta, faltam, nomeHeroi }
})()
