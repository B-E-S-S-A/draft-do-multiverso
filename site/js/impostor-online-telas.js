// Telas do Impostor online. Recebem um retrato do estado (x) e devolvem o HTML; quem manda no jogo é impostor-online.js.
// x = { V (a visão deste aparelho), N (a conexão), dono (este aparelho criou a sala?), escondida, confirmar, meuNome, restante }
(function () {
  const H = window.Impostor._
  const { C, T, esc, cor } = H

  const lugar = (x, id) => x.V.jogadores.findIndex((j) => j.id === id)
  const nomeDe = (x, id) => { const j = x.V.jogadores.find((k) => k.id === id); return (j && j.nome) || T().jogador(lugar(x, id) + 1) }

  function listaSala(x, marcados) {
    const o = T().on
    const V = x.V
    return `<ol class="imp-sala">${V.jogadores.map((j, i) => {
      const tags = [j.id === V.eu ? o.voce : '', j.id === V.dono ? o.dono : '', !j.on ? o.fora : ''].filter(Boolean)
      const ok = marcados && marcados.includes(j.id) ? ' ok' : ''
      return `<li class="${j.on ? '' : 'fora'}${ok}" style="${cor(i)}"><span>${esc(nomeDe(x, j.id))}</span>${tags.length ? `<small>${tags.join(' · ')}</small>` : ''}</li>`
    }).join('')}</ol>`
  }

  function topo(x, texto) {
    const o = T().on
    return `<div class="imp-topo"><span class="hint">${esc(texto)}</span>
      <button class="linkish" type="button" data-o="sair">${x.dono ? o.fechar : o.sair}</button></div>`
  }

  function placar(x, ganhos) {
    return H.listaPontos(x.V.jogadores.map((j, i) => ({ nome: nomeDe(x, j.id), lugar: i, pontos: x.V.placar[j.id] || 0, ganho: ganhos && ganhos[j.id] })))
  }

  function telaSala(x) {
    const t = T()
    const o = t.on
    const V = x.V
    const n = V.jogadores.filter((j) => j.on).length
    const modo = t.modos.find(([v]) => v === V.cfg.modo) || t.modos[0]
    const resumo = `<p><b>${modo[1]}</b> · ${modo[2]}</p><ul class="how">
      ${V.cfg.votar ? `<li>${t.votar}</li>` : ''}${V.cfg.tempo ? `<li>${t.tempo} · ${t.segundos(V.cfg.segs)}</li>` : ''}</ul>`
    const acao = x.dono
      ? `${n < 3 ? `<span class="lbl">${o.faltam(3 - n)}</span>` : ''}<button class="btn big" type="button" data-o="distribuir"${n < 3 ? ' disabled' : ''}>${t.distribuir}</button>`
      : `<p class="hint">${esc(o.esperandoDono(nomeDe(x, V.dono)))}</p>`
    return `<section class="setup imp">
      ${topo(x, o.sala(V.code) + ' · ' + o.naSala(n))}
      <div class="setup-grid">
        <div class="panel rules">
          <div class="imp-cabeca"><h2>${x.dono ? t.regras : o.regrasSala}</h2>${H.blocoLingua()}</div>
          ${x.dono ? H.blocoModo(n) + H.blocoOpcoes() : resumo}
        </div>
        <div class="panel">
          <h2>${o.sala(V.code)}</h2>
          ${x.dono ? `<b class="code">${esc(V.code)}</b>
            <div class="online-row"><button class="btn paper" type="button" data-o="convite">${o.convite}</button></div>
            <p class="note" id="imp-convidado" role="status"></p>` : ''}
          <label class="imp-meu-nome"><span class="lbl">${o.seuNome}</span>
            <input id="imp-meu-nome" maxlength="14" autocomplete="off" placeholder="${esc(t.jogador(lugar(x, V.eu) + 1))}" value="${esc(x.meuNome)}"></label>
          ${listaSala(x)}
          <p class="note">${o.chamada}</p>
          ${V.placar && Object.keys(V.placar).length ? `<div class="field"><span class="lbl">${t.placar}</span>${placar(x)}</div>` : ''}
        </div>
      </div>
      <div class="go-row">${acao}</div>
    </section>`
  }

  function minhaCarta(x) {
    const o = T().on
    const r = x.V.rodada
    if (!r.participo) return `<div class="panel"><p>${o.proxima}</p></div>`
    return `<div class="panel imp-minha" style="${cor(lugar(x, x.V.eu))}">
      <div class="imp-cabeca"><h2>${o.suaCarta}</h2>
        <button class="btn paper" type="button" data-o="esconder">${x.escondida ? o.mostrar : o.esconder}</button></div>
      <div class="imp-minha-carta"><span class="imp-frente">${x.escondida ? '<span class="imp-verso"><b>?</b></span>' : H.frente(r.carta.key)}</span></div>
    </div>`
  }

  function botaoRevelar(x) {
    const t = T()
    return `<button class="btn big red" type="button" data-o="revelar">${x.confirmar === 'revelar' ? t.revelarDeNovo : t.revelar}</button>`
  }

  function telaRodada(x) {
    const t = T()
    const o = t.on
    const V = x.V
    const r = V.rodada
    const dono = esc(nomeDe(x, V.dono))
    const votar = `<button class="btn big" type="button" data-o="fase" data-v="votos">${t.paraVotar}</button>`
    let meio = ''
    let acao = ''
    if (V.fase === 'cartas') {
      if (x.dono) acao = V.cfg.tempo ? `<button class="btn big green" type="button" data-o="fase" data-v="dicas">${t.paraDicas}</button>` : V.cfg.votar ? votar : botaoRevelar(x)
      else acao = `<p class="hint">${V.cfg.votar || V.cfg.tempo ? o.esperandoDicas(dono) : o.esperandoRevelar(dono)}</p>`
    } else if (V.fase === 'dicas') {
      meio = H.painelDicas(nomeDe(x, r.comeca), lugar(x, r.comeca), x.restante, r.relogio.rodando, x.dono ? 'data-o="relogio"' : '')
      acao = x.dono ? (V.cfg.votar ? votar : botaoRevelar(x)) : `<p class="hint">${o.esperandoDicas(dono)}</p>`
    } else if (V.fase === 'votos') {
      const opcoes = r.ordem.filter((id) => id !== V.eu).map((id) =>
        `<button class="btn imp-alvo" type="button" data-o="votar" data-v="${esc(id)}" style="${cor(lugar(x, id))}">${esc(nomeDe(x, id))}</button>`).join('')
      meio = `<div class="panel imp-voto" style="${cor(lugar(x, V.eu))}">
        ${r.participo && !r.votei ? `<h2>${o.emQuem}</h2><div class="imp-opcoes">${opcoes}</div>` : `<h2>${o.votoOk}</h2>`}
        <p class="imp-passe">${o.votaram(r.votaram.length, r.total)}</p></div>`
      if (x.dono) acao = `<button class="linkish" type="button" data-o="pular">${t.pularVoto}</button>`
    }
    return `<section class="imp-jogo">
      ${topo(x, o.sala(V.code))}
      ${minhaCarta(x)}
      ${meio}
      <div class="panel">${listaSala(x, V.fase === 'votos' ? r.votaram : null)}</div>
      <div class="go-row">${acao}</div>
    </section>`
  }

  function telaFim(x) {
    const t = T()
    const V = x.V
    const r = V.rodada
    const f = r.fim
    const ganhos = {}
    r.ordem.forEach((id, i) => { ganhos[id] = f.ganhos[i] })
    return H.telaRevelacao({
      topo: topo(x, t.on.sala(V.code)),
      nomes: r.ordem.map((id) => nomeDe(x, id)), impostores: f.impostores.map((id) => r.ordem.indexOf(id)),
      comum: f.comum, diferente: f.diferente, fim: f,
      chute: x.dono && !f.diferente && f.pego && f.adivinhou === null && V.cfg.votar ? 'data-o' : '',
      placar: V.placar && !f.semVotos ? placar(x, ganhos) : '',
      botoes: x.dono ? `<button class="btn paper" type="button" data-o="lobby">${t.regras}</button>
        <button class="btn big" type="button" data-o="distribuir">${t.nova}</button>`
        : `<p class="hint">${esc(t.on.esperandoDono(nomeDe(x, V.dono)))}</p>`,
    })
  }

  function tela(x) {
    if (!x.V) return `<section class="imp-jogo"><p class="hint">${T().on.entrando(x.N.code)}</p></section>`
    if (x.V.fase === 'lobby') return telaSala(x)
    if (x.V.fase === 'fim') return telaFim(x)
    return telaRodada(x)
  }

  // caixa "Jogar online" na tela de regras do jogo num aparelho só
  function caixa(x) {
    const o = T().on
    const N = x.N
    const cancelar = `<button class="linkish" type="button" data-o="sair">${C.lingua === 'en' ? 'Cancel' : 'Cancelar'}</button>`
    if (N.status === 'creating') return `<h2>${o.titulo}</h2><p>${o.criando}</p>${cancelar}`
    if (N.status === 'joining') return `<h2>${o.titulo}</h2><p>${o.entrando(N.code)}</p>${cancelar}`
    return `<h2>${o.titulo}</h2><p class="note">${o.sub}</p>${N.erro ? `<p class="neterr">${esc(N.erro)}</p>` : ''}
      <label class="imp-meu-nome"><span class="lbl">${o.seuNome}</span><input id="imp-on-nome" maxlength="14" autocomplete="off" value="${esc(x.meuNome)}"></label>
      <div class="online-row"><button class="btn green" type="button" data-o="criar">${o.criar}</button><span class="lbl">${o.ou}</span>
        <input id="imp-on-codigo" maxlength="4" autocomplete="off" placeholder="${o.codigo}" aria-label="${o.codigo}" value="${esc(N.code)}">
        <button class="btn paper" type="button" data-o="entrar">${o.entrar}</button></div>`
  }

  window.ImpostorOnlineTelas = { tela, caixa }
})()
