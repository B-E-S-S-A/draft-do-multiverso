// Telas da Bolsa do Multiverso. Recebem a visão deste aparelho (v) e o estado da tela (ui) e devolvem HTML.
// Durante o pregão a tela não é redesenhada: atualizar() só troca os números (assim o toque nunca "some").
(function () {
  const E = window.Engine
  const V = window.View
  const esc = V.esc
  const cor = (i) => `--cor: var(--c${i % 10})`
  const din = (n) => (n < 0 ? '−R$' : 'R$') + Math.abs(Math.round(n))
  const sinal = (n) => (n > 0 ? '▲' + n : n < 0 ? '▼' + -n : '=')
  const lado = (n) => (n > 0 ? 'sobe' : n < 0 ? 'cai' : '')
  const capa = (ac) => V.cover(E.lotOf('hq:' + ac.hq))
  const chip = (ac) => `<b class="bo-chip">${esc(ac.t)}</b>`

  const TIPOS = {
    sobe: (t) => `${t} vai <b class="sobe">SUBIR</b> nesta rodada`, sobeMuito: (t) => `${t} vai <b class="sobe">SUBIR MUITO</b> (5 ou mais)`,
    cai: (t) => `${t} vai <b class="cai">CAIR</b> nesta rodada`, caiMuito: (t) => `${t} vai <b class="cai">CAIR MUITO</b> (5 ou mais)`,
    nada: (t) => `${t} <b>não tem notícia</b> nesta rodada`, geral: () => 'Vem notícia que mexe na <b>bolsa toda</b>',
  }
  const dica = (v, d) => TIPOS[d.tipo](d.a >= 0 ? chip(v.acoes[d.a]) : '')

  function como() {
    return `<ol class="how">
      <li>Compre barato e venda caro. Cada compra sobe o preço R$1 e cada venda desce R$1.</li>
      <li>No fim da rodada sai o <b>Clarim Diário</b>. O que vocês empurraram no pregão murcha e só as notícias mexem no preço.</li>
      <li>Toda rodada você recebe 2 dicas secretas. Cuidado: pode ser um <b>boato</b> plantado por alguém.</li>
      <li>Vender o que você não tem é apostar na queda: ganha se o preço cair.</li>
      <li>Um de vocês é o <b>Skrull</b> e sabe todas as notícias. Desconfiou pelas compras? Denuncie (1 vez por jogo).</li>
    </ol>`
  }

  // ---------- antes da sala ----------
  function entrada(ui) {
    return `<section class="setup bo-entrada">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Pregão aberto</h2>
          <label class="imp-meu-nome"><span class="lbl">Seu nome</span>
            <input id="bo-nome" maxlength="14" autocomplete="off" placeholder="Seu nome" value="${esc(ui.nome)}"></label>
          <div class="field"><span class="lbl">Criar uma sala</span>
            <div class="online-row"><button class="btn big" type="button" data-b="criar">Criar sala</button>
              <button class="btn paper" type="button" data-b="criar-telao">Criar no telão</button></div>
            <p class="note">"Telão" é pra um PC ou TV que só mostra a bolsa pra todo mundo. Cada um joga no seu celular.</p>
          </div>
          <div class="field"><span class="lbl">Entrar numa sala</span>
            <div class="online-row"><input id="bo-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" value="${esc(ui.codigo || '')}">
              <button class="btn green" type="button" data-b="entrar">Entrar</button>
              <button class="btn paper" type="button" data-b="entrar-telao">Como telão</button></div>
            ${ui.erro ? `<p class="neterr" role="alert">${esc(ui.erro)}</p>` : ''}
            ${ui.status ? `<p class="note" role="status">${esc(ui.status)}</p>` : ''}
          </div>
          <div class="field"><span class="lbl">Testar sozinho</span>
            <div class="online-row"><div class="stepper">
              <button class="btn paper step" type="button" data-b="bots" data-v="-1" aria-label="Menos bots"${ui.bots <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${ui.bots}</b>
              <button class="btn paper step" type="button" data-b="bots" data-v="1" aria-label="Mais bots"${ui.bots >= 7 ? ' disabled' : ''}>+</button></div>
              <button class="btn red" type="button" data-b="testar">Jogar com ${ui.bots} bots</button></div>
          </div>
        </div>
        <div class="panel"><h2>Como jogar</h2>${como()}</div>
      </div>
    </section>`
  }

  // ---------- sala de espera ----------
  function sala(v, ui) {
    const jogam = v.pessoas.filter((p) => !p.telao)
    const lista = `<ol class="imp-sala">${v.pessoas.map((p, i) => `<li style="${cor(i)}"${p.on ? '' : ' class="fora"'}><span>${esc(p.nome)}</span>
      <small>${[p.voce ? 'você' : '', p.dono ? 'criou' : '', p.bot ? 'bot' : '', p.telao ? 'telão' : ''].filter(Boolean).join(' · ')}</small>
      ${v.dono && p.bot ? `<button class="linkish" type="button" data-b="tira-bot" data-v="${i}">tirar</button>` : ''}</li>`).join('')}</ol>`
    const op = (nome, chave, valores, rotulo) => `<div class="field"><span class="lbl">${nome}</span><div class="presets">${valores.map((x) =>
      `<button class="preset" type="button" data-b="opc" data-k="${chave}" data-v="${x}" aria-pressed="${v.opc[chave] === x}"${v.dono ? '' : ' disabled'}>${rotulo(x)}</button>`).join('')}</div></div>`
    const pode = jogam.length >= 2
    return `<section class="setup bo-sala">
      <div class="imp-topo"><span class="hint">Sala ${esc(v.code)} · ${jogam.length} na bolsa</span>
        <button class="linkish" type="button" data-b="sair">${v.dono ? 'Fechar sala' : 'Sair da sala'}</button></div>
      <div class="setup-grid">
        <div class="panel rules">
          <h2>${v.dono ? 'Regras' : 'Regras da sala'}</h2>
          ${op('Rodadas', 'rodadas', [6, 8, 10], (x) => x)}
          ${op('Tempo de pregão', 'tempo', [30, 40, 60], (x) => x + ' s')}
          ${op('Skrull infiltrado', 'skrull', [true, false], (x) => (x ? 'Sim' : 'Não'))}
          ${v.opc.skrull && jogam.length < 3 ? '<p class="note">O Skrull só entra com 3 ou mais na bolsa.</p>' : ''}
          ${como()}
        </div>
        <div class="panel">
          <h2>Sala ${esc(v.code)}</h2>
          ${v.dono ? `<b class="code">${esc(v.code)}</b>
            <div class="online-row"><button class="btn paper" type="button" data-b="convite">Copiar convite</button>
              <button class="btn paper" type="button" data-b="poe-bot"${v.pessoas.length >= 10 ? ' disabled' : ''}>+ bot</button></div>
            <p class="note" role="status">${esc(ui.msg || '')}</p>` : ''}
          ${v.souTelao ? '' : `<label class="imp-meu-nome"><span class="lbl">Seu nome</span>
            <input id="bo-meu-nome" maxlength="14" autocomplete="off" value="${esc(ui.nome)}"></label>`}
          ${lista}
        </div>
      </div>
      <div class="go-row">${v.dono ? `${pode ? '' : '<span class="lbl">Falta gente (ou um bot)</span>'}
        <button class="btn big" type="button" data-b="comecar"${pode ? '' : ' disabled'}>Abrir o pregão</button>` : '<p class="hint">Esperando quem criou a sala abrir o pregão…</p>'}</div>
    </section>`
  }

  // ---------- pregão (celular) ----------
  function faseTxt(v) { return v.fase === 'leitura' ? 'Leiam as dicas' : v.fase === 'pregao' ? 'Pregão aberto' : v.fase === 'jornal' ? 'Clarim Diário' : 'Fim' }

  function topo(v) {
    return `<div class="bo-topo">
      <span class="bo-rod">Rodada <b>${v.rodada}</b>/${v.total}</span><span class="bo-fase" data-x="fase">${faseTxt(v)}</span>
      <span class="bo-relogio"><i data-x="barra"></i><b data-x="seg"></b></span>
      <button class="linkish" type="button" data-b="sair">sair</button></div>`
  }

  function linhaAcao(v, ac, a) {
    return `<li class="bo-acao" data-a="${a}">
      <span class="bo-capa">${capa(ac)}</span>
      <span class="bo-nome">${chip(ac)}<small>${esc(ac.nome)}</small></span>
      <span class="bo-preco"><b data-x="px"></b><small data-x="var"></small></span>
      <span class="bo-minha"><b data-x="pos"></b><small data-x="posl"></small></span>
      <button class="bo-btn vende" type="button" data-b="neg" data-c="0" data-v="${a}"><small>vender</small><b data-x="pv"></b></button>
      <button class="bo-btn compra" type="button" data-b="neg" data-c="1" data-v="${a}"><small>comprar</small><b data-x="pc"></b></button>
    </li>`
  }

  function segredos(v) {
    const m = v.meu
    if (m.skrull) {
      return `<div class="bo-segredo skrull"><span class="lbl">Você é o Skrull · manchetes de amanhã</span><ul>${m.manchetes.map((x) =>
        `<li>${esc(x.txt)} <em>${x.a >= 0 ? `${esc(v.acoes[x.a].t)} ${sinal(x.d)}` : x.alvos ? x.alvos.map((a) => esc(v.acoes[a].t)).join(', ') + ' pela metade' : `todas ${sinal(x.d)}`}</em></li>`).join('')}</ul>
        <small>Use isso sem dar bandeira: se te denunciarem, você perde metade de tudo.</small></div>`
    }
    return `<div class="bo-segredo"><span class="lbl">Suas dicas secretas</span><ul>${m.dicas.map((d) => `<li>${dica(v, d)}</li>`).join('')}</ul></div>`
  }

  function extras(v, ui) {
    const m = v.meu
    const alguemPego = v.jogadores.some((j) => j.pego)
    const botoes = `<div class="bo-extras">
      <button class="btn paper" type="button" data-b="painel" data-v="boato"${m.boato || v.rodada >= v.total ? ' disabled' : ''}>${m.boato ? 'Boato plantado' : `Plantar boato · ${din(5)}`}</button>
      ${v.skrullModo ? `<button class="btn red" type="button" data-b="painel" data-v="denuncia"${m.denunciou || alguemPego || m.skrull ? ' disabled' : ''}>${alguemPego ? 'Skrull já foi pego' : m.denunciou ? 'Já denunciou' : 'Denunciar Skrull'}</button>` : ''}
    </div>`
    if (ui.painel === 'boato') {
      const s = ui.boato || {}
      return botoes + `<div class="panel bo-painel"><span class="lbl">Boato pra próxima rodada</span>
        <p class="note">Ele chega pra até 2 pessoas como se fosse uma dica de verdade. Quem cair vai comprar (ou vender) e você lucra em cima.</p>
        <div class="bo-escolhe">${v.acoes.map((ac, a) => `<button class="preset" type="button" data-b="boato-a" data-v="${a}" aria-pressed="${s.a === a}">${esc(ac.t)}</button>`).join('')}</div>
        <div class="bo-escolhe"><button class="preset" type="button" data-b="boato-d" data-v="1" aria-pressed="${s.sobe === true}">vai subir</button>
          <button class="preset" type="button" data-b="boato-d" data-v="0" aria-pressed="${s.sobe === false}">vai cair</button></div>
        <div class="online-row"><button class="btn" type="button" data-b="boato-ok"${s.a === undefined || s.sobe === undefined ? ' disabled' : ''}>Plantar</button>
          <button class="linkish" type="button" data-b="painel" data-v="">cancelar</button></div></div>`
    }
    if (ui.painel === 'denuncia') {
      return botoes + `<div class="panel bo-painel"><span class="lbl">Quem é o Skrull?</span>
        <p class="note">Acertou: o Skrull perde metade de tudo e você ganha ${din(20)}. Errou: você paga ${din(20)} pra pessoa. Só dá pra denunciar uma vez.</p>
        <div class="bo-escolhe">${v.jogadores.map((j, i) => (i === v.eu ? '' : `<button class="preset" type="button" data-b="denuncia-ok" data-v="${i}" style="${cor(i)}">${esc(j.nome)}</button>`)).join('')}</div>
        <button class="linkish" type="button" data-b="painel" data-v="">cancelar</button></div>`
    }
    return botoes
  }

  function jogo(v, ui) {
    return `<section class="bo-jogo" data-chave="${v.fase}${v.rodada}">
      ${topo(v)}
      <div class="bo-eu" style="${cor(v.eu)}"><span><small>caixa</small><b data-x="caixa"></b></span><span><small>patrimônio</small><b data-x="pat"></b></span>
        <span class="bo-quem">${esc(v.jogadores[v.eu].nome)}</span></div>
      ${segredos(v)}
      <ul class="bo-lista">${v.acoes.map((ac, a) => linhaAcao(v, ac, a)).join('')}</ul>
      <div class="bo-fita"><span class="lbl">Fita do pregão</span><ol data-x="fita"></ol></div>
      ${extras(v, ui)}
      ${v.fase === 'leitura' ? leitura(v) : ''}
      ${v.fase === 'jornal' ? jornal(v, false) : ''}
    </section>`
  }

  function leitura(v) {
    return `<div class="bo-sino"><b>Rodada ${v.rodada}</b><span>leiam as dicas… o pregão já vai abrir</span></div>`
  }

  // ---------- telão ----------
  function telao(v) {
    return `<div class="bo-telao" data-chave="${v.fase}${v.rodada}">
      <header class="bo-tl-topo"><b>Bolsa do <em>Multiverso</em></b>
        <span class="bo-rod">Rodada <b>${v.rodada}</b>/${v.total} · <span data-x="fase">${faseTxt(v)}</span></span>
        <span class="bo-relogio grande"><i data-x="barra"></i><b data-x="seg"></b></span>
        <button class="bo-tl-sair" type="button" data-b="sair">sair</button></header>
      <div class="bo-quadro">${v.acoes.map((ac, a) => `<div class="bo-tile" data-a="${a}">
        <span class="bo-capa">${capa(ac)}</span>
        <span class="bo-tile-txt">${chip(ac)}<small>${esc(ac.nome)}</small></span>
        <b class="bo-px" data-x="px"></b><small class="bo-var" data-x="var"></small>
        <svg class="bo-spark" viewBox="0 0 100 30" preserveAspectRatio="none" aria-hidden="true">${grafico(ac.hist, 100, 30)}</svg></div>`).join('')}</div>
      <aside class="bo-lado">
        <div><span class="lbl">Fita do pregão</span><ol class="bo-fita-tl" data-x="fita"></ol></div>
        <div><span class="lbl">Patrimônio (último fechamento)</span>${ranking(v)}</div>
      </aside>
      ${v.fase === 'leitura' ? leitura(v) : ''}
      ${v.fase === 'jornal' ? jornal(v, true) : ''}
    </div>`
  }

  function ranking(v) {
    const ordem = v.jogadores.map((j, i) => i).sort((a, b) => v.jogadores[b].pat - v.jogadores[a].pat)
    return `<ol class="bo-rank">${ordem.map((i) => { const j = v.jogadores[i]; return `<li style="${cor(i)}"><span>${esc(j.nome)}${j.pego ? ' <em>Skrull!</em>' : ''}</span><b>${din(j.pat)}</b></li>` }).join('')}</ol>`
  }

  function grafico(vals, w, h) {
    if (vals.length < 2) return ''
    const max = Math.max(...vals)
    const min = Math.min(...vals)
    const pts = vals.map((x, i) => `${(i / (vals.length - 1)) * w},${h - 2 - ((x - min) / Math.max(1, max - min)) * (h - 4)}`).join(' ')
    return `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="2" vector-effect="non-scaling-stroke"/>`
  }

  // ---------- Clarim Diário ----------
  function jornal(v, grande) {
    const J = v.jornal
    if (!J) return ''
    // cada manchete mostra só o efeito dela; o fechamento junta tudo no fim
    const efeito = (x) => (x.a >= 0 ? `<span class="bo-muda ${lado(x.d)}">${esc(v.acoes[x.a].t)} ${sinal(x.d)}</span>`
      : x.a === -1 ? `<span class="bo-muda ${lado(x.d)}">todas ${sinal(x.d)}</span>`
      : x.mud.map((m) => `<span class="bo-muda cai">${esc(v.acoes[m.a].t)} ÷2</span>`).join(''))
    const fecha = v.acoes.map((ac, a) => `<span class="bo-muda ${lado(J.depois[a] - J.antes[a])}">${esc(ac.t)} ${J.antes[a]}→${J.depois[a]}</span>`).join('')
    const meu = v.eu >= 0 ? J.ganhos[v.eu] : null
    return `<div class="bo-jornal${grande ? ' grande' : ''}" role="dialog" aria-label="Clarim Diário">
      <div class="bo-papel">
        <header><b>Clarim Diário</b><small>edição extra · rodada ${J.rodada} de ${v.total}</small></header>
        <ol class="bo-manchetes">${J.itens.map((x, k) => `<li style="--k:${k}"><h3>${esc(x.txt)}</h3>${efeito(x)}</li>`).join('')}</ol>
        <div class="bo-fecha" style="--k:${J.itens.length}"><span class="lbl">Fechamento</span><div>${fecha}</div></div>
        ${J.boatos.length ? `<div class="bo-boatos" style="--k:${J.itens.length + 1}"><span class="lbl">Boatos desta rodada</span>${J.boatos.map((b) =>
          `<p>"${esc(v.acoes[b.a].t)} vai ${b.sobe ? 'subir' : 'cair'}": ${b.verdade ? 'e não é que era verdade?' : '<b>MENTIRA</b>'}</p>`).join('')}</div>` : ''}
        ${J.bolhas.length ? `<p class="bo-murcha" style="--k:${J.itens.length + 1}">No fechamento ${J.bolhas.map((b) => `${chip(v.acoes[b.a])} ${b.de > b.para ? 'murchou' : 'voltou'} de ${din(b.de)} pra ${din(b.para)}`).join(', ')}.</p>` : ''}
        ${meu !== null ? `<p class="bo-meu ${lado(meu)}" style="--k:${J.itens.length + 2}">Sua rodada: <b>${meu >= 0 ? '+' : ''}${din(meu)}</b></p>` : ''}
        ${grande ? `<div style="--k:${J.itens.length + 2}" class="bo-jr-rank">${ranking(v)}</div>` : ''}
      </div>
    </div>`
  }

  // ---------- fim ----------
  function fim(v, ui) {
    const ordem = v.jogadores.map((j, i) => i).sort((a, b) => v.jogadores[b].pat - v.jogadores[a].pat)
    const w = ordem[0]
    const sk = v.jogadores.findIndex((j) => j.skrull)
    const max = Math.max(...v.jogadores.flatMap((j) => j.hist))
    const min = Math.min(0, ...v.jogadores.flatMap((j) => j.hist))
    const linhas = v.jogadores.map((j, i) => `<g style="color: var(--c${i % 10})">${escala(j.hist, max, min)}</g>`).join('')
    return `<section class="bo-fim">
      <div class="panel bo-fim-box" style="${cor(w)}">
        <span class="lbl">Fechou a bolsa</span>
        <h2>${esc(v.jogadores[w].nome)} venceu a bolsa!</h2>
        ${sk >= 0 ? `<p class="bo-revela">O Skrull era <b style="color: var(--c${sk % 10})">${esc(v.jogadores[sk].nome)}</b>${v.jogadores[sk].pego ? ' (e foi pego)' : ' e ninguém pegou!'}</p>` : ''}
        <svg class="bo-evolucao" viewBox="0 0 300 120" preserveAspectRatio="none" aria-label="Patrimônio de cada um, rodada a rodada">${linhas}</svg>
        <ol class="bo-rank">${ordem.map((i) => `<li style="${cor(i)}"><span>${esc(v.jogadores[i].nome)}</span><b>${din(v.jogadores[i].pat)}</b></li>`).join('')}</ol>
        <div class="bo-premios">${v.premios.map((p) => `<p><span class="lbl">${esc(p.titulo)}</span> ${esc(p.nome)} <small>${esc(p.txt)}</small></p>`).join('')}</div>
        <div class="online-row">${ui.dono ? '<button class="btn big" type="button" data-b="denovo">Jogar de novo</button><button class="btn paper" type="button" data-b="sala">Voltar pra sala</button>' : ''}
          <button class="linkish" type="button" data-b="sair">sair</button></div>
      </div>
    </section>`
  }
  // todos os jogadores no mesmo eixo (senão cada linha teria a própria escala)
  function escala(vals, max, min) {
    if (vals.length < 2) return ''
    const pts = vals.map((x, i) => `${(i / (vals.length - 1)) * 300},${118 - ((x - min) / Math.max(1, max - min)) * 116}`).join(' ')
    return `<polyline points="${pts}" fill="none" stroke="currentColor" stroke-width="3" vector-effect="non-scaling-stroke"/>`
  }

  // ---------- números ao vivo ----------
  function atualizar(v, raiz) {
    const um = (sel, f) => raiz.querySelectorAll(sel).forEach(f)
    const fita = v.fita.slice(-7).reverse().map((f) => `<li style="${cor(f.j)}"><b>${esc(v.jogadores[f.j].nome)}</b> ${f.c ? 'comprou' : 'vendeu'} ${esc(v.acoes[f.a].t)} <span>${din(f.p)}</span></li>`).join('')
    um('[data-x="fita"]', (el) => { el.innerHTML = fita || '<li class="vazia">ninguém negociou ainda</li>' })
    um('[data-x="fase"]', (el) => { el.textContent = faseTxt(v) })
    v.acoes.forEach((ac, a) => {
      um(`[data-a="${a}"]`, (el) => {
        const px = el.querySelector('[data-x="px"]')
        const antes = Number(el.dataset.px || ac.preco)
        if (px) px.textContent = din(ac.preco)
        const va = el.querySelector('[data-x="var"]')
        if (va) { va.textContent = sinal(ac.preco - ac.abre); va.className = lado(ac.preco - ac.abre) }
        if (antes !== ac.preco) { el.classList.remove('pisca-sobe', 'pisca-cai'); void el.offsetWidth; el.classList.add(ac.preco > antes ? 'pisca-sobe' : 'pisca-cai') }
        el.dataset.px = ac.preco
        if (!v.meu) return
        const q = v.meu.pos[a]
        el.querySelector('[data-x="pos"]').textContent = q === 0 ? '–' : Math.abs(q)
        el.querySelector('[data-x="posl"]').textContent = q > 0 ? 'suas' : q < 0 ? 'na queda' : ''
        el.classList.toggle('tenho', q > 0)
        el.classList.toggle('queda', q < 0)
        el.querySelector('[data-x="pv"]').textContent = din(Math.max(1, ac.preco - 1))
        el.querySelector('[data-x="pc"]').textContent = din(ac.preco)
        const aberto = v.fase === 'pregao'
        el.querySelector('.vende').disabled = !aberto || q <= -5
        el.querySelector('.compra').disabled = !aberto || v.meu.caixa < ac.preco || q >= 20
      })
    })
    if (v.meu) {
      um('[data-x="caixa"]', (el) => { el.textContent = din(v.meu.caixa) })
      um('[data-x="pat"]', (el) => { el.textContent = din(v.meu.pat) })
    }
  }

  // aviso da denúncia: primeiro o suspense, depois o resultado
  function denuncia(v, av) {
    const q = v.jogadores[av.quem].nome
    const a = v.jogadores[av.alvo].nome
    return `<div class="bo-denuncia${av.certo ? ' certo' : ''}" role="alert"><div>
      <span class="lbl">denúncia!</span><p><b>${esc(q)}</b> acusou <b>${esc(a)}</b> de ser o Skrull…</p>
      <h3>${av.certo ? 'ERA O SKRULL!' : 'Era inocente.'}</h3>
      <small>${av.certo ? `${esc(a)} perdeu metade de tudo. ${esc(q)} ganhou ${din(20)}.` : `${esc(q)} pagou ${din(20)} pra ${esc(a)}.`}</small></div></div>`
  }

  window.BolsaTelas = { entrada, sala, jogo, telao, fim, atualizar, denuncia, din }
})()
