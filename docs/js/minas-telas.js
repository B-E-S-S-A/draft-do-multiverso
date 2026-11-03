// Telas das Minas do Multiverso. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é minas.js.
// Cada aparelho escreve na própria língua (Lingua): o tema e os nomes vêm em português e viram inglês aqui.
(function () {
  const esc = window.View.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const titulo = (v) => window.ApostoTemas.titulo(v.tema.id, v.tema.titulo)
  const nm = (v, n) => esc(window.ApostoTemas.nome(v.tema.id, n))
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  // pixel art: coração (cheio = vida, vazio = vida perdida) e a bomba das minas
  const CORACAO = '<svg class="mn-px mn-cor" viewBox="0 0 7 6" aria-hidden="true"><path d="M1 0h2v1h1V0h2v1h1v2H6v1H5v1H4v1H3V5H2V4H1V3H0V1h1z"/><path class="brilho" d="M1 1h1v1H1z"/></svg>'
  const BOMBA = '<svg class="mn-px mn-bomba" viewBox="0 0 10 10" aria-hidden="true"><path class="faisca" d="M7 0h1v1H7zM6 1h1v1H6zM8 1h1v1H8z"/><path class="pavio" d="M6 2h1v1H6zM5 3h1v1H5z"/>'
    + '<path d="M3 3h2v1h1v1h1v1h1v2H7v1H6v1H3V9H2V8H1V6h1V5h1z"/><path class="brilho" d="M2 6h1v1H2zM3 5h1v1H3z"/></svg>'
  const coracoes = (n, ini = 3) => (n > 0 ? Array.from({ length: Math.max(n, ini) }, (_, k) => `<span class="${k < n ? '' : 'vazio'}">${CORACAO}</span>`).join('') : `<span class="mn-fora">${t('fora', 'out')}</span>`)
  const relogio = () => '<span class="ap-relogio mn-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>'

  const COMO = () => `<ol class="how">${t(`
    <li>Sai um tema ("Inimigos do Homem-Aranha") e cada um <b>planta 2 minas</b> em segredo: digita dois nomes que valem.</li>
    <li>Dois fazem o <b>duelo</b>: cada um, na sua vez, fala um nome do tema em voz alta e toca FALEI.</li>
    <li>Todo mundo escuta. Falaram a sua mina? Toque <b>BOOM!</b>: quem falou perde uma vida e você ganha uma.</li>
    <li>Achou que o outro falou um nome que não vale? <b>DUVIDO!</b> Digita o nome e o celular confere. Quem errou perde vida.</li>
    <li>Prefere não falar? Escreva o nome: o celular confere sozinho se vale, se repetiu e se é mina.</li>
    <li>Travou (12 segundos sem falar)? Perde vida. Quem sai continua plantando minas. Último vivo ganha.</li>`, `
    <li>A theme comes up ("Spider-Man villains") and everyone <b>plants 2 mines</b> in secret: type two names that count.</li>
    <li>Two players <b>duel</b>: on their turn, each says a name from the theme out loud and taps SAID IT.</li>
    <li>Everyone listens. Someone said your mine? Tap <b>BOOM!</b>: whoever said it loses a life and you gain one.</li>
    <li>Think the other one said a name that doesn’t count? <b>CHALLENGE!</b> Type the name and the phone checks. Whoever was wrong loses a life.</li>
    <li>Rather not talk? Type the name: the phone checks on its own if it counts, if it was repeated and if it’s a mine.</li>
    <li>Froze (12 seconds without a name)? Lose a life. Whoever is out keeps planting mines. Last one alive wins.</li>`)}
  </ol>`

  function vidas(sel, pode) {
    return `<div class="field"><span class="lbl">${t('Vidas', 'Lives')}</span><div class="presets">${[2, 3, 4].map((x) =>
      `<button class="preset mn-vidas" type="button" data-m="vidas" data-v="${x}" aria-pressed="${sel === x}"${pode ? '' : ' disabled'}><span class="mn-coracoes">${coracoes(x, x)}</span> ${x} ${t('vidas', 'lives')}</button>`).join('')}</div></div>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">${t('Jogador', 'Player')} ${p + 1}</span>
      <input id="mn-nome-${p}" maxlength="14" autocomplete="off" placeholder="${t('Jogador', 'Player')} ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup mn">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Num celular só', 'On one phone')}</h2>
          <div class="field"><span class="lbl">${t('Jogadores', 'Players')}</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-m="n" data-v="-1" aria-label="${t('Um a menos', 'One fewer')}"${ui.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-m="n" data-v="1" aria-label="${t('Um a mais', 'One more')}"${ui.n >= 7 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${vidas(ui.vidas, true)}
          <div class="go-row"><button class="linkish" type="button" data-m="bots">${t('testar sozinho contra 3 bots', 'try it alone against 3 bots')}</button>
            <button class="btn big" type="button" data-m="local">${t('Começar', 'Start')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${COMO()}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="mn-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-m="criar">${t('Criar sala', 'Create room')}</button>
              <input id="mn-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-m="entrar">${t('Entrar', 'Join')}</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup mn">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n} ${t('no campo', 'on the field')}</span><button class="linkish" type="button" data-m="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>${vidas(v.vidas, v.dono)}${COMO()}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-m="convite">${t('Copiar convite', 'Copy invite')}</button>
            <button class="btn paper" type="button" data-m="poe-bot"${v.pessoas.length >= 7 ? ' disabled' : ''}>+ bot</button></div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-m="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 2 ? `<span class="lbl">${t('Falta gente (ou um bot)', 'Need more people (or a bot)')}</span>` : ''}<button class="btn big" type="button" data-m="comecar"${n < 2 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- jogo ----------
  function placar(v) {
    return `<div class="mn-placar">${v.js.map((p, i) => `<span class="${p.vidas <= 0 ? 'fora' : ''}${v.par.includes(i) && v.fase === 'duelo' ? ' duela' : ''}" style="${cor(i)}">${esc(p.nome)} <b class="mn-coracoes">${coracoes(p.vidas, v.vidasIni)}</b></span>`).join('')}
      ${v.dobro ? `<small class="mn-dobro">${t('cada erro tira 2', 'each mistake costs 2')}</small>` : ''}</div>`
  }

  function tema(v) {
    return `<div class="mn-tema"><span class="mn-faixa" aria-hidden="true"></span><span class="ap-rodada">${t('duelo', 'duel')} ${v.rodada}</span><h2>${esc(titulo(v))}</h2>
      <span class="mn-fileira" aria-hidden="true">${BOMBA.repeat(7)}</span></div>`
  }

  // plantio: num celular só o aparelho passa de mão em mão; online cada um planta no seu
  function plantar(v, ui) {
    const feitos = v.js.map((p, i) => `<span class="${p.plantou ? 'ok' : ''}" style="${cor(i)}">${esc(p.nome)} ${p.plantou ? BOMBA + BOMBA : `<i>${t('plantando…', 'planting…')}</i>`}</span>`).join('')
    const casas = (minhas) => `<div class="mn-casas">${[0, 1].map((k) => minhas[k] ? `<span class="cheia">${BOMBA}<b>${nm(v, minhas[k].n)}</b></span>` : `<span class="vazia"><i>?</i><b>${t('mina', 'mine')} ${k + 1}</b></span>`).join('')}</div>`
    let meio
    const quem = ui.local ? v.plantando : v.eu
    if (quem < 0 || quem === undefined) meio = `<p class="hint">${t('Esperando…', 'Waiting…')}</p>`
    else if (ui.local && ui.vendo !== quem) {
      meio = `<div class="mn-passa" style="${cor(quem)}"><span class="lbl">${t('passa o celular', 'pass the phone')}</span><h3>${t(`${esc(nome(v, quem))}, sua vez de plantar`, `${esc(nome(v, quem))}, your turn to plant`)}</h3>
        <p>${t('Os outros não olham!', 'Everyone else, no peeking!')}</p><button class="btn big" type="button" data-m="ver" data-v="${quem}">${t('Sou eu', 'It’s me')}</button></div>`
    } else {
      const minhas = (ui.local ? v.todas && v.todas[quem] : v.minhas) || []
      meio = minhas.length >= 2
        ? `<div class="mn-plantio" style="${cor(quem)}"><span class="lbl">${t('suas minas estão no campo', 'your mines are on the field')}</span>${casas(minhas)}
            ${ui.local ? `<button class="btn big" type="button" data-m="esconder">${t('Pronto, esconde e passa', 'Done, hide it and pass')}</button>` : `<p class="hint">${t('Esperando os outros plantarem…', 'Waiting for the others to plant…')}</p>`}</div>`
        : `<div class="mn-plantio" style="${cor(quem)}"><span class="lbl">${esc(nome(v, quem))}: ${t(`plante a mina ${minhas.length + 1} de 2`, `plant mine ${minhas.length + 1} of 2`)}</span>
            <p class="note">${t(`Digite um nome que vale pra <b>${esc(titulo(v))}</b>. Dica: mine o que os outros vão falar.`, `Type a name that counts for <b>${esc(titulo(v))}</b>. Tip: mine what the others are going to say.`)}</p>
            ${casas(minhas)}
            <div class="online-row mn-campo"><input id="mn-mina" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.mina || '')}">
              <button class="btn red" type="button" data-m="plantar">${t('Plantar', 'Plant')}</button></div>
            ${ui.aviso ? `<p class="neterr" role="alert">${esc(ui.aviso)}</p>` : ''}</div>`
    }
    return `${meio}<div class="mn-feitos">${feitos}</div>${!ui.local && v.dur ? `<div class="mn-vez">${relogio()}</div>` : ''}`
  }

  function duelo(v, ui) {
    const [a, b] = v.par
    const fala = v.falando
    const ult = v.ultimo
    const falas = v.falas.map((f) => `<span style="${cor(f.j)}">${f.nome ? nm(v, f.nome) : '…'}</span>`).join('')
    const souFala = ui.local ? !v.js[fala].bot : v.eu === fala
    const posso = (j) => ui.local || v.eu === j
    // BOOM: no próprio celular aparecem as suas minas; num celular só, escolhe o dono e depois a mina
    let boom = ''
    if (ult) {
      if (!ui.local && v.minhas && v.eu !== ult.j) {
        const vivas = v.minhas.map((m, k) => ({ ...m, k })).filter((m) => !m.explodiu)
        if (vivas.length) boom = `<div class="mn-boom-row">${vivas.map((m) => `<button class="mn-boom" type="button" data-m="boom" data-v="${m.k}" data-dono="${v.eu}"><b>BOOM!</b><small>${nm(v, m.n)}</small></button>`).join('')}</div>`
      }
      if (ui.local) boom = ui.boomDono === undefined
        ? `<button class="mn-boom grande" type="button" data-m="boom-abre"><b>BOOM!</b><small>${t('falaram a minha mina', 'they said my mine')}</small></button>`
        : boomLocal(v, ui)
    }
    const outro = ult ? (ult.j === a ? b : a) : -1
    const duvida = ult && posso(outro) && !v.js[outro].bot
      ? (ui.digitando
        ? `<div class="ap-juiz ap-duvido"><label class="ap-digita"><span class="lbl">${esc(nome(v, outro))}: ${t(`digite o nome que ${esc(nome(v, ult.j))} falou`, `type the name ${esc(nome(v, ult.j))} said`)}</span>
            <input id="mn-duvida" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.duvida || '')}"></label>
            <div class="ap-juiz-btns"><button class="btn paper" type="button" data-m="fecha-duvida">${t('cancelar', 'cancel')}</button><button class="btn red" type="button" data-m="duvidar">${t('Conferir', 'Check')}</button></div></div>`
        : `<button class="btn paper mn-duvido" type="button" data-m="abre-duvida">${ui.local ? esc(nome(v, outro)) + ': ' : ''}${t('DUVIDO do último nome', 'CHALLENGE the last name')}</button>`)
      : ''
    return `<div class="mn-arena">
        <span class="mn-lado${fala === a ? ' vez' : ''}" style="${cor(a)}"><small>${fala === a ? t('falando', 'talking') : t('escutando', 'listening')}</small>${esc(nome(v, a))}<b class="mn-coracoes">${coracoes(v.js[a].vidas, v.vidasIni)}</b></span>
        <i class="mn-vs" aria-hidden="true">VS</i>
        <span class="mn-lado dir${fala === b ? ' vez' : ''}" style="${cor(b)}"><small>${fala === b ? t('falando', 'talking') : t('escutando', 'listening')}</small>${esc(nome(v, b))}<b class="mn-coracoes">${coracoes(v.js[b].vidas, v.vidasIni)}</b></span>
      </div>
      <div class="mn-vez" style="${cor(fala)}"><span class="lbl">${t(`vez de ${esc(nome(v, fala))}`, `${esc(nome(v, fala))}’s turn`)}</span>${relogio()}</div>
      ${v.pausa >= 0 ? `<p class="mn-pausa" role="status">${t(`relógio parado: ${esc(nome(v, v.pausa))} está digitando um duvido…`, `clock stopped: ${esc(nome(v, v.pausa))} is typing a challenge…`)}</p>` : ''}
      ${souFala && v.pausa < 0 ? `<button class="mn-falei" type="button" data-m="falei" style="${cor(fala)}"><b>${t('FALEI!', 'SAID IT!')}</b><small>${ui.local ? esc(nome(v, fala)) + t(' fala um nome e toca', ' says a name and taps') : t('fale um nome e toque', 'say a name and tap')}</small></button>
        <div class="ap-escreve"><label class="ap-digita"><span class="lbl">${t('ou escreva o nome (o celular confere)', 'or type the name (the phone checks)')}</span>
          <span class="ap-escreve-linha"><input id="mn-escreve" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="send">
          <button class="btn green" type="button" data-m="escrever">${t('Enviar', 'Send')}</button></span></label></div>` : ''}
      ${ult && ult.nome ? `<p class="mn-ultimo" style="${cor(ult.j)}">${esc(nome(v, ult.j))} ${t('falou', 'said')}: <b>${nm(v, ult.nome)}</b></p>` : ''}
      <div class="mn-falas">${falas || `<small>${t('ninguém falou ainda', 'nobody has said a name yet')}</small>`}</div>
      ${boom}${duvida}
      ${!ui.local && v.minhas ? `<p class="mn-suas"><span class="lbl">${t('suas minas', 'your mines')}</span>${v.minhas.map((m) => `<span class="${m.explodiu ? 'foi' : ''}">${BOMBA}${nm(v, m.n)}</span>`).join('')}</p>` : ''}`
  }

  function boomLocal(v, ui) {
    const ult = v.ultimo
    if (ui.boomDono === null) {
      const donos = v.js.map((p, i) => i).filter((i) => i !== ult.j && (v.todas[i] || []).some((m) => !m.explodiu))
      return `<div class="ap-juiz mn-boom-escolhe"><span class="lbl">${t(`de quem é a mina que ${esc(nome(v, ult.j))} falou?`, `whose mine did ${esc(nome(v, ult.j))} say?`)}</span>
        <div class="bo-escolhe">${donos.map((i) => `<button class="preset" type="button" data-m="boom-dono" data-v="${i}" style="${cor(i)}">${esc(nome(v, i))}</button>`).join('')}</div>
        <button class="linkish" type="button" data-m="boom-fecha">${t('cancelar', 'cancel')}</button></div>`
    }
    const minas = (v.todas[ui.boomDono] || []).map((m, k) => ({ ...m, k })).filter((m) => !m.explodiu)
    return `<div class="ap-juiz mn-boom-escolhe"><span class="lbl">${esc(nome(v, ui.boomDono))}, ${t('qual mina explodiu?', 'which mine blew up?')}</span>
      <div class="mn-boom-row">${minas.map((m) => `<button class="mn-boom" type="button" data-m="boom" data-v="${m.k}" data-dono="${ui.boomDono}"><b>BOOM!</b><small>${nm(v, m.n)}</small></button>`).join('')}</div>
      <button class="linkish" type="button" data-m="boom-fecha">${t('não era (cancelar)', 'never mind (cancel)')}</button></div>`
  }

  function evento(v) {
    const e = v.evento
    const perdeu = `${esc(nome(v, e.vitima))} ${e.dobro ? t('perde 2 vidas', 'loses 2 lives') : t('perde 1 vida', 'loses 1 life')}`
    if (e.tipo === 'boom') return `<div class="mn-evento boom"><span class="mn-estrela" aria-hidden="true"></span><b class="mn-bum">BOOM!</b><p class="mn-legenda">${t(`<b>${nm(v, e.mina)}</b> era mina de ${esc(nome(v, e.dono))}.<br>${perdeu}. ${esc(nome(v, e.dono))} ganha 1.`, `<b>${nm(v, e.mina)}</b> was ${esc(nome(v, e.dono))}’s mine.<br>${perdeu}. ${esc(nome(v, e.dono))} gains 1.`)}</p></div>`
    if (e.tipo === 'duvido') return `<div class="mn-evento ${e.vale ? 'vale' : 'boom'}">${e.vale ? '' : '<span class="mn-estrela" aria-hidden="true"></span>'}<b class="mn-bum">${e.vale ? t('VALE!', 'COUNTS!') : t('NÃO VALE!', 'DOESN’T COUNT!')}</b>
      <p class="mn-legenda">${esc(nome(v, e.quem))} ${t('duvidou de', 'challenged')} "${esc(e.texto)}"${e.vale ? ` (${t('era', 'it was')} ${nm(v, e.nome)})` : ''}.<br>${perdeu}.</p></div>`
    if (e.tipo === 'naovale') return `<div class="mn-evento boom"><span class="mn-estrela" aria-hidden="true"></span><b class="mn-bum">${t('NÃO VALE!', 'DOESN’T COUNT!')}</b><p class="mn-legenda">${esc(nome(v, e.vitima))} ${t('escreveu', 'typed')} "${esc(e.texto)}", ${t('que não é do tema', 'which is not in the theme')}.<br>${perdeu}.</p></div>`
    if (e.tipo === 'repetiu') return `<div class="mn-evento boom"><span class="mn-estrela" aria-hidden="true"></span><b class="mn-bum">${t('REPETIU!', 'REPEAT!')}</b><p class="mn-legenda">${nm(v, e.nome)} ${t('já tinha saído nesse duelo', 'was already said in this duel')}.<br>${perdeu}.</p></div>`
    return `<div class="mn-evento boom"><span class="mn-estrela" aria-hidden="true"></span><b class="mn-bum">${t('TRAVOU!', 'FROZE!')}</b><p class="mn-legenda">${esc(nome(v, e.vitima))} ${t('ficou 12 segundos sem falar', 'went 12 seconds without a name')}.<br>${perdeu}.</p></div>`
  }

  function campo(v) {
    return `<div class="mn-campo-revelado"><span class="lbl">${t('as minas que estavam no campo', 'the mines that were on the field')}</span><div class="mn-grade">${v.evento.minas.map((r) => r.minas.map((m) =>
      `<span class="mn-mina${m.explodiu ? ' foi' : ''}" style="${cor(r.j)}">${BOMBA}<b>${nm(v, m.n)}</b><small>${esc(nome(v, r.j))}</small></span>`).join('')).join('')}</div></div>`
  }

  function resultado(v, ui) {
    return `${evento(v)}${campo(v)}
      ${ui.podeSeguir ? `<button class="btn big" type="button" data-m="proxima">${t('Próximo duelo', 'Next duel')}</button>` : `<p class="hint">${t('O próximo duelo já vai começar…', 'The next duel is about to start…')}</p>`}`
  }

  // uma vez por jogo, quando alguém ia sair: Aquele Acima de Todos
  function toaa(v, ui) {
    const j = v.evento.toaa
    return `${evento(v)}
      <div class="mn-toaa" role="dialog" aria-label="${t('Aquele Acima de Todos', 'The One Above All')}"><div class="mn-krackle" aria-hidden="true"></div>
        <div class="mn-toaa-txt">
          <span class="lbl">${t('o multiverso parou', 'the multiverse stopped')}</span>
          <h2>${t('AQUELE ACIMA DE TODOS', 'THE ONE ABOVE ALL')}</h2>
          <p class="mn-fala">${t('"Ninguém fica de fora da minha história."', '"No one is left out of my story."')}</p>
          <p><b style="${cor(j)}">${esc(nome(v, j))}</b> ${t('volta com 1 vida.', 'comes back with 1 life.')}</p>
          <p class="mn-regra">${t('Mas a partir de agora, <b>cada erro tira 2 vidas</b>.', 'But from now on, <b>each mistake costs 2 lives</b>.')}</p>
          ${ui.podeSeguir ? `<button class="btn big" type="button" data-m="proxima">${t('Continuar', 'Continue')}</button>` : ''}
        </div></div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'plantar' ? plantar(v, ui) : v.fase === 'duelo' ? duelo(v, ui) : v.fase === 'toaa' ? toaa(v, ui) : resultado(v, ui)
    return `<section class="mn-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-m="sair">${t('sair', 'leave')}</button></div>
      ${tema(v)}
      ${meio}
      ${ui.estouro ? `<div class="mn-explode" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  function fim(v, ui) {
    const vivo = v.js.findIndex((p) => p.vidas > 0)
    const ordem = v.js.map((p, i) => i).sort((a, b) => (v.js[b].vidas > 0) - (v.js[a].vidas > 0) || v.js[b].boomsDados - v.js[a].boomsDados)
    return `<section class="ap-fimtela"><div class="panel ap-fim" style="${cor(vivo)}">
      <span class="lbl">${t('fim do campo minado', 'the minefield is clear')}</span><h2>${esc(nome(v, vivo))} ${t('sobreviveu!', 'survived!')}</h2>
      <ol class="ap-rank">${ordem.map((i) => { const p = v.js[i]; return `<li style="${cor(i)}"><span>${esc(p.nome)} <small>${p.boomsDados} BOOM${p.boomsDados === 1 ? '' : 's'} ${t('dado' + (p.boomsDados === 1 ? '' : 's'), 'dealt')}</small></span><b class="mn-coracoes">${coracoes(p.vidas, 1)}</b></li>` }).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-m="denovo">${t('Jogar de novo', 'Play again')}</button>` : ''}<button class="linkish" type="button" data-m="sair">${t('sair', 'leave')}</button></div>
    </div></section>`
  }

  window.MinasTelas = { entrada, sala, jogo, fim }
})()
