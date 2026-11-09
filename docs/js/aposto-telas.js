// Telas do Aposto Que Sei. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é aposto.js.
// Cada aparelho escreve na própria língua (Lingua): o tema e os nomes vêm em português e viram inglês aqui.
(function () {
  const V = window.View
  const esc = V.esc
  const t = (pt, en) => window.Lingua.t(pt, en)
  const en = () => window.Lingua.en()
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  const titulo = (v) => window.ApostoTemas.titulo(v.tema.id, v.tema.titulo)
  const nm = (v, n) => window.ApostoTemas.nome(v.tema.id, n)
  // raridade de cada nome (só conta se a opção Raridade estiver ligada)
  const RAR = { 1: [['comum', 'common'], '●'], 2: [['raro', 'rare'], '◆'], 3: [['lendário', 'legendary'], '★'] }
  const gema = (v) => `<i class="ap-gema r${v}" title="${t(...RAR[v][0])}">${RAR[v][1]} ${v}</i>`
  const DURACAO = (raridade) => (raridade ? [25, 40, 60] : [12, 20, 30])
  const unidade = (v, n) => (v.raridade ? (n === 1 ? t('ponto', 'point') : t('pontos', 'points')) : n === 1 ? t('nome', 'name') : t('nomes', 'names'))
  const ficha = (j, n, grande) => `<span class="ap-ficha${grande ? ' grande' : ''}" style="${cor(j)}"><b>${n}</b></span>`
  const GRITOS_EN = { TRUCO: 'TRUCO', SEIS: 'SIX', NOVE: 'NINE', DOZE: 'TWELVE', ACEITO: 'ACCEPTED', CORRO: 'FOLD' }
  const grito = (g) => (en() ? GRITOS_EN[g] || g : g)
  // tira acento pra agrupar por letra (Ômega fica no O)
  const inicial = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^A-Za-z0-9]+/, '').charAt(0).toUpperCase()
  const iniciais = (n) => { const a = new Set([inicial(n)]); const p = n.match(/\(([^)]+)\)/); if (p) a.add(inicial(p[1])); return a }

  function como(o) {
    return `<ol class="how">${t(`
      <li>Sai um tema: "Inimigos do Homem-Aranha".</li>
      <li>Na sua vez, aumente a aposta (${o.raridade ? '"faço 12 pontos!"' : '"falo 8!"'}) ou aperte <b>DUVIDO!</b> pra quem apostou mais provar.</li>
      <li>Quem apostou fala os nomes em voz alta, contra o relógio${o.raridade ? ', e quem duvidou marca cada um na lista (cada nome vale diferente)' : ' e toca +1 a cada nome'}. Quem duvidou escuta: desconfiou de um nome? Digita e o celular confere.</li>
      ${o.truco ? '<li>Antes da prova, quem vai provar pode pedir TRUCO (vale o dobro). O outro aceita, corre ou pede SEIS!</li>' : ''}
      ${o.raridade ? '<li>Nome comum vale 1, raro vale 2, lendário vale 3.</li>' : ''}
      <li>Nome que não vale? Errou. Provou: ganha a aposta. Errou: quem duvidou ganha.</li>`, `
      <li>A theme comes up: "Spider-Man villains".</li>
      <li>On your turn, raise the bet (${o.raridade ? '"I\'ll make 12 points!"' : '"I can name 8!"'}) or hit <b>PROVE IT!</b> so the top bidder has to prove it.</li>
      <li>The bidder says the names out loud, against the clock${o.raridade ? ', and the challenger checks each one off the list (each name is worth something different)' : ' and taps +1 for each name'}. The challenger listens: suspicious of a name? Type it and the phone checks.</li>
      ${o.truco ? '<li>Before proving, the prover can call TRUCO (worth double). The other accepts, folds or calls SIX!</li>' : ''}
      ${o.raridade ? '<li>A common name is worth 1, rare is worth 2, legendary is worth 3.</li>' : ''}
      <li>A name that doesn\'t count? Wrong. Proved it: you win the bet. Failed: the challenger wins.</li>`)}
    </ol>`
  }

  // as duas opções viram chaves de liga/desliga, cada uma com a sua cara
  function opcoes(o, pode) {
    const chave = (k, tit, texto, enfeite) => `<button class="ap-opcao ${k}" type="button" data-a="opt" data-v="${k}" aria-pressed="${!!o[k]}"${pode ? '' : ' disabled'}>
      <span class="ap-chave" aria-hidden="true"><i></i></span><b>${tit}</b><small>${texto}</small>${enfeite}</button>`
    const tamanho = [t('curta', 'short'), t('média', 'medium'), t('longa', 'long')]
    return `<div class="field"><span class="lbl">${t('Opções', 'Options')}</span><div class="ap-opcoes">
        ${chave('truco', 'Truco', t('Antes da prova: TRUCO vale o dobro. Aceita, corre ou pede SEIS!', 'Before the proof: TRUCO is worth double. Accept, fold or call SIX!'), '<span class="ap-selo">TRUCO!</span>')}
        ${chave('raridade', t('Raridade', 'Rarity'), t('Nome raro vale mais. A aposta vira pontos.', 'Rare names are worth more. The bet becomes points.'), `<span class="ap-gemas">${gema(1)}${gema(2)}${gema(3)}</span>`)}
      </div></div>
      <div class="field"><span class="lbl">${t('Ganha quem chegar a', 'First to reach')}</span><div class="presets">${DURACAO(o.raridade).map((x, i) =>
      `<button class="preset" type="button" data-a="meta" data-v="${x}" aria-pressed="${o.meta === x}"${pode ? '' : ' disabled'}>${x} ${t('pontos', 'points')} · ${tamanho[i]}</button>`).join('')}</div></div>`
  }

  // ---------- antes de jogar ----------
  function entrada(ui) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">${t('Jogador', 'Player')} ${p + 1}</span>
      <input id="ap-nome-${p}" maxlength="14" autocomplete="off" placeholder="${t('Jogador', 'Player')} ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup ap">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${t('Num celular só', 'On one phone')}</h2>
          <div class="field"><span class="lbl">${t('Jogadores', 'Players')}</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-a="n" data-v="-1" aria-label="${t('Um a menos', 'One fewer')}"${ui.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-a="n" data-v="1" aria-label="${t('Um a mais', 'One more')}"${ui.n >= 7 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${opcoes(ui, true)}
          <div class="go-row"><button class="linkish" type="button" data-a="bots">${t('testar sozinho contra 3 bots', 'try it alone against 3 bots')}</button>
            <button class="btn big" type="button" data-a="local">${t('Começar', 'Start')}</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>${t('Como jogar', 'How to play')}</h2>${como(ui)}</div>
          <div class="panel"><h2>${t('Cada um no seu celular', 'Each on their own phone')}</h2>
            <button class="btn green fila-btn" type="button" data-fila="aposto">${t('Procurar partida', 'Find a match')}</button>
            <label class="imp-meu-nome"><span class="lbl">${t('Seu nome', 'Your name')}</span><input id="ap-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-a="criar">${t('Criar sala', 'Create room')}</button>
              <input id="ap-codigo" maxlength="4" autocomplete="off" placeholder="${t('CÓDIGO', 'CODE')}" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-a="entrar">${t('Entrar', 'Join')}</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup ap">
      <div class="imp-topo"><span class="hint">${t('Sala', 'Room')} ${esc(v.code)} · ${n} ${t('na mesa', 'at the table')}</span><button class="linkish" type="button" data-a="sair">${v.dono ? t('Fechar sala', 'Close room') : t('Sair da sala', 'Leave room')}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? t('Regras', 'Rules') : t('Regras da sala', 'Room rules')}</h2>${opcoes(v, v.dono)}${como(v)}</div>
        <div class="panel"><h2>${t('Sala', 'Room')} ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-a="convite">${t('Copiar convite', 'Copy invite')}</button>
            <button class="btn paper" type="button" data-a="poe-bot"${v.pessoas.length >= 7 ? ' disabled' : ''}>+ bot</button></div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? t('você', 'you') : '', p.dono ? t('criou', 'host') : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-a="tira-bot" data-v="${i}">${t('tirar', 'remove')}</button>` : ''}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 2 ? `<span class="lbl">${t('Falta gente (ou um bot)', 'Need more people (or a bot)')}</span>` : ''}<button class="btn big" type="button" data-a="comecar"${n < 2 ? ' disabled' : ''}>${t('Começar', 'Start')}</button>`
        : `<p class="hint">${t('Esperando quem criou a sala começar…', 'Waiting for the host to start…')}</p>`}</div>
    </section>`
  }

  // ---------- jogo ----------
  function placar(v) {
    const ativo = v.fase === 'lances' ? v.vez : v.fase === 'truco' ? v.truco.quem : v.fase === 'prova' ? v.prova.j : -1
    return `<div class="ap-placar">${v.js.map((p, i) => `<span class="${i === ativo ? 'vez' : ''}${p.on === false ? ' fora' : ''}" style="${cor(i)}">${esc(p.nome)} <b>${p.pts}</b></span>`).join('')}
      <small>${t('até', 'to')} ${v.meta}</small></div>`
  }
  const relogio = () => '<span class="ap-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>'
  const vezDe = (v, j) => t(`vez de ${esc(nome(v, j))}`, `${esc(nome(v, j))}'s turn`)

  function lances(v, ui) {
    const L = v.lance
    const hist = v.hist.map((h) => `<span style="${cor(h.j)}">${h.prova ? `<b class="ap-hist-prova">${t('DUVIDO!', 'PROVE IT!')}</b>` : ficha(h.j, h.n)}<small>${esc(nome(v, h.j))}</small></span>`).join('<i>›</i>')
    const minimo = L ? L.n + 1 : 1
    const valor = Math.max(minimo, ui.valor || minimo)
    const acao = ui.souVez
      ? `<div class="ap-acao">
          <div class="ap-aposta"><button class="btn paper step" type="button" data-a="valor" data-v="-1"${valor <= minimo ? ' disabled' : ''} aria-label="${t('Menos', 'Less')}">−</button>
            <button class="btn big" type="button" data-a="apostar" data-v="${valor}">${t('Aposto', 'I bet')} ${valor}</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="1" aria-label="${t('Mais', 'More')}">+</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="5" aria-label="${t('Mais cinco', 'Five more')}">+5</button></div>
          ${L ? `<button class="btn big red ap-prova-btn" type="button" data-a="prova">${t(`DUVIDO, ${esc(nome(v, L.de))}!`, `PROVE IT, ${esc(nome(v, L.de))}!`)}</button>` : ''}
        </div>`
      : `<p class="hint">${vezDe(v, v.vez)}…</p>`
    return `<div class="ap-mesa">
      <div class="ap-feltro">${L ? `${ficha(L.de, L.n, true)}<div><small>${t(`${esc(nome(v, L.de))} aposta que faz`, `${esc(nome(v, L.de))} bets they can make`)}</small><b>${L.n} ${unidade(v, L.n)}</b></div>`
        : `<span class="ap-ficha grande vazia"><b>?</b></span><div><small>${t('ninguém apostou ainda', 'no bets yet')}</small><b>${t('quem abre?', 'who opens?')}</b></div>`}</div>
      <div class="ap-vez" style="${cor(v.vez)}"><span class="lbl">${!ui.local && ui.souVez ? t('sua vez', 'your turn') : vezDe(v, v.vez)}</span>${relogio()}</div>
      ${acao}
      ${hist ? `<div class="ap-hist">${hist}</div>` : ''}
    </div>`
  }

  function truco(v, ui) {
    const T = v.truco
    const P = v.prova
    const vale = (nivel) => P.n * v.MULT[nivel]
    const gritos = T.gritos.map((g) => `<span style="${cor(g.j)}">${esc(nome(v, g.j))}: <b>${grito(g.grito)}!</b></span>`).join('')
    const prox = (T.proposta || T.nivel) + 1
    const decide = esc(nome(v, T.quem))
    const aumentar = prox < v.MULT.length ? `<button class="btn big red ap-grito" type="button" data-a="truco" data-v="aumentar">${grito(v.GRITO[prox])}!</button>` : ''
    let botoes = `<p class="hint">${t(`${decide} está decidindo…`, `${decide} is deciding…`)}</p>`
    if (ui.souTruco) {
      const quemPediu = esc(nome(v, T.gritos[T.gritos.length - 1] ? T.gritos[T.gritos.length - 1].j : T.quem))
      botoes = !T.proposta
        ? `<button class="btn big" type="button" data-a="truco" data-v="provar">${t('Provar valendo', 'Prove it for')} ${vale(T.nivel)}</button>${aumentar}`
        : `<button class="btn big green" type="button" data-a="truco" data-v="aceito">${t(`Aceito (vale ${vale(T.proposta)})`, `Accept (worth ${vale(T.proposta)})`)}</button>
           <button class="btn paper" type="button" data-a="truco" data-v="corro">${t(`Corro (dá ${vale(T.nivel)} pro ${quemPediu})`, `Fold (gives ${vale(T.nivel)} to ${quemPediu})`)}</button>${aumentar}`
    }
    const vai = esc(nome(v, P.j))
    return `<div class="ap-mesa ap-truco">
      <div class="ap-feltro">${ficha(P.j, vale(T.proposta || T.nivel), true)}<div><small>${t(`${vai} vai provar`, `${vai} will prove`)} ${P.n} ${unidade(v, P.n)}</small><b>${t('valendo', 'worth')} ${vale(T.proposta || T.nivel)}${T.proposta ? t(' se aceitar', ' if accepted') : ''}</b></div></div>
      ${gritos ? `<div class="ap-gritos">${gritos}</div>` : ''}
      <div class="ap-vez" style="${cor(T.quem)}"><span class="lbl">${!ui.local && ui.souTruco ? t('você decide', 'you decide') : t(`${decide} decide`, `${decide} decides`)}</span>${relogio()}</div>
      <div class="ap-acao">${botoes}</div>
    </div>`
  }

  // os nomes já falados (sem Raridade, cada toque de +1 vira uma ficha sem nome)
  function falas(v) {
    const P = v.prova
    return P.falas.map((f) => (!f.v ? `<span class="erro">${esc(f.n)} ✗</span>` : f.n
      ? `<span class="ok${v.raridade ? ' r' + f.v : ''}">${esc(nm(v, f.n))} <b>+${f.v}</b></span>` : '<span class="ok conta"><b>+1</b></span>')).join('') || `<small>${t('nenhum nome ainda', 'no names yet')}</small>`
  }

  function prova(v, ui) {
    const P = v.prova
    const pct = Math.min(100, (100 * P.soma) / P.n)
    const passa = !P.comecou && ui.local && !v.js[P.j].bot
    const D = P.ultimaDuvida
    const quem = esc(nome(v, P.j))
    const juizN = esc(nome(v, v.juizLocal))
    const tema = esc(titulo(v))
    const cab = `<div class="ap-provando" style="${cor(P.j)}">
      <span class="lbl">${t(`${esc(nome(v, P.chamou))} duvidou`, `${esc(nome(v, P.chamou))} called it`)}${P.mult > 1 ? ` · ${t('valendo', 'worth')} ${P.n * P.mult}` : ''}</span>
      <b>${t(`${quem} tem que fazer`, `${quem} has to make`)} ${P.n} ${unidade(v, P.n)}</b>
      <span class="ap-soma"><b>${P.soma}</b>/${P.n}</span>
      <span class="ap-tema-mini">${tema}</span>
      <span class="ap-barra" aria-hidden="true"><i style="width:${pct}%"></i></span>
      ${P.comecou ? relogio() : `<span class="ap-prepara">${t('prepara…', 'get ready…')}</span>`}
    </div>`
    const rodando = P.comecou && !v.js[P.j].bot
    // sem Raridade: quem prova toca +1 a cada nome; com Raridade, quem duvidou marca na lista
    const conta = rodando && !v.raridade && ui.souProva && v.pausa < 0
      ? `<div class="ap-conta"><button class="btn big ap-mais" type="button" data-a="contar">+1 <small>${t('falei um nome', 'I said a name')}</small></button>
          <button class="btn paper" type="button" data-a="descontar"${P.falas.length && P.falas[P.falas.length - 1].n === '' ? '' : ' disabled'}>${t('desfazer', 'undo')}</button></div>` : ''
    const fala = rodando && ui.souProva && !ui.local && v.raridade ? `<p class="ap-fala">${t('FALA! Diga os nomes em voz alta.', 'TALK! Say the names out loud.')}</p>` : ''
    // em vez de falar, quem prova pode escrever: o celular confere sozinho
    const escreve = rodando && ui.souProva && v.pausa < 0 ? `<div class="ap-escreve"><label class="ap-digita"><span class="lbl">${ui.local ? quem + ': ' : ''}${t('ou escreva o nome (o celular confere)', 'or type the name (the phone checks)')}</span>
      <span class="ap-escreve-linha"><input id="ap-escreve" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="send">
      <button class="btn green" type="button" data-a="escrever">${t('Enviar', 'Send')}</button></span></label><small id="ap-recado" class="ap-recado" role="status"></small></div>` : ''
    const juiz = rodando && v.raridade && ui.souJuiz ? lista(v, ui) : ''
    const duvida = rodando && !v.raridade && ui.souDuvida ? `<div class="ap-juiz ap-duvido">${caixaDuvida(v, ui)}</div>` : ''
    const digita = esc(nome(v, v.pausa))
    const pausa = v.pausa >= 0 && P.comecou ? `<p class="ap-pausa" role="status">${t(`relógio parado: ${digita} está digitando um nome pra conferir…`, `clock stopped: ${digita} is typing a name to check…`)}</p>` : ''
    const res = D && `${t(`${esc(nome(v, D.quem))} duvidou de`, `${esc(nome(v, D.quem))} challenged`)} "${esc(D.texto)}": <b>${D.vale ? `✓ ${t('vale', 'counts')} (${esc(nm(v, D.nome))})` : `✗ ${t('não vale', 'doesn\'t count')}`}</b>`
    return `${cab}${fala}${pausa}
      ${D ? `<p class="ap-duvida-res ${D.vale ? 'ok' : 'erro'}">${res}</p>` : ''}
      <div class="ap-falas" id="ap-falas">${falas(v)}</div>
      ${conta}${escreve}${juiz}${duvida}
      ${passa ? `<div class="ap-passa" role="dialog"><div><span class="lbl">${t('prova', 'proof')}</span><h3>${t(`${quem} fala, ${juizN} escuta`, `${quem} talks, ${juizN} listens`)}</h3>
        <p>${v.raridade
          ? t(`O celular fica com ${juizN}. ${quem} fala nomes de <b>${tema}</b> em voz alta e ${juizN} marca cada um na lista (cada nome vale diferente).`,
            `The phone goes to ${juizN}. ${quem} says names from <b>${tema}</b> out loud and ${juizN} checks each one off the list (each name is worth something different).`)
          : t(`Deixem o celular no meio. ${quem} fala nomes de <b>${tema}</b> e toca <b>+1</b> a cada um. ${juizN} escuta: se duvidar de um nome, toca DUVIDO e digita pra conferir.`,
            `Put the phone in the middle. ${quem} says names from <b>${tema}</b> and taps <b>+1</b> for each one. ${juizN} listens: doubt a name? Tap CHALLENGE and type it to check.`)}</p>
        <button class="btn big" type="button" data-a="comecar-prova">${t('Começar', 'Start')}</button></div></div>` : ''}`
  }

  // o "duvido" de quem escuta: digita o nome suspeito e o celular confere na lista do tema
  function caixaDuvida(v, ui) {
    if (!ui.digitando) return `<button class="btn red ap-duvido-btn" type="button" data-a="abrir-duvida">${t('DUVIDO DE UM NOME', 'CHALLENGE A NAME')}</button>`
    return `<label class="ap-digita"><span class="lbl">${t('digite o nome que você acha que não vale', 'type the name you think doesn\'t count')}</span>
        <input id="ap-duvida-txt" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.duvida || '')}"></label>
      <div class="ap-juiz-btns"><button class="btn paper" type="button" data-a="fechar-duvida">${t('cancelar', 'cancel')}</button>
        <button class="btn red" type="button" data-a="duvidar">${t('Conferir', 'Check')}</button></div>`
  }

  // a lista oficial, só pra quem escuta (com Raridade): letras em cima, nomes embaixo, e o duvido digitado
  function lista(v, ui) {
    const P = v.prova
    const itens = v.itens.map((it, i) => ({ ...it, i, mostra: (en() && it.en) || it.n })).sort((a, b) => a.mostra.localeCompare(b.mostra, en() ? 'en' : 'pt'))
    const letras = [...new Set(itens.flatMap((it) => [...iniciais(it.mostra)]))].sort()
    const L = ui.letra && letras.includes(ui.letra) ? ui.letra : ''
    const nomes = itens.filter((it) => !L || iniciais(it.mostra).has(L))
    return `<div class="ap-juiz">
      <span class="lbl">${v.autoJuiz ? t('testando contra bots: você mesmo marca (sem roubar!)', 'testing against bots: you check them yourself (no cheating!)') : t('toque no nome que ele falar', 'tap each name they say')}</span>
      <div class="ap-letras"><button type="button" data-a="letra" data-v="" aria-pressed="${!L}">${t('todas', 'all')}</button>${letras.map((l) => `<button type="button" data-a="letra" data-v="${l}" aria-pressed="${L === l}">${l}</button>`).join('')}</div>
      <div class="ap-nomes" id="ap-nomes">${nomes.map((it) => { const m = P.marcados.includes(it.i); return `<button class="ap-nome${m ? ' ok' : ''}${v.raridade ? ' r' + it.v : ''}" type="button" data-a="marcar" data-v="${it.i}"${m ? ' disabled' : ''}>${esc(it.mostra)}${v.raridade ? gema(it.v) : ''}</button>` }).join('')}</div>
      <div class="ap-juiz-btns"><button class="btn paper" type="button" data-a="desmarcar"${P.marcados.length ? '' : ' disabled'}>${t('Desfazer', 'Undo')}</button>
        ${ui.digitando ? '' : `<button class="btn red" type="button" data-a="abrir-duvida">${t('Não achei: digitar', 'Not there: type it')}</button>`}</div>
      ${ui.digitando ? caixaDuvida(v, ui) : ''}
    </div>`
  }

  function resultado(v, ui) {
    const R = v.resultado
    const txt = R.motivo === 'correu' ? t('CORREU!', 'FOLDED!') : R.ok ? t('PROVOU!', 'PROVED IT!') : R.motivo === 'tempo' ? t('ACABOU O TEMPO!', 'TIME\'S UP!') : R.motivo === 'duvido' ? t('NÃO VALE!', 'DOESN\'T COUNT!') : t('ERROU!', 'WRONG!')
    const quem = esc(nome(v, R.j))
    const como = R.motivo === 'correu' ? t(`${esc(nome(v, R.correu))} correu do truco.`, `${esc(nome(v, R.correu))} folded on the truco.`) : t(`${quem} fez ${R.soma} de ${R.n}.`, `${quem} made ${R.soma} of ${R.n}.`)
    return `<div class="ap-resultado ${R.ok ? 'ok' : 'erro'}">
      <b class="ap-carimbo${txt.length > 8 ? ' longo' : ''}">${txt}</b>
      <p>${como} <b style="${cor(R.ganhou)}">+${R.pts} ${t('pro', 'to')} ${esc(nome(v, R.ganhou))}</b></p>
      ${R.faltou.length ? `<div class="ap-faltou"><span class="lbl">${t('dava pra ter falado', 'you could have said')}</span><div>${R.faltou.map((f) => `<span class="${v.raridade ? 'r' + f.v : ''}">${esc(nm(v, f.n))}${v.raridade ? gema(f.v) : ''}</span>`).join('')}</div></div>` : ''}
      ${ui.podeSeguir ? `<button class="btn big" type="button" data-a="proxima">${v.fimLogo ? t('Ver o placar final', 'See the final score') : t('Próxima rodada', 'Next round')}</button>` : `<p class="hint">${t('A próxima rodada já vai começar…', 'The next round is about to start…')}</p>`}
    </div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'lances' ? lances(v, ui) : v.fase === 'truco' ? truco(v, ui) : v.fase === 'prova' ? prova(v, ui) : resultado(v, ui)
    const selos = (v.comTruco ? '<span class="ap-selo">truco</span>' : '') + (v.raridade ? `<span class="ap-gemas">${gema(1)}${gema(2)}${gema(3)}</span>` : `<span class="ap-selo claro">${t('cada nome vale 1', 'each name is worth 1')}</span>`)
    return `<section class="ap-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-a="sair">${t('sair', 'leave')}</button></div>
      ${v.fase === 'prova' ? '' : `<div class="ap-tema${v.fase === 'lances' && !v.hist.length ? ' novo' : ''}"><span class="ap-rodada">${t('rodada', 'round')} ${v.rodada}</span><h2>${esc(titulo(v))}</h2><div class="ap-selos">${selos}</div></div>`}
      ${meio}
      ${ui.estouro ? `<div class="ap-estouro" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  function fim(v, ui) {
    const ordem = v.js.map((p, i) => i).sort((a, b) => v.js[b].pts - v.js[a].pts)
    const w = ordem[0]
    const lugar = (k) => (en() ? ['1st', '2nd', '3rd'][k] : `${k + 1}º`)
    return `<section class="ap-fimtela"><div class="panel ap-fim" style="${cor(w)}">
      <span class="lbl">${t('fim de jogo', 'game over')}</span><h2>${t(`${esc(v.js[w].nome)} sabe mais!`, `${esc(v.js[w].nome)} knows the most!`)}</h2>
      <ol class="ap-rank">${ordem.map((i, k) => { const p = v.js[i]; return `<li style="${cor(i)}">${k < 3 ? `<em class="ap-medalha m${k}">${lugar(k)}</em>` : ''}<span>${esc(p.nome)} <small>${p.provas ? t(`provou ${p.acertou} de ${p.provas}`, `proved ${p.acertou} of ${p.provas}`) : t('nunca provou', 'never proved')}</small></span><b>${p.pts}</b></li>` }).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? `<button class="btn big" type="button" data-a="denovo">${t('Jogar de novo', 'Play again')}</button>` : ''}<button class="linkish" type="button" data-a="sair">${t('sair', 'leave')}</button></div>
    </div></section>`
  }

  window.ApostoTelas = { entrada, sala, jogo, fim, falas, grito, DURACAO }
})()
