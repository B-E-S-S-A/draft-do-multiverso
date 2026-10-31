// Telas do Aposto Que Sei. Recebem a visão (v) e o estado da tela (ui) e devolvem HTML; quem manda é aposto.js.
(function () {
  const V = window.View
  const esc = V.esc
  const cor = (i) => `--cor: var(--c${i % 10})`
  const nome = (v, j) => (v.js[j] ? v.js[j].nome : '?')
  // raridade de cada nome (só conta se a opção Raridade estiver ligada)
  const RAR = { 1: ['comum', '●'], 2: ['raro', '◆'], 3: ['lendário', '★'] }
  const gema = (v) => `<i class="ap-gema r${v}" title="${RAR[v][0]}">${RAR[v][1]} ${v}</i>`
  const DURACAO = (raridade) => (raridade ? [25, 40, 60] : [12, 20, 30])
  const unidade = (v, n) => (v.raridade ? (n === 1 ? 'ponto' : 'pontos') : n === 1 ? 'nome' : 'nomes')
  const ficha = (j, n, grande) => `<span class="ap-ficha${grande ? ' grande' : ''}" style="${cor(j)}"><b>${n}</b></span>`
  // tira acento pra agrupar por letra (Ômega fica no O)
  const inicial = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/^[^A-Za-z0-9]+/, '').charAt(0).toUpperCase()
  const iniciais = (n) => { const a = new Set([inicial(n)]); const p = n.match(/\(([^)]+)\)/); if (p) a.add(inicial(p[1])); return a }

  function como(o) {
    return `<ol class="how">
      <li>Sai um tema: "Inimigos do Homem-Aranha".</li>
      <li>Na sua vez, aumente a aposta (${o.raridade ? '"faço 12 pontos!"' : '"falo 8!"'}) ou aperte <b>DUVIDO!</b> pra quem apostou mais provar.</li>
      <li>Quem apostou fala os nomes em voz alta, contra o relógio${o.raridade ? ', e quem duvidou marca cada um na lista (cada nome vale diferente)' : ' e toca +1 a cada nome'}. Quem duvidou escuta: desconfiou de um nome? Digita e o celular confere.</li>
      ${o.truco ? '<li>Antes da prova, quem vai provar pode pedir TRUCO (vale o dobro). O outro aceita, corre ou pede SEIS!</li>' : ''}
      ${o.raridade ? '<li>Nome comum vale 1, raro vale 2, lendário vale 3.</li>' : ''}
      <li>Nome que não vale? Errou. Provou: ganha a aposta. Errou: quem duvidou ganha.</li>
    </ol>`
  }

  // as duas opções viram chaves de liga/desliga, cada uma com a sua cara
  function opcoes(o, pode) {
    const chave = (k, titulo, texto, enfeite) => `<button class="ap-opcao ${k}" type="button" data-a="opt" data-v="${k}" aria-pressed="${!!o[k]}"${pode ? '' : ' disabled'}>
      <span class="ap-chave" aria-hidden="true"><i></i></span><b>${titulo}</b><small>${texto}</small>${enfeite}</button>`
    return `<div class="field"><span class="lbl">Opções</span><div class="ap-opcoes">
        ${chave('truco', 'Truco', 'Antes da prova: TRUCO vale o dobro. Aceita, corre ou pede SEIS!', '<span class="ap-selo">TRUCO!</span>')}
        ${chave('raridade', 'Raridade', 'Nome raro vale mais. A aposta vira pontos.', `<span class="ap-gemas">${gema(1)}${gema(2)}${gema(3)}</span>`)}
      </div></div>
      <div class="field"><span class="lbl">Ganha quem chegar a</span><div class="presets">${DURACAO(o.raridade).map((x, i) =>
      `<button class="preset" type="button" data-a="meta" data-v="${x}" aria-pressed="${o.meta === x}"${pode ? '' : ' disabled'}>${x} pontos · ${['curta', 'média', 'longa'][i]}</button>`).join('')}</div></div>`
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
          ${opcoes(ui, true)}
          <div class="go-row"><button class="linkish" type="button" data-a="bots">testar sozinho contra 3 bots</button>
            <button class="btn big" type="button" data-a="local">Começar</button></div>
        </div>
        <div class="ap-coluna">
          <div class="panel"><h2>Como jogar</h2>${como(ui)}</div>
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
        <div class="panel rules"><h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>${opcoes(v, v.dono)}${como(v)}</div>
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
    const hist = v.hist.map((h) => `<span style="${cor(h.j)}">${h.prova ? '<b class="ap-hist-prova">DUVIDO!</b>' : ficha(h.j, h.n)}<small>${esc(nome(v, h.j))}</small></span>`).join('<i>›</i>')
    const minimo = L ? L.n + 1 : 1
    const valor = Math.max(minimo, ui.valor || minimo)
    const acao = ui.souVez
      ? `<div class="ap-acao">
          <div class="ap-aposta"><button class="btn paper step" type="button" data-a="valor" data-v="-1"${valor <= minimo ? ' disabled' : ''} aria-label="Menos">−</button>
            <button class="btn big" type="button" data-a="apostar" data-v="${valor}">Aposto ${valor}</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="1" aria-label="Mais">+</button>
            <button class="btn paper step" type="button" data-a="valor" data-v="5" aria-label="Mais cinco">+5</button></div>
          ${L ? `<button class="btn big red ap-prova-btn" type="button" data-a="prova">DUVIDO, ${esc(nome(v, L.de))}!</button>` : ''}
        </div>`
      : `<p class="hint">Vez de ${esc(nome(v, v.vez))}…</p>`
    return `<div class="ap-mesa">
      <div class="ap-feltro">${L ? `${ficha(L.de, L.n, true)}<div><small>${esc(nome(v, L.de))} aposta que faz</small><b>${L.n} ${unidade(v, L.n)}</b></div>`
        : '<span class="ap-ficha grande vazia"><b>?</b></span><div><small>ninguém apostou ainda</small><b>quem abre?</b></div>'}</div>
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
      <div class="ap-feltro">${ficha(P.j, vale(T.proposta || T.nivel), true)}<div><small>${esc(nome(v, P.j))} vai provar ${P.n} ${unidade(v, P.n)}</small><b>valendo ${vale(T.proposta || T.nivel)}${T.proposta ? ' se aceitar' : ''}</b></div></div>
      ${gritos ? `<div class="ap-gritos">${gritos}</div>` : ''}
      <div class="ap-vez" style="${cor(T.quem)}"><span class="lbl">${ui.local ? `${esc(nome(v, T.quem))} decide` : ui.souTruco ? 'você decide' : esc(nome(v, T.quem)) + ' decide'}</span>${relogio()}</div>
      <div class="ap-acao">${botoes}</div>
    </div>`
  }

  // os nomes já falados (sem Raridade, cada toque de +1 vira uma ficha sem nome)
  function falas(v) {
    const P = v.prova
    return P.falas.map((f) => (!f.v ? `<span class="erro">${esc(f.n)} ✗</span>` : f.n
      ? `<span class="ok${v.raridade ? ' r' + f.v : ''}">${esc(f.n)} <b>+${f.v}</b></span>` : '<span class="ok conta"><b>+1</b></span>')).join('') || '<small>nenhum nome ainda</small>'
  }

  function prova(v, ui) {
    const P = v.prova
    const pct = Math.min(100, (100 * P.soma) / P.n)
    const passa = !P.comecou && ui.local && !v.js[P.j].bot
    const D = P.ultimaDuvida
    const cab = `<div class="ap-provando" style="${cor(P.j)}">
      <span class="lbl">${esc(nome(v, P.chamou))} duvidou${P.mult > 1 ? ` · valendo ${P.n * P.mult}` : ''}</span>
      <b>${esc(nome(v, P.j))} tem que fazer ${P.n} ${unidade(v, P.n)}</b>
      <span class="ap-soma"><b>${P.soma}</b>/${P.n}</span>
      <span class="ap-tema-mini">${esc(v.tema.titulo)}</span>
      <span class="ap-barra" aria-hidden="true"><i style="width:${pct}%"></i></span>
      ${P.comecou ? relogio() : '<span class="ap-prepara">prepara…</span>'}
    </div>`
    const rodando = P.comecou && !v.js[P.j].bot
    // sem Raridade: quem prova toca +1 a cada nome; com Raridade, quem duvidou marca na lista
    const conta = rodando && !v.raridade && ui.souProva
      ? `<div class="ap-conta"><button class="btn big ap-mais" type="button" data-a="contar">+1 <small>falei um nome</small></button>
          <button class="btn paper" type="button" data-a="descontar"${P.falas.length && P.falas[P.falas.length - 1].n === '' ? '' : ' disabled'}>desfazer</button></div>` : ''
    const fala = rodando && ui.souProva && !ui.local && v.raridade ? '<p class="ap-fala">FALA! Diga os nomes em voz alta.</p>' : ''
    const juiz = rodando && v.raridade && ui.souJuiz ? lista(v, ui) : ''
    const duvida = rodando && !v.raridade && ui.souDuvida ? `<div class="ap-juiz ap-duvido">${caixaDuvida(v, ui)}</div>` : ''
    return `${cab}${fala}
      ${D ? `<p class="ap-duvida-res ${D.vale ? 'ok' : 'erro'}">${esc(nome(v, D.quem))} duvidou de "${esc(D.texto)}": <b>${D.vale ? `✓ vale (${esc(D.nome)})` : '✗ não vale'}</b></p>` : ''}
      <div class="ap-falas" id="ap-falas">${falas(v)}</div>
      ${conta}${juiz}${duvida}
      ${passa ? `<div class="ap-passa" role="dialog"><div><span class="lbl">prova</span><h3>${esc(nome(v, P.j))} fala, ${esc(nome(v, v.juizLocal))} escuta</h3>
        <p>${v.raridade
          ? `O celular fica com ${esc(nome(v, v.juizLocal))}. ${esc(nome(v, P.j))} fala nomes de <b>${esc(v.tema.titulo)}</b> em voz alta e ${esc(nome(v, v.juizLocal))} marca cada um na lista (cada nome vale diferente).`
          : `Deixem o celular no meio. ${esc(nome(v, P.j))} fala nomes de <b>${esc(v.tema.titulo)}</b> e toca <b>+1</b> a cada um. ${esc(nome(v, v.juizLocal))} escuta: se duvidar de um nome, toca DUVIDO e digita pra conferir.`}</p>
        <button class="btn big" type="button" data-a="comecar-prova">Começar</button></div></div>` : ''}`
  }

  // o "duvido" de quem escuta: digita o nome suspeito e o celular confere na lista do tema
  function caixaDuvida(v, ui) {
    if (!ui.digitando) return `<button class="btn red ap-duvido-btn" type="button" data-a="abrir-duvida">DUVIDO DE UM NOME</button>`
    return `<label class="ap-digita"><span class="lbl">digite o nome que você acha que não vale</span>
        <input id="ap-duvida-txt" maxlength="40" autocomplete="off" autocapitalize="words" enterkeyhint="go" value="${esc(ui.duvida || '')}"></label>
      <div class="ap-juiz-btns"><button class="btn paper" type="button" data-a="fechar-duvida">cancelar</button>
        <button class="btn red" type="button" data-a="duvidar">Conferir</button></div>`
  }

  // a lista oficial, só pra quem escuta (com Raridade): letras em cima, nomes embaixo, e o duvido digitado
  function lista(v, ui) {
    const P = v.prova
    const letras = [...new Set(v.itens.flatMap((it) => [...iniciais(it.n)]))].sort()
    const L = ui.letra && letras.includes(ui.letra) ? ui.letra : ''
    const nomes = v.itens.map((it, i) => ({ ...it, i })).filter((it) => !L || iniciais(it.n).has(L))
    return `<div class="ap-juiz">
      <span class="lbl">${v.autoJuiz ? 'testando contra bots: você mesmo marca (sem roubar!)' : 'toque no nome que ele falar'}</span>
      <div class="ap-letras"><button type="button" data-a="letra" data-v="" aria-pressed="${!L}">todas</button>${letras.map((l) => `<button type="button" data-a="letra" data-v="${l}" aria-pressed="${L === l}">${l}</button>`).join('')}</div>
      <div class="ap-nomes" id="ap-nomes">${nomes.map((it) => { const m = P.marcados.includes(it.i); return `<button class="ap-nome${m ? ' ok' : ''}${v.raridade ? ' r' + it.v : ''}" type="button" data-a="marcar" data-v="${it.i}"${m ? ' disabled' : ''}>${esc(it.n)}${v.raridade ? gema(it.v) : ''}</button>` }).join('')}</div>
      <div class="ap-juiz-btns"><button class="btn paper" type="button" data-a="desmarcar"${P.marcados.length ? '' : ' disabled'}>Desfazer</button>
        ${ui.digitando ? '' : '<button class="btn red" type="button" data-a="abrir-duvida">Não achei: digitar</button>'}</div>
      ${ui.digitando ? caixaDuvida(v, ui) : ''}
    </div>`
  }

  function resultado(v, ui) {
    const R = v.resultado
    const txt = R.motivo === 'correu' ? 'CORREU!' : R.ok ? 'PROVOU!' : R.motivo === 'tempo' ? 'ACABOU O TEMPO!' : R.motivo === 'duvido' ? 'NÃO VALE!' : 'ERROU!'
    const como = R.motivo === 'correu' ? `${esc(nome(v, R.correu))} correu do truco.` : R.ok ? `${esc(nome(v, R.j))} fez ${R.soma} de ${R.n}.` : `${esc(nome(v, R.j))} fez ${R.soma} de ${R.n}.`
    return `<div class="ap-resultado ${R.ok ? 'ok' : 'erro'}">
      <b class="ap-carimbo${txt.length > 8 ? ' longo' : ''}">${txt}</b>
      <p>${como} <b style="${cor(R.ganhou)}">+${R.pts} pro ${esc(nome(v, R.ganhou))}</b></p>
      ${R.faltou.length ? `<div class="ap-faltou"><span class="lbl">dava pra ter falado</span><div>${R.faltou.map((f) => `<span class="${v.raridade ? 'r' + f.v : ''}">${esc(f.n)}${v.raridade ? gema(f.v) : ''}</span>`).join('')}</div></div>` : ''}
      ${ui.podeSeguir ? `<button class="btn big" type="button" data-a="proxima">${v.fimLogo ? 'Ver o placar final' : 'Próxima rodada'}</button>` : '<p class="hint">A próxima rodada já vai começar…</p>'}
    </div>`
  }

  function jogo(v, ui) {
    const meio = v.fase === 'lances' ? lances(v, ui) : v.fase === 'truco' ? truco(v, ui) : v.fase === 'prova' ? prova(v, ui) : resultado(v, ui)
    const selos = (v.comTruco ? '<span class="ap-selo">truco</span>' : '') + (v.raridade ? `<span class="ap-gemas">${gema(1)}${gema(2)}${gema(3)}</span>` : '<span class="ap-selo claro">cada nome vale 1</span>')
    return `<section class="ap-jogo fase-${v.fase}">
      <div class="imp-topo">${placar(v)}<button class="linkish" type="button" data-a="sair">sair</button></div>
      ${v.fase === 'prova' ? '' : `<div class="ap-tema${v.fase === 'lances' && !v.hist.length ? ' novo' : ''}"><span class="ap-rodada">rodada ${v.rodada}</span><h2>${esc(v.tema.titulo)}</h2><div class="ap-selos">${selos}</div></div>`}
      ${meio}
      ${ui.estouro ? `<div class="ap-estouro" aria-hidden="true"><b>${esc(ui.estouro)}</b></div>` : ''}
    </section>`
  }

  function fim(v, ui) {
    const ordem = v.js.map((p, i) => i).sort((a, b) => v.js[b].pts - v.js[a].pts)
    const w = ordem[0]
    return `<section class="ap-fimtela"><div class="panel ap-fim" style="${cor(w)}">
      <span class="lbl">fim de jogo</span><h2>${esc(v.js[w].nome)} sabe mais!</h2>
      <ol class="ap-rank">${ordem.map((i, k) => { const p = v.js[i]; return `<li style="${cor(i)}">${k < 3 ? `<em class="ap-medalha m${k}">${k + 1}º</em>` : ''}<span>${esc(p.nome)} <small>${p.provas ? `provou ${p.acertou} de ${p.provas}` : 'nunca provou'}</small></span><b>${p.pts}</b></li>` }).join('')}</ol>
      <div class="online-row">${ui.podeSeguir ? '<button class="btn big" type="button" data-a="denovo">Jogar de novo</button>' : ''}<button class="linkish" type="button" data-a="sair">sair</button></div>
    </div></section>`
  }

  window.ApostoTelas = { entrada, sala, jogo, fim, falas, DURACAO }
})()
