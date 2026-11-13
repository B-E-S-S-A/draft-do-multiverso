// Telas da Identidade Secreta. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é identidade.js.
(function () {
  const V = window.View
  const E = window.Engine
  const M = window.IdentidadeMotor
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const GD = () => window.GradeDados
  const GT = () => window.GradeTelas
  const indice = {}
  E.D.hq.forEach((h, i) => { indice[h.key] = i })
  const capa = (key) => V.cover(E.lotOf('hq:' + indice[key]))
  const nome = (key) => GT().nome(key)
  const COR = ['p1', 'p2']

  // a pergunta pronta na língua de quem olha: o tema com interrogação
  const pergunta = (id, versao) => { const c = GD().porId[id]; return c ? GD().textos(c, versao)[en() ? 'en' : 'pt'][0].replace(/[.!?]+$/, '') + '?' : '' }
  const RESP = { sim: ['Sim!', 'Yes!'], nao: ['Não!', 'No!'], naosei: ['Não sei', 'Not sure'] }
  const resp = (r) => t(RESP[r][0], RESP[r][1])
  const BOTAO = { sim: ['Sim', 'Yes'], nao: ['Não', 'No'], naosei: ['Não sei', 'Not sure'] }

  function como() {
    return `<ol class="how">${t(`
      <li>Os dois olham o mesmo tabuleiro de personagens, e cada um escolhe um deles em segredo.</li>
      <li>Na sua vez, faça uma pergunta de sim ou não: "voa?", "é vilão?", "tem barba?". Depois vire as cartas de quem não bate.</li>
      <li>Achou que sabe? Chute na sua vez. Acertou, ganhou. Errou, perdeu na hora.</li>
      <li>No clássico vocês perguntam falando (ou escrevendo, se estiverem longe). Na lista pronta, o site responde por vocês.</li>`, `
      <li>You both look at the same board of characters, and each secretly picks one of them.</li>
      <li>On your turn, ask a yes-or-no question: "can they fly?", "villain?", "beard?". Then flip down whoever doesn’t fit.</li>
      <li>Think you know? Guess on your turn. Right, you win. Wrong, you lose on the spot.</li>
      <li>In the classic mode you ask out loud (or type, if you are apart). With the ready-made list, the site answers for you.</li>`)}
    </ol>`
  }

  // ---------- as regras: personagens, quantos e como perguntar ----------
  const MODOS = [
    { id: 'falando', pt: 'Clássico', en: 'Classic', ps: 'pergunta falando ou escrevendo, e o outro responde', es: 'ask out loud or by typing, and the other answers' },
    { id: 'lista', pt: 'Lista pronta', en: 'Ready-made list', ps: 'toca numa pergunta e o site responde', es: 'tap a question and the site answers' },
  ]
  function regras(o, pode, contraPc) {
    const dis = pode ? '' : ' disabled'
    const qtds = M.QTDS.map((n) => `<button class="preset" type="button" data-q="qtd" data-v="${n}" aria-pressed="${o.qtd === n}"${dis}>${n}${n === M.CLASSICO ? ` · ${t('clássico', 'classic')}` : ''}</button>`).join('')
    const modos = MODOS.map((x) => `<button class="mode" type="button" data-q="modo" data-v="${x.id}" aria-pressed="${o.modo === x.id}"${dis}><b>${t(x.pt, x.en)}</b><small>${t(x.ps, x.es)}</small></button>`).join('')
    return `${GT().blocoVersao(o, pode, 'q', t('De onde vêm os personagens', 'Where the characters come from'))}
      <div class="field"><span class="lbl">${t('Quantos personagens no tabuleiro', 'Characters on the board')}</span><div class="presets">${qtds}</div></div>
      <div class="field"><span class="lbl">${t('Como perguntar', 'How to ask')}</span><div class="modes se-modos">${modos}</div>
      ${contraPc && o.modo === 'falando' ? `<p class="note">${t('Contra o computador é sempre com a lista pronta.', 'Against the computer it is always the ready-made list.')}</p>` : ''}</div>`
  }

  function entrada(ui, m) {
    return `<section class="setup se">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Regras', 'Rules')}</h2>
          ${regras(ui, true, true)}
          <div class="go-row"><button class="btn big" type="button" data-q="bots">${t('Jogar contra o computador', 'Play against the computer')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como()}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <button class="btn green fila-btn" type="button" data-fila="identidade">${t('Procurar partida', 'Find a match')}</button>
            <p class="note">${t('Com gente desconhecida, a partida é sempre com a lista pronta.', 'With strangers, the match always uses the ready-made list.')}</p>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="se-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-q="criar">${t('Criar sala', 'Create room')}</button>
              <input id="se-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-q="entrar">${t('Entrar', 'Join')}</button></div>
            ${m.erro ? `<p class="neterr" role="alert">${esc(m.erro)}</p>` : ''}${m.status ? `<p class="note" role="status">${esc(m.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup se">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n}/2</span><button class="linkish" type="button" data-q="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>${regras(v, v.dono, false)}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-q="convite">${t('Copiar convite', 'Copy invite')}</button></div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala gd-sala">${v.pessoas.map((p, i) => `<li class="${COR[i] || ''}${p.on ? '' : ' fora'}"><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : ''].filter(Boolean).join(' · ')}</small></li>`).join('')}</ol>
          ${n < 2 ? `<p class="note">${t('Esperando a outra pessoa entrar…', 'Waiting for the other person to join…')}</p>` : ''}
          ${como()}
        </div>
      </div>
      <div class="go-row">${v.dono ? `<button class="btn big" type="button" data-q="comecar"${n < 2 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- a partida ----------
  // uma carta: a frente com a capa e o nome; o verso quando cai. Sua própria carta ganha um selo.
  function classesCarta(v, key, ui) {
    const fim = v.fase === 'fim'
    return ['se-carta',
      v.fase !== 'escolher' && v.meu.caidos.includes(key) && !(fim && v.res.segredos.includes(key)) ? 'caiu' : '',
      ui.alvo === key ? 'alvo' : '',
      v.meu.secreto === key ? 'eu' : '',
      fim && v.res.segredos.includes(key) ? 'segredo' : ''].filter(Boolean).join(' ')
  }
  function carta(v, key, ui) {
    const n = esc(nome(key))
    return `<button class="${classesCarta(v, key, ui)}" type="button" data-q="carta" data-v="${key}" aria-label="${n}"${v.fase === 'fim' ? ' disabled' : ''}>
      <span class="se-gira">
        <span class="se-face se-frente"><span class="se-foto">${capa(key)}</span><span class="se-nome">${n}</span></span>
        <span class="se-face se-verso"><i>?</i><span class="se-nome">${n}</span></span>
      </span><b class="se-selo">${t('você', 'you')}</b></button>`
  }
  function topoTab(v) {
    if (v.fase === 'escolher') return `<span class="lbl">${t('Escolha o seu personagem secreto', 'Pick your secret character')}</span>`
    const em = v.js[v.eu].restam
    return `<span class="lbl">${t('Seu tabuleiro', 'Your board')}</span><span class="se-conta"><b>${em}</b> ${t(`em pé de ${v.qtd}`, `standing of ${v.qtd}`)}</span>`
  }
  const tabuleiro = (v, ui) => `<div class="panel se-tabuleiro${v.fase === 'escolher' ? ' escolhendo' : ''}${ui.chutando ? ' chutando' : ''}" id="se-tabuleiro">
    <div class="se-tab-topo" id="se-tab-topo">${topoTab(v)}</div>
    <div class="se-tab" id="se-tab">${v.tabuleiro.map((k) => carta(v, k, ui)).join('')}</div></div>`

  // o placar e de quem é a vez
  function barra(v, placar) {
    const nomeDe = (j) => v.js[j].nome
    const marca = (j) => (j === v.eu && !/^(você|you)$/i.test(nomeDe(j)) ? ` <small>(${t('você', 'you')})</small>` : '')
    const vez = (j) => v.fase === 'jogo' && v.vez === j
    const sub = (j) => (v.fase === 'escolher' ? (v.js[j].escolheu ? t('já escolheu', 'has picked') : t('escolhendo…', 'picking…')) : t(`${v.js[j].restam} em pé`, `${v.js[j].restam} standing`))
    const quem = (j) => `<span class="se-jog ${COR[j]}${vez(j) ? ' vez' : ''}">${vez(j) ? `<i class="se-vez-tag">${t('na vez', 'turn')}</i>` : ''}
      <b>${esc(nomeDe(j))}${marca(j)}</b><small>${sub(j)}</small><em>${placar ? placar[j] : 0}</em></span>`
    return `<div class="se-barra" id="se-barra">${quem(0)}<i class="se-vs">VS</i>${quem(1)}</div>`
  }

  // o balão da pergunta e o estouro da resposta
  const balao = (quem, txt, cor) => `<div class="se-balao ${cor}"><small>${esc(quem)}</small><span>${txt}</span></div>`
  const textoPergunta = (v, x) => (x.id ? esc(pergunta(x.id, v.versao)) : x.txt ? `“${esc(x.txt)}”` : `<i>${t('perguntou em voz alta', 'asked out loud')}</i>`)
  const estouro = (r) => `<b class="se-burst ${r}"><span>${resp(r)}</span></b>`

  // o painel de ação: muda conforme a fase, a etapa e de quem é a vez
  function acao(v, ui) {
    if (v.fase === 'fim') return fimDeJogo(v)
    if (ui.caiu) return `<div class="se-msg"><b>${t(`${esc(ui.caiu)} caiu.`, `${esc(ui.caiu)} dropped.`)}</b><p>${t('Esperando voltar…', 'Waiting for them to come back…')}</p></div>`
    if (v.fase === 'escolher') return escolha(v, ui)
    const eu = v.eu
    const minha = v.vez === eu
    const outro = v.js[1 - eu].nome
    const quemJoga = v.js[v.vez].nome
    const chutar = `<button class="btn red" type="button" data-q="chutar">${t('Chutar quem é', 'Guess who it is')}</button>`
    if (minha && ui.chutando) {
      if (!ui.alvo) return `<div class="se-msg"><b class="se-titulo">${t('Quem é?', 'Who is it?')}</b><p>${t('Toque na carta. Se errar, você perde.', 'Tap the card. If you miss, you lose.')}</p>
        <div class="se-botoes"><button class="btn paper" type="button" data-q="volta">${t('Voltar', 'Back')}</button></div></div>`
      return `<div class="se-msg"><b class="se-titulo">${t(`É ${esc(nome(ui.alvo))}?`, `Is it ${esc(nome(ui.alvo))}?`)}</b><p>${t('Se errar, você perde na hora.', 'If you miss, you lose on the spot.')}</p>
        <div class="se-botoes"><button class="btn red big" type="button" data-q="confirma">${t('Chutar!', 'Guess!')}</button><button class="btn paper" type="button" data-q="volta">${t('Voltar', 'Back')}</button></div></div>`
    }
    const ultima = v.log[v.log.length - 1]
    if (v.etapa === 'virar') {
      const pergunta = balao(minha ? t('Você perguntou', 'You asked') : t(`${quemJoga} perguntou`, `${quemJoga} asked`), textoPergunta(v, ultima), COR[v.vez])
      if (minha) {
        const quem = v.modo === 'lista' ? t('O site respondeu', 'The site answered') : t(`${esc(outro)} respondeu`, `${esc(outro)} answered`)
        return `<div class="se-msg">${pergunta}<div class="se-resposta"><small>${quem}</small>${estouro(ultima.r)}</div>
          <p class="se-dica">${t('Agora vire as cartas de quem não bate.', 'Now flip down whoever doesn’t fit.')}</p>
          <div class="se-botoes"><button class="btn big" type="button" data-q="passa">${t('Pronto, passar a vez', 'Done, end turn')}</button>${chutar}</div></div>`
      }
      const quem = v.modo === 'lista' ? t('O site respondeu por você', 'The site answered for you') : t('Você respondeu', 'You answered')
      return `<div class="se-msg">${pergunta}<div class="se-resposta"><small>${quem}</small>${estouro(ultima.r)}</div>
        <p class="se-espera">${t(`${esc(quemJoga)} está virando as cartas`, `${esc(quemJoga)} is flipping cards`)}<i class="se-pontos"></i></p></div>`
    }
    // perguntar
    if (minha && v.modo === 'lista') {
      if (!v.mao.length) return `<div class="se-msg"><b class="se-titulo">${t('Nenhuma pergunta separa quem sobrou.', 'No question splits who is left.')}</b><p>${t('Hora de chutar (ou passar a vez).', 'Time to guess (or end your turn).')}</p>
        <div class="se-botoes">${chutar}${v.podePassar ? `<button class="btn paper" type="button" data-q="passa">${t('Passar a vez', 'End turn')}</button>` : ''}</div></div>`
      return `<div class="se-msg"><b class="se-titulo">${t('Sua vez! Escolha uma pergunta', 'Your turn! Pick a question')}</b>
        <div class="se-mao">${v.mao.map((id) => `<button class="se-q" type="button" data-q="pergunta" data-v="${id}">${esc(pergunta(id, v.versao))}</button>`).join('')}</div>
        <div class="se-botoes">${chutar}</div></div>`
    }
    if (minha) {
      const enviada = v.pergunta ? `${balao(t('Você perguntou', 'You asked'), `“${esc(v.pergunta)}”`, COR[eu])}<p class="se-espera">${t(`Esperando ${esc(outro)} responder`, `Waiting for ${esc(outro)} to answer`)}<i class="se-pontos"></i></p>` : ''
      return `<div class="se-msg"><b class="se-titulo">${t('Sua vez! Faça uma pergunta de sim ou não', 'Your turn! Ask a yes-or-no question')}</b>
        <p>${t(`Fale em voz alta, ou escreva aqui se ${esc(outro)} estiver longe.`, `Say it out loud, or type it here if ${esc(outro)} is far away.`)}</p>
        <div class="online-row se-escreve"><input id="se-perg" maxlength="120" autocomplete="off" placeholder="${t('Ex.: é mutante?', 'E.g. is it a mutant?')}"><button class="btn paper" type="button" data-q="escreve">${t('Enviar', 'Send')}</button></div>
        ${enviada}<div class="se-botoes">${chutar}</div></div>`
    }
    if (v.modo === 'lista') return `<div class="se-msg"><b class="se-titulo">${t(`Vez de ${esc(quemJoga)}`, `${esc(quemJoga)}’s turn`)}</b><p class="se-espera">${t('Escolhendo a pergunta', 'Picking a question')}<i class="se-pontos"></i></p><p class="note">${t('O site responde por você.', 'The site answers for you.')}</p></div>`
    return `<div class="se-msg"><b class="se-titulo">${t(`${esc(quemJoga)} vai perguntar`, `${esc(quemJoga)} is asking`)}</b>
      ${v.pergunta ? balao(t(`${quemJoga} perguntou`, `${quemJoga} asked`), `“${esc(v.pergunta)}”`, COR[v.vez]) : `<p>${t('Ouça a pergunta e responda pelo seu personagem:', 'Listen to the question and answer for your character:')}</p>`}
      <p class="note">${t(`Lembre: você é ${esc(nome(v.meu.secreto))}.`, `Remember: you are ${esc(nome(v.meu.secreto))}.`)}</p>
      <div class="se-responde">${['sim', 'nao', 'naosei'].map((r) => `<button class="se-r ${r}" type="button" data-q="responde" data-v="${r}">${t(BOTAO[r][0], BOTAO[r][1])}</button>`).join('')}</div></div>`
  }

  // escolher o personagem: toca numa carta e confirma, ou sorteia
  function escolha(v, ui) {
    const outro = v.js[1 - v.eu]
    if (v.meu.secreto) {
      return `<div class="se-msg"><b class="se-titulo">${t(`Você é ${esc(nome(v.meu.secreto))}`, `You are ${esc(nome(v.meu.secreto))}`)}</b>
        <p class="se-espera">${outro.escolheu ? t('Começando', 'Starting') : t(`Esperando ${esc(outro.nome)} escolher`, `Waiting for ${esc(outro.nome)} to pick`)}<i class="se-pontos"></i></p></div>`
    }
    if (!ui.alvo) {
      return `<div class="se-msg"><b class="se-titulo">${t('Quem você vai ser?', 'Who will you be?')}</b>
        <p>${t('Toque numa carta do tabuleiro. Ninguém vai ver qual você escolheu.', 'Tap a card on the board. Nobody will see which one you picked.')}</p>
        <div class="se-botoes"><button class="btn paper" type="button" data-q="sorteia">${t('Sortear pra mim', 'Pick one for me')}</button></div></div>`
    }
    return `<div class="se-msg"><b class="se-titulo">${t(`Ser ${esc(nome(ui.alvo))}?`, `Be ${esc(nome(ui.alvo))}?`)}</b>
      <p>${t('Depois não dá pra trocar.', 'You cannot change it later.')}</p>
      <div class="se-botoes"><button class="btn big" type="button" data-q="escolhe">${t('Esse é o meu', 'That’s mine')}</button><button class="btn paper" type="button" data-q="sorteia">${t('Sortear', 'Random')}</button></div></div>`
  }

  function fimDeJogo(v) {
    const r = v.res
    const venceu = r.vencedor === v.eu
    const quem = v.js[r.quem].nome
    const titulo = venceu ? t('Você venceu!', 'You won!') : t(`${esc(v.js[r.vencedor].nome)} venceu!`, `${esc(v.js[r.vencedor].nome)} won!`)
    const frase = r.certo ? t(`${esc(quem)} acertou: era ${esc(nome(r.key))}.`, `${esc(quem)} got it: it was ${esc(nome(r.key))}.`)
      : t(`${esc(quem)} chutou ${esc(nome(r.key))}, mas era ${esc(nome(r.segredos[1 - r.quem]))}.`, `${esc(quem)} guessed ${esc(nome(r.key))}, but it was ${esc(nome(r.segredos[1 - r.quem]))}.`)
    const segredo = (j) => `<figure class="se-revela ${COR[j]}${r.vencedor === j ? ' venceu' : ''}">${capa(r.segredos[j])}<figcaption><small>${esc(v.js[j].nome)}</small><b>${esc(nome(r.segredos[j]))}</b></figcaption></figure>`
    return `<div class="se-msg se-fim ${venceu ? 'ganhou' : 'perdeu'}"><b class="se-fim-titulo">${titulo}</b><p>${frase}</p>
      <div class="se-revelas">${segredo(0)}<i class="se-vs">VS</i>${segredo(1)}</div>
      <div class="se-botoes">${v.local || v.dono ? `<button class="btn big" type="button" data-q="denovo">${t('Jogar de novo', 'Play again')}</button>` : `<p class="hint">${t('Esperando quem criou a sala…', 'Waiting for the host…')}</p>`}
        <button class="linkish" type="button" data-q="sair">${t('sair', 'leave')}</button></div></div>`
  }

  // o histórico de perguntas
  function log(v) {
    const linhas = [...v.log].reverse().map((x) => `<li class="${COR[x.j]}"><b>${esc(v.js[x.j].nome)}</b><span>${textoPergunta(v, x)}</span><em class="${x.r}">${resp(x.r).replace('!', '')}</em></li>`).join('')
    return `<div class="panel se-log" id="se-log"><span class="lbl">${t('Perguntas', 'Questions')}</span>${linhas ? `<ol>${linhas}</ol>` : `<p class="note">${t('Nenhuma ainda.', 'None yet.')}</p>`}</div>`
  }

  // o seu personagem, numa ficha com carimbo
  const meu = (v) => (v.meu.secreto
    ? `<div class="panel se-meu" id="se-meu-card"><span class="se-meu-capa">${capa(v.meu.secreto)}</span>
      <div><span class="lbl">${t('Você é', 'You are')}</span><b>${esc(nome(v.meu.secreto))}</b><small>${t('não deixe ninguém ver', 'don’t let anyone see')}</small></div><i class="se-carimbo">${t('Secreto', 'Secret')}</i></div>`
    : `<div class="panel se-meu vazio" id="se-meu-card"><span class="se-meu-capa"><b>?</b></span>
      <div><span class="lbl">${t('Você é', 'You are')}</span><b>${t('Escolha no tabuleiro', 'Pick on the board')}</b></div></div>`)

  // no celular, o painel gruda embaixo quando a pessoa precisa mexer no tabuleiro e depois apertar um botão
  const fixo = (v, ui) => (v.fase === 'escolher' && !v.meu.secreto && ui.alvo) || (v.fase === 'jogo' && v.vez === v.eu && (v.etapa === 'virar' || ui.chutando))

  function jogo(v, ui) {
    return `<section class="se-jogo">
      ${barra(v, v.placar)}
      <div class="se-mesa">
        <div class="se-lado-a">${tabuleiro(v, ui)}</div>
        <aside class="se-lado">
          ${meu(v)}
          <div class="panel se-acao${fixo(v, ui) ? ' fixo' : ''}" id="se-acao">${acao(v, ui)}</div>
          ${log(v)}
          ${v.local ? '' : `<button class="linkish se-sair" type="button" data-q="sair">${t('sair da partida', 'leave the match')}</button>`}
        </aside>
      </div>
    </section>`
  }

  // o que, mudando, pede pra redesenhar o painel de ação (fora isso, só as cartas e o placar mudam)
  const forma = (v, ui) => [v.fase, v.vez, v.etapa, v.pergunta, v.mao.join(), v.log.length, v.meu.secreto, v.js.map((p) => p.escolheu).join(), ui.chutando, ui.alvo, ui.caiu].join('|')

  window.IdentidadeTelas = { entrada, sala, jogo, barra, acao, log, meu, topoTab, classesCarta, fixo, forma, pergunta }
})()
