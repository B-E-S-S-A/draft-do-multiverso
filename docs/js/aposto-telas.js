// Telas do Aposto Que Sei. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é aposto.js.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const esc = V.esc
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')

  const COMO = `<ol class="how">
    <li>Sai um tema: "Inimigos do Homem-Aranha". Tem alguns certos escondidos numa grade de 16 capas.</li>
    <li>Na sua vez, aumente a aposta ("eu acho 4!") ou aperte <b>PROVA!</b> pra quem apostou mais.</li>
    <li>Quem apostou mais toca nos certos antes do tempo acabar. Um erro e acabou.</li>
    <li>Provou? Ganha os pontos da aposta. Errou? Quem mandou provar ganha. Blefar vale!</li>
  </ol>`

  // ---------- antes de jogar ----------
  function entrada(ui) {
    const nomes = Array.from({ length: ui.n }, (_, p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">Jogador ${p + 1}</span>
      <input id="ap-nome-${p}" maxlength="14" autocomplete="off" placeholder="Jogador ${p + 1}" value="${esc(ui.nomes[p] || '')}"></label>`).join('')
    return `<section class="setup ap">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Num celular só</h2>
          <div class="field"><span class="lbl">Jogadores</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-a="n" data-v="-1" aria-label="Um a menos"${ui.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.n}</b>
              <button class="btn paper step" type="button" data-a="n" data-v="1" aria-label="Um a mais"${ui.n >= 7 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          ${metas(ui.meta, true)}
          <div class="go-row"><button class="linkish" type="button" data-a="bots">testar sozinho contra 3 bots</button>
            <button class="btn big" type="button" data-a="local">Começar</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>Como jogar</h2>${COMO}</div>
          <div class="panel"><h2>Cada um no seu celular</h2>
            <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="ap-meu" maxlength="14" autocomplete="off" value="${esc(ui.meuNome)}"></label>
            <div class="online-row"><button class="btn green" type="button" data-a="criar">Criar sala</button>
              <input id="ap-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" value="${esc(ui.codigo)}">
              <button class="btn paper" type="button" data-a="entrar">Entrar</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
        </div>
      </div>
    </section>`
  }

  function metas(meta, pode) {
    return `<div class="field"><span class="lbl">Ganha quem chegar a</span><div class="presets">${[10, 15, 25].map((x) =>
      `<button class="preset" type="button" data-a="meta" data-v="${x}" aria-pressed="${meta === x}"${pode ? '' : ' disabled'}>${x} pontos</button>`).join('')}</div></div>`
  }

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup ap">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)} · ${n} na mesa</span><button class="linkish" type="button" data-a="sair">${v.dono ? 'Fechar sala' : 'Sair da sala'}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>${metas(v.meta, v.dono)}${COMO}</div>
        <div class="panel"><h2>Sala ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b><div class="online-row"><button class="btn paper" type="button" data-a="convite">Copiar convite</button>
            <button class="btn paper" type="button" data-a="poe-bot"${v.pessoas.length >= 7 ? ' disabled' : ''}>+ bot</button></div><p class="note" role="status">${esc(ui.msg)}</p>` : ''}
          <ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
            <small>${[p.voce ? 'você' : '', p.dono ? 'criou' : '', p.bot ? 'bot' : ''].filter(Boolean).join(' · ')}</small>
            ${v.dono && p.bot ? `<button class="linkish" type="button" data-a="tira-bot" data-v="${i}">tirar</button>` : ''}</li>`).join('')}</ol>
        </div>
      </div>
      <div class="go-row">${v.dono ? `${n < 2 ? '<span class="lbl">Falta gente (ou um bot)</span>' : ''}<button class="btn big" type="button" data-a="comecar"${n < 2 ? ' disabled' : ''}>Começar</button>`
        : '<p class="hint">Esperando quem criou a sala começar…</p>'}</div>
    </section>`
  }

  // ---------- jogo ----------
  function placar(v) {
    const ativo = v.fase === 'lances' ? v.vez : v.fase === 'prova' ? v.prova.j : -1
    return `<div class="ap-placar">${v.js.map((p, i) => `<span class="${i === ativo ? 'vez' : ''}${p.on === false ? ' fora' : ''}" style="${cor(i)}">${esc(p.nome)} <b>${p.pts}</b></span>`).join('')}
      <small>até ${v.meta}</small></div>`
  }

  function tile(v, pos) {
    const i = v.tema.grade[pos]
    const lot = E.lotOf('hq:' + i)
    const t = v.prova && v.prova.tocados.find((x) => x.pos === pos)
    const fim = v.fase === 'resultado' || v.fase === 'fim'
    const certo = fim && v.certos && v.certos.includes(i)
    const cls = ['ap-tile', t ? (t.ok ? 'ok' : 'erro') : '', !t && certo ? 'tinha' : '', fim && !t && !certo ? 'apaga' : ''].filter(Boolean).join(' ')
    return `<button class="${cls}" type="button" data-a="tocar" data-v="${pos}" style="--k:${pos}">
      <span class="ap-face ap-verso"><b>?</b></span>
      <span class="ap-face ap-frente">${V.cover(lot)}<small>${esc(lot.n)}</small>${t ? `<i>${t.ok ? '✓' : '✗'}</i>` : certo ? '<i>tinha</i>' : ''}</span></button>`
  }

  function grade(v, ui) {
    // as capas só desviram quando o relógio da prova começa (ninguém estuda a grade de graça)
    const aberta = v.fase === 'resultado' || v.fase === 'fim' || (v.fase === 'prova' && v.prova.comecou)
    const posso = v.fase === 'prova' && v.prova.comecou && ui.souProva
    return `<div class="ap-grade${aberta ? ' aberta' : ''}${posso ? ' viva' : ''}">${v.tema.grade.map((_, pos) => tile(v, pos)).join('')}</div>`
  }

  function relogio() { return '<span class="ap-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>' }

  function lances(v, ui) {
    const L = v.lance
    const hist = v.hist.map((h) => `<span style="${cor(h.j)}">${esc(nome(v, h.j))} <b>${h.prova ? 'PROVA!' : h.n}</b></span>`).join('<i>→</i>')
    const minimo = L ? L.n + 1 : 1
    const valor = Math.min(v.tema.k, Math.max(minimo, ui.valor || minimo))
    const podeAumentar = minimo <= v.tema.k
    const minhaVez = ui.souVez
    const acao = minhaVez
      ? `<div class="ap-acao">
          ${podeAumentar ? `<div class="ap-aposta"><button class="btn paper step" type="button" data-a="valor" data-v="-1"${valor <= minimo ? ' disabled' : ''} aria-label="Menos">−</button>
            <button class="btn big" type="button" data-a="apostar" data-v="${valor}">Aposto que acho ${valor}</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="1"${valor >= v.tema.k ? ' disabled' : ''} aria-label="Mais">+</button></div>` : '<p class="note">Ninguém pode apostar mais que isso. Só resta mandar provar!</p>'}
          ${L ? `<button class="btn big red ap-prova-btn" type="button" data-a="prova">PROVA, ${esc(nome(v, L.de))}!</button>` : ''}
        </div>`
      : `<p class="hint">Vez de ${esc(nome(v, v.vez))}…</p>`
    return `<div class="ap-mesa">
      <div class="ap-lance">${L ? `<small>${esc(nome(v, L.de))} aposta que acha</small><b>${L.n}</b>` : '<small>ninguém apostou ainda</small><b>–</b>'}<span>de ${v.tema.k}</span></div>
      <div class="ap-vez" style="${cor(v.vez)}"><span class="lbl">${v.modo === 'local' ? `vez de ${esc(nome(v, v.vez))}` : minhaVez ? 'sua vez' : 'vez de ' + esc(nome(v, v.vez))}</span>${relogio()}</div>
      ${acao}
      ${hist ? `<div class="ap-hist">${hist}</div>` : ''}
    </div>`
  }

  function prova(v, ui) {
    const P = v.prova
    const pips = Array.from({ length: P.n }, (_, k) => `<i class="${k < P.acertos ? 'on' : ''}"></i>`).join('')
    const passa = !P.comecou && v.modo === 'local' && !v.js[P.j].bot
    return `<div class="ap-provando" style="${cor(P.j)}">
      <span class="lbl">${esc(nome(v, P.chamou))} mandou provar</span>
      <b>${esc(nome(v, P.j))} tem que achar ${P.n}</b>
      <span class="ap-pips">${pips}</span>
      <span class="ap-tema-mini">${esc(v.tema.titulo)}</span>${P.comecou ? relogio() : '<span class="ap-prepara">prepara… as capas já vão virar</span>'}
    </div>
    ${passa ? `<div class="ap-passa" role="dialog"><div><span class="lbl">passa o celular</span><h3>${esc(nome(v, P.j))}, é com você</h3>
      <p>Ache ${P.n} certo${P.n > 1 ? 's' : ''}: <b>${esc(v.tema.titulo)}</b>. Um erro e acabou.</p>
      <button class="btn big" type="button" data-a="comecar-prova">Começar</button></div></div>` : ''}`
  }

  function resultado(v, ui) {
    const R = v.resultado
    const txt = R.ok ? 'PROVOU!' : R.motivo === 'tempo' ? 'ACABOU O TEMPO!' : 'ERROU!'
    const quem = nome(v, R.ganhou)
    return `<div class="ap-resultado ${R.ok ? 'ok' : 'erro'}">
      <b class="ap-carimbo">${txt}</b>
      <p>${R.ok ? `${esc(nome(v, R.j))} achou os ${R.n}.` : `${esc(nome(v, R.j))} achou ${R.acertos} de ${R.n}.`} <b style="${cor(R.ganhou)}">+${R.n} pro ${esc(quem)}</b></p>
      ${ui.podeSeguir ? `<button class="btn big" type="button" data-a="proxima">${v.fimLogo ? 'Ver o placar final' : 'Próxima rodada'}</button>` : '<p class="hint">A próxima rodada já vai começar…</p>'}
    </div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'lances' ? lances(v, ui) : v.fase === 'prova' ? prova(v, ui) : resultado(v, ui)
    return `<section class="ap-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-a="sair">sair</button></div>
      ${v.fase === 'prova' ? '' : `<div class="ap-tema"><span class="lbl">tema da rodada ${v.rodada}</span><h2>${esc(v.tema.titulo)}</h2><small>tem <b>${v.tema.k}</b> certos escondidos nas 16 capas</small></div>`}
      ${v.fase === 'resultado' ? grade(v, ui) + meio : meio + grade(v, ui)}
      ${ui.estouro ? `<div class="ap-estouro" aria-hidden="true"><b>PROVA!</b></div>` : ''}
    </section>`
  }

  function fim(v, ui) {
    const ordem = v.js.map((p, i) => i).sort((a, b) => v.js[b].pts - v.js[a].pts)
    const w = ordem[0]
    return `<section class="ap-fimtela"><div class="panel ap-fim" style="${cor(w)}">
      <span class="lbl">fim de jogo</span><h2>${esc(v.js[w].nome)} sabe mais!</h2>
      <ol class="ap-rank">${ordem.map((i) => { const p = v.js[i]; return `<li style="${cor(i)}"><span>${esc(p.nome)} <small>${p.provas ? `provou ${p.acertou} de ${p.provas}` : 'nunca provou'}</small></span><b>${p.pts}</b></li>` }).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? '<button class="btn big" type="button" data-a="denovo">Jogar de novo</button>' : ''}<button class="linkish" type="button" data-a="sair">sair</button></div>
    </div></section>`
  }

  window.ApostoTelas = { entrada, sala, jogo, fim }
})()
