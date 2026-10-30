// Agentes da S.H.I.E.L.D. online: quem cria a sala escolhe o modo e começa. Cada um escolhe seu time e papel.
// O anfitrião guarda o jogo e manda pra cada um só o que ele pode ver: o Diretor recebe o mapa secreto,
// os agentes só veem de quem é cada capa depois que ela é aberta.
(function () {
  const S = window.Shield
  const R = S._
  const { esc, NOME } = R
  const el = document.getElementById('shield')
  const sala = window.Sala.nova({ prefixo: 'mvshield-v1-', chave: 'mvd-sala-shield' })
  const ERROS = {
    servidor: 'Sem conexão com o servidor da sala. Confere a internet.', codigo: 'O código tem 4 letras ou números.',
    naoAchei: 'Não achei essa sala. Confere o código com quem criou.', cheia: 'Essa sala está cheia (12 jogadores).',
    naoConectou: 'Não conectou. Confere o código e se quem criou a sala está com o site aberto.', caiu: 'A sala fechou ou a conexão caiu.',
  }
  const guarda = (k, v) => { try { if (v === undefined) return localStorage.getItem(k) || ''; localStorage.setItem(k, v) } catch (e) { return '' } }
  const meuNome = () => guarda('mvd-imp-nome')
  const MEU_ID = (() => {
    let v = ''
    try { v = sessionStorage.getItem('mvd-shield-id') || '' } catch (e) {}
    if (!v) { v = Math.random().toString(36).slice(2, 10); try { sessionStorage.setItem('mvd-shield-id', v) } catch (e) {} }
    return v
  })()

  let H = null        // anfitrião: { jogadores: [{ id, conn, nome, time, papel, on }], G, fase, modo }
  let V = null        // a visão que este aparelho desenha
  let erro = ''
  let num = 2
  let palavra = ''
  const souDono = () => sala.st.status === 'hosting' && !!H

  // ---------- sala ----------
  sala.aoStatus = (st) => {
    if (st.status === 'off') { H = null; V = null; erro = st.erro ? ERROS[st.erro] || ERROS.caiu : '' }
    if (st.status === 'hosting' && !H) H = { jogadores: [{ id: MEU_ID, conn: null, nome: meuNome(), time: 'v', papel: 'diretor', on: true }], G: null, fase: 'lobby', modo: 'times' }
    if (st.status === 'connected') sala.enviar({ type: 'oi', id: MEU_ID, nome: meuNome() })
    S.render()
  }
  sala.aoDados = (msg, de) => {
    if (!msg || typeof msg !== 'object') return
    if (de === 'host') {
      if (msg.type === 'cheia') { sala.sair(); erro = ERROS.cheia; S.render(); return }
      if (msg.type === 'visao' && msg.v) { const antes = V; V = msg.v; efeitos(antes, V); redesenhar() }
      return
    }
    if (!H) return
    if (msg.type === 'oi') {
      const id = String(msg.id || '').slice(0, 20)
      let j = H.jogadores.find((x) => x.id === id)
      if (!j) {
        if (!id || H.jogadores.length >= 12) { sala.enviar({ type: 'cheia' }, de); setTimeout(() => sala.fechar(de), 300); return }
        j = { id, conn: de, nome: '', on: true, ...lugarLivre() }
        H.jogadores.push(j)
      }
      Object.assign(j, { conn: de, on: true, nome: String(msg.nome || '').trim().slice(0, 14) || j.nome })
      S.render()
      return
    }
    const j = H.jogadores.find((x) => x.conn === de)
    if (j) acao(j, msg)
  }
  sala.aoSair = (de) => {
    if (!H) return
    const j = H.jogadores.find((x) => x.conn === de)
    if (!j) return
    j.on = false
    j.conn = null
    if (H.fase === 'lobby') H.jogadores = H.jogadores.filter((x) => x !== j)
    S.render()
  }

  // quem chega entra no time com menos gente; vira Diretor se o time ainda não tem
  function lugarLivre() {
    const on = H.jogadores.filter((x) => x.on)
    if (H.modo === 'coop') return { time: 'v', papel: on.some((x) => x.papel === 'diretor') ? 'agente' : 'diretor' }
    const n = (t) => on.filter((x) => x.time === t).length
    const time = n('v') <= n('a') ? 'v' : 'a'
    return { time, papel: on.some((x) => x.time === time && x.papel === 'diretor') ? 'agente' : 'diretor' }
  }

  // ---------- o jogo (só no anfitrião) ----------
  const ativos = () => H.jogadores.filter((x) => x.on)
  function faltaPraComecar() {
    const on = ativos()
    if (H.modo === 'coop') {
      if (on.filter((x) => x.papel === 'diretor').length !== 1) return 'Precisa de 1 Diretor.'
      if (!on.some((x) => x.papel === 'agente')) return 'Precisa de pelo menos 1 agente.'
      return ''
    }
    for (const t of ['v', 'a']) {
      if (on.filter((x) => x.time === t && x.papel === 'diretor').length !== 1) return `O time ${NOME[t]} precisa de 1 Diretor.`
      if (!on.some((x) => x.time === t && x.papel === 'agente')) return `O time ${NOME[t]} precisa de pelo menos 1 agente.`
    }
    return ''
  }
  // de quem é a vez: o Diretor dá a dica, os agentes do time tocam
  const ehDiretorDaVez = (j) => H.G && j.papel === 'diretor' && (H.G.modo === 'coop' || j.time === H.G.vez)
  const ehAgenteDaVez = (j) => H.G && j.papel === 'agente' && (H.G.modo === 'coop' || j.time === H.G.vez)

  function acao(j, msg) {
    const G = H.G
    if (msg.type === 'nome') j.nome = String(msg.nome || '').trim().slice(0, 14)
    else if (msg.type === 'lugar' && H.fase === 'lobby') {
      const time = msg.time === 'a' ? 'a' : 'v'
      const papel = msg.papel === 'diretor' ? 'diretor' : 'agente'
      // só um Diretor por time: quem era vira agente
      if (papel === 'diretor') ativos().forEach((x) => { if (x !== j && x.papel === 'diretor' && (H.modo === 'coop' || x.time === time)) x.papel = 'agente' })
      Object.assign(j, { time, papel })
    } else if (msg.type === 'dica' && G && !G.fim && ehDiretorDaVez(j)) {
      const n = Math.min(6, Math.max(1, Number(msg.n) || 1))
      if (R.darDica(G, msg.palavra, n)) R.som('bid')
    } else if (msg.type === 'tocar' && G && !G.fim && ehAgenteDaVez(j)) {
      const r = R.tocar(G, Number(msg.i))
      if (r) somDoResultado(G, r)
    } else if (msg.type === 'passar' && G && ehAgenteDaVez(j)) R.passar(G)
    else return
    S.render()
  }

  function somDoResultado(G, r) {
    R.som(r === 'certo' ? 'tick' : r === 'hidra' ? 'hammer' : 'undo')
    if (G.fim) setTimeout(() => R.som(G.fim.vencedor ? 'win' : 'undo'), 300)
  }

  function visao(id) {
    const eu = H.jogadores.find((x) => x.id === id)
    const v = { fase: H.fase, eu: id, dono: MEU_ID, code: sala.st.code, modo: H.modo,
      jogadores: H.jogadores.map((x) => ({ id: x.id, nome: x.nome, time: x.time, papel: x.papel, on: x.on })) }
    const G = H.G
    if (G && H.fase === 'jogo') {
      const mapa = !!G.fim || (eu && eu.papel === 'diretor')
      v.G = { ...G, cartas: G.cartas.map((c) => ({ hq: c.hq, aberta: c.aberta, dono: mapa || c.aberta ? c.dono : 'z' })),
        faltam: { v: R.faltam(G, 'v'), a: R.faltam(G, 'a'), g: R.faltam(G, 'g') } }
    }
    return v
  }

  // ---------- telas ----------
  function redesenhar() {
    const a = document.activeElement
    const id = a && a.id
    let pos = null
    try { pos = a.selectionStart } catch (e) {}
    S.render()
    const n = id && document.getElementById(id)
    if (n && n !== document.activeElement && n.tagName === 'INPUT') { n.focus(); try { if (pos != null) n.setSelectionRange(pos, pos) } catch (e) {} }
  }
  function efeitos(antes, depois) {
    if (!depois.G) return
    if (!antes || !antes.G) { R.som('draw'); window.scrollTo(0, 0); return }
    const u = depois.G.ultimo
    const ua = antes.G.ultimo
    if (u && (!ua || ua.i !== u.i || ua.r !== u.r)) somDoResultado(depois.G, u.r)
  }

  const nomeDe = (id) => { const k = V.jogadores.findIndex((x) => x.id === id); const j = V.jogadores[k]; return (j && j.nome) || `Jogador ${k + 1}` }
  const euJ = () => V.jogadores.find((x) => x.id === V.eu) || {}
  const papelTxt = (j) => (V.modo === 'coop' ? (j.papel === 'diretor' ? 'Diretor' : 'Agente') : `${j.papel === 'diretor' ? 'Diretor' : 'Agente'} · ${NOME[j.time]}`)

  function topo(texto) {
    return `<div class="imp-topo"><span class="hint">${esc(texto)}</span>
      <button class="linkish" type="button" data-so="sair">${souDono() ? 'Fechar a sala' : 'Sair da sala'}</button></div>`
  }

  function listaJogadores() {
    const grupo = (t, titulo) => `<div class="sh-time" style="--cor:${R.corTime(t)}"><span class="lbl">${titulo}</span><ol class="imp-sala">${V.jogadores
      .filter((j) => V.modo === 'coop' || j.time === t).map((j, i) => `<li class="${j.on ? '' : 'fora'}" style="--cor:${R.corTime(V.modo === 'coop' ? 'g' : j.time)}">
        <span>${esc(nomeDe(j.id))}</span><small>${[j.papel === 'diretor' ? 'Diretor' : 'agente', j.id === V.eu ? 'você' : '', !j.on ? 'caiu' : ''].filter(Boolean).join(' · ')}</small></li>`).join('')}</ol></div>`
    return V.modo === 'coop' ? grupo('g', 'Time S.H.I.E.L.D.') : grupo('v', 'Time Vermelho') + grupo('a', 'Time Azul')
  }

  function telaSala() {
    const eu = euJ()
    const lugares = V.modo === 'coop' ? [['v', 'diretor', 'Diretor'], ['v', 'agente', 'Agente']]
      : [['v', 'diretor', 'Diretor · Vermelho'], ['v', 'agente', 'Agente · Vermelho'], ['a', 'diretor', 'Diretor · Azul'], ['a', 'agente', 'Agente · Azul']]
    const botoesLugar = lugares.map(([t, p, txt]) => `<button class="preset" type="button" data-so="lugar" data-t="${t}" data-p="${p}"
      aria-pressed="${eu.papel === p && (V.modo === 'coop' || eu.time === t)}">${txt}</button>`).join('')
    const modo = souDono()
      ? `<div class="modes">${[['times', 'Times', '4 ou mais'], ['coop', 'Cooperativo', '2 ou 3']].map(([v, t, s]) =>
          `<button class="mode" type="button" data-so="modo" data-v="${v}" aria-pressed="${V.modo === v}"><b>${t}</b><small>${s}</small></button>`).join('')}</div>`
      : `<p><b>${V.modo === 'coop' ? 'Cooperativo' : 'Times'}</b></p>`
    const falta = souDono() ? faltaPraComecar() : ''
    const go = souDono() ? `${falta ? `<span class="lbl">${falta}</span>` : ''}<button class="btn big" type="button" data-so="comecar"${falta ? ' disabled' : ''}>Começar</button>`
      : `<p class="hint">Esperando ${esc(nomeDe(V.dono))} começar…</p>`
    return `<section class="setup sh">
      ${topo(`Sala ${V.code} · ${V.jogadores.filter((j) => j.on).length} na sala`)}
      <div class="setup-grid">
        <div class="panel rules"><h2>Modo</h2>${modo}<div class="field"><span class="lbl">Como jogar</span>${R.COMO}</div></div>
        <div class="panel">
          <h2>Sala ${esc(V.code)}</h2>
          ${souDono() ? `<b class="code">${esc(V.code)}</b><div class="online-row"><button class="btn paper" type="button" data-so="convite">Copiar convite</button></div>
            <p class="note" id="sh-convidado" role="status"></p>` : ''}
          <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="sh-meu-nome" maxlength="14" autocomplete="off" value="${esc(meuNome())}"></label>
          <div class="field"><span class="lbl">Seu lugar</span><div class="presets">${botoesLugar}</div></div>
          ${listaJogadores()}
        </div>
      </div>
      <div class="go-row">${go}</div>
    </section>`
  }

  function telaJogo() {
    const G = V.G
    const eu = euJ()
    const minhaVez = G.modo === 'coop' || eu.time === G.vez
    const diretor = eu.papel === 'diretor'
    const espera = G.modo === 'coop' ? 'Esperando o Diretor dar a dica…' : `Esperando o Diretor do time ${NOME[G.vez]} dar a dica…`
    const painel = R.painelDica(G, { podeDar: diretor && minhaVez, podePassar: !diretor && minhaVez, attr: 'data-so', num, palavra, espera })
    return `<section class="sh-jogo">
      ${topo(`Sala ${V.code} · você: ${papelTxt(eu)}`)}
      ${R.placar(G)}
      <p class="hint sh-vez" style="--cor:${G.modo === 'times' ? R.corTime(G.vez) : R.corTime('g')}">Vez do ${R.quemJoga(G)}</p>
      <div class="sh-mesa">
        ${R.grade(G, diretor, !diretor && minhaVez && !!G.dica, 'data-so')}
        <div class="sh-lado">${R.aviso(G)}${painel}${diretor ? '<p class="note">Você é o Diretor: as cores mostram de quem é cada capa. Não conte pros agentes!</p>' : ''}
          <div class="panel">${listaJogadores()}</div></div>
      </div>
    </section>`
  }

  function tela() {
    if (souDono()) V = visao(MEU_ID)
    if (!V) return `<section class="sh-jogo"><p class="hint">Entrando na sala ${esc(sala.st.code)}…</p></section>`
    if (V.fase === 'lobby' || !V.G) return telaSala()
    if (V.G.fim) {
      return topo(`Sala ${V.code}`) + R.telaFim(V.G, souDono()
        ? `<button class="btn paper" type="button" data-so="lobby">Voltar pra sala</button><button class="btn big" type="button" data-so="comecar">Jogar de novo</button>`
        : `<p class="hint">Esperando ${esc(nomeDe(V.dono))} começar outra partida…</p>`)
    }
    return telaJogo()
  }

  // o anfitrião manda a visão de cada um depois de desenhar
  function depois() {
    if (!souDono()) return
    for (const j of H.jogadores) if (j.conn) sala.enviar({ type: 'visao', v: visao(j.id) }, j.conn)
  }

  function caixa() {
    const st = sala.st
    const cancelar = '<button class="linkish" type="button" data-so="sair">Cancelar</button>'
    if (st.status === 'creating') return `<h2>Jogar online</h2><p>Criando a sala…</p>${cancelar}`
    if (st.status === 'joining') return `<h2>Jogar online</h2><p>Entrando na sala ${esc(st.code)}…</p>${cancelar}`
    return `<h2>Jogar online</h2><p class="note">Cada um no seu celular ou computador. Ninguém precisa de conta.</p>${erro ? `<p class="neterr">${esc(erro)}</p>` : ''}
      <label class="imp-meu-nome"><span class="lbl">Seu nome</span><input id="sh-on-nome" maxlength="14" autocomplete="off" value="${esc(meuNome())}"></label>
      <div class="online-row"><button class="btn green" type="button" data-so="criar">Criar sala</button><span class="lbl">ou</span>
        <input id="sh-on-codigo" maxlength="4" autocomplete="off" placeholder="CÓDIGO" aria-label="Código da sala" value="${esc(st.code)}">
        <button class="btn paper" type="button" data-so="entrar">Entrar</button></div>`
  }

  // ---------- cliques e digitação ----------
  // no anfitrião, as ações dele passam pelo mesmo caminho das mensagens dos convidados
  const mandar = (msg) => { if (souDono()) acao(H.jogadores[0], msg); else sala.enviar(msg) }
  let tNome = 0
  el.addEventListener('input', (ev) => {
    const id = ev.target.id
    if (id === 'sh-palavra' && sala.st.status !== 'off') { palavra = ev.target.value; return }
    if (id !== 'sh-on-nome' && id !== 'sh-meu-nome') return
    guarda('mvd-imp-nome', ev.target.value.trim().slice(0, 14))
    clearTimeout(tNome)
    tNome = setTimeout(() => { if (sala.st.status === 'hosting' || sala.st.status === 'connected') mandar({ type: 'nome', nome: meuNome() }) }, 400)
  })
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-so]')
    if (!b || b.disabled) return
    const a = b.dataset.so
    const v = b.dataset.v
    if (a === 'criar') { erro = ''; sala.criar(); return }
    if (a === 'entrar') { erro = ''; const c = document.getElementById('sh-on-codigo'); sala.entrar(c ? c.value : sala.st.code); return }
    if (a === 'sair') { sala.sair(); erro = ''; window.scrollTo(0, 0); return }
    if (a === 'convite') { convidar(); return }
    if (a === 'num') { num = Math.min(6, Math.max(1, num + Number(v))); redesenhar(); return }
    if (a === 'lugar') { mandar({ type: 'lugar', time: b.dataset.t, papel: b.dataset.p }); return }
    if (a === 'dica') { mandar({ type: 'dica', palavra, n: num }); palavra = ''; num = 2; return }
    if (a === 'tocar') { mandar({ type: 'tocar', i: Number(v) }); return }
    if (a === 'passar') { mandar({ type: 'passar' }); return }
    if (!souDono()) return
    if (a === 'modo') {
      // trocou o modo: redistribui (times: alterna Vermelho/Azul e os dois primeiros viram Diretores; coop: o primeiro é o Diretor)
      H.modo = v === 'coop' ? 'coop' : 'times'
      ativos().forEach((x, i) => Object.assign(x, H.modo === 'coop'
        ? { time: 'v', papel: i === 0 ? 'diretor' : 'agente' }
        : { time: i % 2 ? 'a' : 'v', papel: i < 2 ? 'diretor' : 'agente' }))
    }
    else if (a === 'comecar') { if (faltaPraComecar()) return; H.G = R.novoJogo(H.modo); H.fase = 'jogo'; R.som('draw'); window.scrollTo(0, 0) }
    else if (a === 'lobby') { H.fase = 'lobby'; H.G = null; H.jogadores = ativos() }
    S.render()
  })

  function convidar() {
    const link = location.origin + location.pathname + '#shield-' + sala.st.code
    const text = `Bora jogar Agentes da S.H.I.E.L.D.! Abre esse link que você já entra na minha sala: ${link} (código ${sala.st.code})`
    const out = document.getElementById('sh-convidado')
    const fallback = () => { out.innerHTML = `<textarea class="copybox" readonly rows="3">${esc(text)}</textarea>`; out.querySelector('textarea').select() }
    try { navigator.clipboard.writeText(text).then(() => { out.textContent = 'Convite copiado. É só colar no WhatsApp.' }, fallback) } catch (e) { fallback() }
  }

  window.ShieldOnline = {
    ativo: () => sala.st.status === 'hosting' || sala.st.status === 'connected',
    tela, depois, caixa,
    entrar: (code) => { erro = ''; sala.entrar(code) },
  }
})()
