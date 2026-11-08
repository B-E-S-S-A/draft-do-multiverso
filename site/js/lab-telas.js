// Telas do Laboratório do Alto Evolucionário. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é lab.js.
(function () {
  const V = window.View
  const E = window.Engine
  const M = window.LabMotor
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const cor = (i) => `--cor: var(--c${i % 10})`
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const lote = (key) => E.lotOf('hq:' + indice[key])
  const capa = (key) => V.cover(lote(key))
  const nomePers = (key) => V.nomeDe(lote(key))
  const ident = (key) => V.idDe(lote(key)) || ''
  const NOMES = { corpo: ['Corpo', 'Body'], poder: ['Poder', 'Power'], forca: ['Força', 'Strength'], agilidade: ['Agilidade', 'Agility'],
    inteligencia: ['Inteligência', 'Intelligence'], arma: ['Arma', 'Weapon'], traje: ['Traje', 'Suit'], parceiro: ['Parceiro', 'Sidekick'] }
  const topico = (k) => t(NOMES[k][0], NOMES[k][1])
  // na coluna do meio do duelo, no celular, a palavra inteira não cabe
  const curto = (k) => (k === 'inteligencia' ? t('Intelig.', 'Intellect') : topico(k))
  const rodada = (vivos) => (vivos <= 2 ? t('Final', 'Final') : vivos <= 4 ? t('Semifinal', 'Semifinal') : t('Quartas', 'Quarterfinal'))

  function como() {
    return `<ol class="how">${t(`
      <li>Sai um personagem da Marvel e você decide o que ele vira no seu herói: Corpo, Poder, Força, Agilidade, Inteligência, Arma, Traje ou Parceiro.</li>
      <li>Não dá pra trocar depois e você não sabe quem vem. Todo mundo recebe os mesmos 8 personagens.</li>
      <li>Com os heróis prontos, é mata-mata: dois a dois, tópico contra tópico, sem saber de quem é cada um.</li>
      <li>Todo mundo vota, menos os dois criadores. Deu empate, quem decide é o Vigia.</li>`, `
      <li>A Marvel character shows up and you decide what they become in your hero: Body, Power, Strength, Agility, Intelligence, Weapon, Suit or Sidekick.</li>
      <li>You cannot change it later and you do not know who is next. Everyone gets the same 8 characters.</li>
      <li>Once the heroes are done, it is a knockout: two by two, topic against topic, without knowing whose is whose.</li>
      <li>Everyone votes except the two creators. On a tie, the Watcher decides.</li>`)}
    </ol>`
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
              <button class="btn paper step" type="button" data-l="n" data-v="-1" aria-label="${t('Um a menos', 'One fewer')}"${ui.n <= M.MIN ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-l="n" data-v="1" aria-label="${t('Um a mais', 'One more')}"${ui.n >= M.MAX ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
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
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n}/${M.MAX}</span><button class="linkish" type="button" data-l="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${t('Como jogar', 'How to play')}</h2>${como()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-l="convite">${t('Copiar convite', 'Copy invite')}</button>
            ${v.pessoas.length < M.MAX ? `<button class="btn paper" type="button" data-l="poe-bot">+ bot</button>` : ''}</div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-l="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
          ${n < M.MIN ? `<p class="note">${t('Precisa de pelo menos 3 (dá pra pôr bots).', 'At least 3 are needed (bots count).')}</p>` : ''}
        </div>
      </div>
      <div class="go-row">${v.dono ? `<button class="btn big" type="button" data-l="comecar"${n < M.MIN ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  const relogio = (v) => (v.dur ? '<span class="gd-relogio" id="lab-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' : '')
  const faltam = (v) => (v.faltam.length ? t(`Faltam: ${v.faltam.map(esc).join(', ')}`, `Waiting for: ${v.faltam.map(esc).join(', ')}`) : '')
  const topo = (rotulo) => `<div class="imp-topo"><span class="hint">${rotulo}</span><button class="linkish" type="button" data-l="sair">${t('sair', 'leave')}</button></div>`
  // passando o celular: ninguém vê o que o outro está fazendo
  const passa = (v, msg) => `<div class="ap-passa" role="dialog"><div><span class="lbl">${t('passa o celular', 'pass the phone')}</span>
    <h3>${t(`Pra ${esc(v.js[v.eu].nome)}`, `To ${esc(v.js[v.eu].nome)}`)}</h3><p>${msg}</p>
    <button class="btn big" type="button" data-l="visto">${t('Sou eu', 'It’s me')}</button></div></div>`
  const mini = (key) => `<span class="lab-mini">${capa(key)}</span>`

  // ---------- montar: sai um personagem, você escolhe o tópico ----------
  function montar(v, ui) {
    const n = v.meu ? v.meu.n : 0
    const titulo = topo(`${t('Personagem', 'Character')} ${Math.min(n + 1, M.TOPICOS.length)} ${t('de', 'of')} ${M.TOPICOS.length}`)
    if (!v.meu) return `<section class="lab-jogo">${titulo}<p class="gd-aviso calmo" id="lab-faltam">${faltam(v)}</p></section>`
    const k = v.meu.pers
    const slots = M.TOPICOS.map((top) => {
      const dono = v.meu.heroi[top]
      if (dono) return `<div class="lab-slot cheio">${mini(dono)}<span><span class="lbl">${topico(top)}</span><b>${esc(nomePers(dono))}</b></span></div>`
      if (k) return `<button class="lab-slot livre" type="button" data-l="coloca" data-v="${top}"><span class="lbl">${topico(top)}</span></button>`
      return `<div class="lab-slot vazio"><span class="lbl">${topico(top)}</span></div>`
    }).join('')
    const sorteado = k ? `<div class="panel lab-sorteado">
        <div class="lab-foto${ui.novo ? ' entrou' : ''}">${capa(k)}</div>
        <div><h3>${esc(nomePers(k))}</h3><small>${esc(ident(k))}</small>
          <p class="note">${t('Onde ele entra no seu herói? Não dá pra trocar.', 'Where do they go in your hero? No changing it later.')}</p></div>
      </div>` : `<p class="gd-aviso calmo" id="lab-faltam">${n >= M.TOPICOS.length ? t('Seu herói está pronto.', 'Your hero is done.') + ' ' : ''}${faltam(v)}</p>`
    return `<section class="lab-jogo">${titulo}${relogio(v)}
      <div class="lab-bancada">${sorteado}<div class="panel lab-slots"><span class="lbl">${t('Seu herói', 'Your hero')}</span><div class="lab-grade">${slots}</div></div></div>
      ${ui.precisaPassar ? passa(v, t('Monte seu herói sem ninguém olhar.', 'Build your hero with nobody looking.')) : ''}
    </section>`
  }

  // ---------- os duelos: os dois heróis lado a lado, tópico contra tópico ----------
  const celula = (key, dir) => `<span class="lab-pers${dir ? ' dir' : ''}">${mini(key)}<b>${esc(nomePers(key))}</b></span>`
  function duelo(v, ui) {
    const fim = v.fase === 'resultado'
    const d = v.duelo
    const g = fim ? v.resultado.ganhou : ''
    const nome = (i) => (fim ? t(`Herói de ${esc(v.resultado.donos[i])}`, `${esc(v.resultado.donos[i])}’s hero`) : t(`Herói ${'AB'[i]}`, `Hero ${'AB'[i]}`))
    const votos = (i) => (fim ? `<em>${v.resultado.placar[i]} ${v.resultado.placar[i] === 1 ? t('voto', 'vote') : t('votos', 'votes')}</em>` : '')
    const lado = (i, id) => `<div class="lab-nome${g === id ? ' venceu' : fim ? ' perdeu' : ''}"><b>${nome(i)}</b>${votos(i)}</div>`
    const linhas = M.TOPICOS.map((top) => `<div class="lab-linha">${celula(d.a[top])}<span class="lab-top">${curto(top)}</span>${celula(d.b[top], true)}</div>`).join('')
    const status = fim ? (v.resultado.desempate ? t('Empatou! Quem desempatou foi o Vigia.', 'A tie! The Watcher broke it.') : '')
      : v.podeVotar ? t('Qual herói é melhor?', 'Which hero is better?')
        : v.meu.noDuelo ? t('Seu herói está na arena. Aguenta firme.', 'Your hero is in the arena. Hang in there.')
          : t('Esperando os votos…', 'Waiting for the votes…')
    const votar = v.podeVotar ? `<div class="lab-votos"><button class="btn big" type="button" data-l="voto" data-v="a">${t('Votar no A', 'Vote for A')}</button><button class="btn big" type="button" data-l="voto" data-v="b">${t('Votar no B', 'Vote for B')}</button></div>` : ''
    const seguir = fim ? `<div class="go-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-l="seguir">${d.ultimo ? t('Ver o campeão', 'See the champion') : t('Próximo duelo', 'Next duel')}</button>`
      : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}</div>` : ''
    return `<section class="lab-jogo">${topo(`${rodada(d.vivos)} · ${t('duelo', 'duel')} ${d.nDuelo} ${t('de', 'of')} ${d.total}`)}${fim ? '' : relogio(v)}
      <div class="panel lab-duelo${g ? ' g-' + g : ''}">
        <div class="lab-cab">${lado(0, 'a')}<i>VS</i>${lado(1, 'b')}</div>
        ${linhas}
      </div>
      ${status ? `<p class="gd-aviso calmo" id="lab-faltam">${status}${!fim && !v.podeVotar && v.faltam.length ? ' ' + faltam(v) : ''}</p>` : ''}
      ${votar}${seguir}
      ${ui.precisaPassar ? passa(v, t('Sua vez de votar, escondido.', 'Your turn to vote, in secret.')) : ''}
    </section>`
  }

  // ---------- o campeão ----------
  function final(v, ui) {
    const c = v.campeao
    return `<section class="lab-jogo"><div class="panel lab-fim">
      <b class="lab-grito">${t('CAMPEÃO', 'CHAMPION')}</b>
      <h2>${t(`O herói de ${esc(c.donoNome)}`, `${esc(c.donoNome)}’s hero`)}</h2>
      <div class="lab-grade">${M.TOPICOS.map((top) => `<div class="lab-slot cheio">${mini(c.heroi[top])}<span><span class="lbl">${topico(top)}</span><b>${esc(nomePers(c.heroi[top]))}</b></span></div>`).join('')}</div>
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-l="denovo">${t('Jogar de novo', 'Play again')}</button>` : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}
        <button class="linkish" type="button" data-l="sair">${t('sair', 'leave')}</button></div>
      <h3 class="lab-sub">${t('O que rolou', 'What happened')}</h3>
      <ol class="lab-historia">${v.historia.map((h) => `<li><small>${rodada(h.vivos)}</small><span><b>${esc(h.ganhou)}</b> ${t('venceu', 'beat')} ${esc(h.perdeu)}</span><em>${h.placar[0]} × ${h.placar[1]}${h.desempate ? t(' · Vigia', ' · Watcher') : ''}</em></li>`).join('')}</ol>
    </div></section>`
  }

  function jogo(v, ui) {
    if (v.fase === 'montar') return montar(v, ui)
    if (v.fase === 'fim') return final(v, ui)
    return duelo(v, ui)
  }

  window.LabTelas = { entrada, sala, jogo, nomePers, topico }
})()
