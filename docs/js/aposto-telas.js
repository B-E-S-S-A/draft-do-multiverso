// Telas do Aposto Que Sei. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é aposto.js.
(function () {
  const V = window.View
  const esc = V.esc
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  const MODOS = {
    raridade: ['Raridade', 'Cada nome vale 1, 2 ou 3 pontos: os raros valem mais. A aposta é em pontos.'],
    classico: ['Clássico', 'Cada nome vale 1. Antes da prova dá pra pedir TRUCO, SEIS, NOVE e DOZE.'],
  }
  const DURACAO = { raridade: [25, 40, 60], classico: [12, 20, 30] }
  const unidade = (v, n) => (v.modo === 'raridade' ? (n === 1 ? 'ponto' : 'pontos') : n === 1 ? 'nome' : 'nomes')
  // tira acento pra agrupar por letra (Ômega fica no O)
  const inicial = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^A-Za-z0-9]+/, '').charAt(0).toUpperCase()
  const iniciais = (n) => { const a = new Set([inicial(n)]); const p = n.match(/\(([^)]+)\)/); if (p) a.add(inicial(p[1])); return a }

  function como(modo) {
    return `<ol class="how">
      <li>Sai um tema: "Inimigos do Homem-Aranha".</li>
      <li>Na sua vez, aumente a aposta (${modo === 'raridade' ? '"faço 12 pontos!"' : '"falo 8!"'}) ou aperte <b>PROVA!</b> pra quem apostou mais.</li>
      <li>Quem apostou fala os nomes em voz alta, contra o relógio. Quem mandou provar é o juiz: marca cada nome na lista oficial do celular.</li>
      <li>${modo === 'raridade' ? 'Nome fácil vale 1, médio vale 2, raro vale 3.' : 'Antes da prova, quem vai provar pode pedir TRUCO (vale o dobro). Aceita, corre ou pede SEIS!'}</li>
      <li>Falou um nome que não está na lista? Errou. Provou: ganha a aposta. Errou: o juiz ganha.</li>
    </ol>`
  }

  function opcoes(modo, meta, pode) {
    return `<div class="field"><span class="lbl">Modo</span><div class="modes ap-modos">${Object.entries(MODOS).map(([k, [t, d]]) =>
      `<button class="mode" type="button" data-a="modo" data-v="${k}" aria-pressed="${modo === k}"${pode ? '' : ' disabled'}><b>${t}</b><small>${d}</small></button>`).join('')}</div></div>
      <div class="field"><span class="lbl">Ganha quem chegar a</span><div class="presets">${DURACAO[modo].map((x, i) =>
      `<button class="preset" type="button" data-a="meta" data-v="${x}" aria-pressed="${meta === x}"${pode ? '' : ' disabled'}>${x} pontos · ${['curta', 'média', 'longa'][i]}</button>`).join('')}</div></div>`
  }

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
          ${opcoes(ui.modo, ui.meta, true)}
          <div class="go-row"><button class="linkish" type="button" data-a="bots">testar sozinho contra 3 bots</button>
            <button class="btn big" type="button" data-a="local">Começar</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>Como jogar</h2>${como(ui.modo)}</div>
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

  function sala(v, ui) {
    const n = v.pessoas.filter((p) => p.on).length
    return `<section class="setup ap">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)} · ${n} na mesa</span><button class="linkish" type="button" data-a="sair">${v.dono ? 'Fechar sala' : 'Sair da sala'}</button></div>
      <div class="setup-grid">
        <div class="panel rules"><h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>${opcoes(v.modo, v.meta, v.dono)}${como(v.modo)}</div>
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
    const ativo = v.fase === 'lances' ? v.vez : v.fase === 'truco' ? v.truco.quem : v.fase === 'prova' ? v.prova.j : -1
    return `<div class="ap-placar">${v.js.map((p, i) => `<span class="${i === ativo ? 'vez' : ''}${p.on === false ? ' fora' : ''}" style="${cor(i)}">${esc(p.nome)} <b>${p.pts}</b></span>`).join('')}
      <small>até ${v.meta}</small></div>`
  }
  const relogio = () => '<span class="ap-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>'

  function lances(v, ui) {
    const L = v.lance
    const hist = v.hist.map((h) => `<span style="${cor(h.j)}">${esc(nome(v, h.j))} <b>${h.prova ? 'PROVA!' : h.n}</b></span>`).join('<i>→</i>')
    const minimo = L ? L.n + 1 : 1
    const valor = Math.max(minimo, ui.valor || minimo)
    const acao = ui.souVez
      ? `<div class="ap-acao">
          <div class="ap-aposta"><button class="btn paper step" type="button" data-a="valor" data-v="-1"${valor <= minimo ? ' disabled' : ''} aria-label="Menos">−</button>
            <button class="btn big" type="button" data-a="apostar" data-v="${valor}">Aposto ${valor}</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="1" aria-label="Mais">+</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="5" aria-label="Mais cinco">+5</button></div>
          ${L ? `<button class="btn big red ap-prova-btn" type="button" data-a="prova">PROVA, ${esc(nome(v, L.de))}!</button>` : ''}
        </div>`
      : `<p class="hint">Vez de ${esc(nome(v, v.vez))}…</p>`
    return `<div class="ap-mesa">
      <div class="ap-lance">${L ? `<small>${esc(nome(v, L.de))} aposta que faz</small><b>${L.n}</b><span>${unidade(v, L.n)}</span>` : '<small>ninguém apostou ainda</small><b>–</b>'}</div>
      <div class="ap-vez" style="${cor(v.vez)}"><span class="lbl">${ui.local ? `vez de ${esc(nome(v, v.vez))}` : ui.souVez ? 'sua vez' : 'vez de ' + esc(nome(v, v.vez))}</span>${relogio()}</div>
      ${acao}
      ${hist ? `<div class="ap-hist">${hist}</div>` : ''}
    </div>`
  }

  function truco(v, ui) {
    const T = v.truco
    const P = v.prova
    const vale = (nivel) => P.n * v.MULT[nivel]
    const gritos = T.gritos.map((g) => `<span style="${cor(g.j)}">${esc(nome(v, g.j))}: <b>${g.grito}!</b></span>`).join('')
    const prox = (T.proposta || T.nivel) + 1
    let botoes = `<p class="hint">${esc(nome(v, T.quem))} está decidindo…</p>`
    if (ui.souTruco) {
      botoes = !T.proposta
        ? `<button class="btn big" type="button" data-a="truco" data-v="provar">Provar valendo ${vale(T.nivel)}</button>
           ${prox < v.MULT.length ? `<button class="btn big red ap-grito" type="button" data-a="truco" data-v="aumentar">${v.GRITO[prox]}!</button>` : ''}`
        : `<button class="btn big green" type="button" data-a="truco" data-v="aceito">Aceito (vale ${vale(T.proposta)})</button>
           <button class="btn paper" type="button" data-a="truco" data-v="corro">Corro (dá ${vale(T.nivel)} pro ${esc(nome(v, T.gritos[T.gritos.length - 1].j))})</button>
           ${prox < v.MULT.length ? `<button class="btn big red ap-grito" type="button" data-a="truco" data-v="aumentar">${v.GRITO[prox]}!</button>` : ''}`
    }
    return `<div class="ap-mesa ap-truco">
      <div class="ap-lance"><small>${esc(nome(v, P.j))} vai provar ${P.n} ${unidade(v, P.n)} · valendo</small><b>${vale(T.proposta || T.nivel)}</b><span>${T.proposta ? 'se aceitar' : 'pontos'}</span></div>
      ${gritos ? `<div class="ap-gritos">${gritos}</div>` : ''}
      <div class="ap-vez" style="${cor(T.quem)}"><span class="lbl">${ui.local ? `${esc(nome(v, T.quem))} decide` : ui.souTruco ? 'você decide' : esc(nome(v, T.quem)) + ' decide'}</span>${relogio()}</div>
      <div class="ap-acao">${botoes}</div>
    </div>`
  }

  function prova(v, ui) {
    const P = v.prova
    const pct = Math.min(100, (100 * P.soma) / P.n)
    const falas = P.falas.map((f) => `<span class="${f.v ? 'ok' : 'erro'}">${esc(f.n)}${f.v ? ` <b>+${f.v}</b>` : ' ✗'}</span>`).join('')
    const passa = !P.comecou && ui.local && !v.js[P.j].bot
    const cab = `<div class="ap-provando" style="${cor(P.j)}">
      <span class="lbl">${esc(nome(v, P.chamou))} mandou provar${P.mult > 1 ? ` · valendo ${P.n * P.mult}` : ''}</span>
      <b>${esc(nome(v, P.j))} tem que fazer ${P.n} ${unidade(v, P.n)}</b>
      <span class="ap-soma"><b>${P.soma}</b>/${P.n}</span>
      <span class="ap-tema-mini">${esc(v.tema.titulo)}</span>
      <span class="ap-barra"><i style="width:${pct}%"></i></span>
      ${P.comecou ? relogio() : '<span class="ap-prepara">prepara…</span>'}
    </div>`
    const juiz = ui.souJuiz && P.comecou ? lista(v, ui) : ''
    const fala = !ui.souJuiz && ui.souProva && P.comecou ? '<p class="ap-fala">FALA! Diga os nomes em voz alta.</p>' : ''
    return `${cab}${fala}
      <div class="ap-falas">${falas || '<small>nenhum nome ainda</small>'}</div>
      ${juiz}
      ${passa ? `<div class="ap-passa" role="dialog"><div><span class="lbl">prova</span><h3>${esc(nome(v, P.j))} fala, ${esc(nome(v, v.juizLocal))} é o juiz</h3>
        <p>O celular fica com o juiz. ${esc(nome(v, P.j))} fala nomes de <b>${esc(v.tema.titulo)}</b> em voz alta e o juiz toca em cada um na lista.</p>
        <button class="btn big" type="button" data-a="comecar-prova">Começar</button></div></div>` : ''}`
  }

  // a lista oficial, só pra quem julga: letras em cima, nomes embaixo, e os dois botões do juiz
  function lista(v, ui) {
    const P = v.prova
    const letras = [...new Set(v.itens.flatMap((it) => [...iniciais(it.n)]))].sort()
    const L = ui.letra && letras.includes(ui.letra) ? ui.letra : ''
    const nomes = v.itens.map((it, i) => ({ ...it, i })).filter((it) => !L || iniciais(it.n).has(L))
    return `<div class="ap-juiz">
      <span class="lbl">${v.autoJuiz ? 'testando contra bots: você mesmo marca (sem roubar!)' : 'você é o juiz: toque no nome que ele falar'}</span>
      <div class="ap-letras"><button type="button" data-a="letra" data-v="" aria-pressed="${!L}">todas</button>${letras.map((l) => `<button type="button" data-a="letra" data-v="${l}" aria-pressed="${L === l}">${l}</button>`).join('')}</div>
      <div class="ap-nomes" id="ap-nomes">${nomes.map((it) => { const m = P.marcados.includes(it.i); return `<button class="ap-nome${m ? ' ok' : ''}" type="button" data-a="marcar" data-v="${it.i}"${m ? ' disabled' : ''}>${esc(it.n)}${v.modo === 'raridade' ? `<i class="r${it.v}">${it.v}</i>` : ''}</button>` }).join('')}</div>
      <div class="ap-juiz-btns"><button class="btn paper" type="button" data-a="desmarcar"${P.marcados.length ? '' : ' disabled'}>Desfazer</button>
        <button class="btn red" type="button" data-a="errou">Não tá na lista!</button></div>
    </div>`
  }

  function resultado(v, ui) {
    const R = v.resultado
    const txt = R.motivo === 'correu' ? 'CORREU!' : R.ok ? 'PROVOU!' : R.motivo === 'tempo' ? 'ACABOU O TEMPO!' : 'ERROU!'
    const como = R.motivo === 'correu' ? `${esc(nome(v, R.correu))} correu do truco.` : R.ok ? `${esc(nome(v, R.j))} fez ${R.soma} de ${R.n}.` : `${esc(nome(v, R.j))} fez ${R.soma} de ${R.n}.`
    return `<div class="ap-resultado ${R.ok ? 'ok' : 'erro'}">
      <b class="ap-carimbo">${txt}</b>
      <p>${como} <b style="${cor(R.ganhou)}">+${R.pts} pro ${esc(nome(v, R.ganhou))}</b></p>
      ${R.faltou.length ? `<div class="ap-faltou"><span class="lbl">dava pra ter falado</span><div>${R.faltou.map((f) => `<span>${esc(f.n)}${v.modo === 'raridade' ? ` <i class="r${f.v}">${f.v}</i>` : ''}</span>`).join('')}</div></div>` : ''}
      ${ui.podeSeguir ? `<button class="btn big" type="button" data-a="proxima">${v.fimLogo ? 'Ver o placar final' : 'Próxima rodada'}</button>` : '<p class="hint">A próxima rodada já vai começar…</p>'}
    </div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'lances' ? lances(v, ui) : v.fase === 'truco' ? truco(v, ui) : v.fase === 'prova' ? prova(v, ui) : resultado(v, ui)
    const [modo, explica] = MODOS[v.modo]
    return `<section class="ap-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-a="sair">sair</button></div>
      ${v.fase === 'prova' ? '' : `<div class="ap-tema"><span class="lbl">rodada ${v.rodada} · ${modo}</span><h2>${esc(v.tema.titulo)}</h2><small>${explica}</small></div>`}
      ${meio}
      ${ui.estouro ? `<div class="ap-estouro" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
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

  window.ApostoTelas = { entrada, sala, jogo, fim, DURACAO }
})()
