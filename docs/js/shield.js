// Agentes da S.H.I.E.L.D.: 16 capas na mesa. Só o Diretor sabe quem é de qual time (o "mapa secreto").
// Ele dá UMA palavra e um número ("Asgard, 3") e os agentes do time tentam achar esses personagens.
// Modo times: Vermelho x Azul (6 x 5 personagens, 4 civis e 1 agente da HIDRA, que faz perder na hora).
// Modo cooperativo: todos juntos acham 7 agentes em até 5 dicas, sem tocar na HIDRA.
// Este arquivo tem as regras, as peças de tela e o jogo num aparelho só; o online fica em shield-online.js.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const X = window.Sfx
  const el = document.getElementById('shield')
  const esc = V.esc
  const SAVE = 'mvd-shield'
  const NOME = { v: 'Vermelho', a: 'Azul', c: 'Civil', x: 'HIDRA', g: 'Agente' }
  const outro = (t) => (t === 'v' ? 'a' : 'v')
  const som = (f) => { if (X && X.on) X[f]() }

  const C = { modo: 'times' }
  try { Object.assign(C, JSON.parse(localStorage.getItem(SAVE) || '{}')) } catch (e) {}
  const salvar = () => { try { localStorage.setItem(SAVE, JSON.stringify(C)) } catch (e) {} }

  // ---------- regras ----------
  function novoJogo(modo) {
    const pers = E.shuffle(D.hq.map((_, i) => i)).slice(0, 16)
    let donos
    let vez = null
    if (modo === 'times') {
      vez = Math.random() < 0.5 ? 'v' : 'a'
      donos = [...Array(6).fill(vez), ...Array(5).fill(outro(vez)), ...Array(4).fill('c'), 'x']
    } else {
      donos = [...Array(7).fill('g'), ...Array(8).fill('c'), 'x']
    }
    donos = E.shuffle(donos)
    return { modo, cartas: pers.map((hq, i) => ({ hq, dono: donos[i], aberta: false })), vez, dica: null, fim: null, dicas: 0, maxDicas: 5, ultimo: null }
  }
  const faltam = (G, dono) => G.cartas.filter((c) => c.dono === dono && !c.aberta).length

  function darDica(G, palavra, n) {
    if (G.fim || G.dica) return false
    G.dica = { palavra: String(palavra || '').trim().slice(0, 20), n, palpites: n + 1, feitos: 0 }
    G.dicas += 1
    G.ultimo = null
    return true
  }

  function acabarDica(G) {
    G.dica = null
    if (G.modo === 'times') G.vez = outro(G.vez)
    else if (G.dicas >= G.maxDicas && !G.fim) G.fim = { vencedor: null, motivo: 'tempo' }
  }

  // toca numa capa. Devolve o que aconteceu: 'certo' | 'outro' | 'civil' | 'hidra'
  function tocar(G, i) {
    const c = G.cartas[i]
    if (!G.dica || G.fim || !c || c.aberta) return null
    c.aberta = true
    G.dica.feitos += 1
    const time = G.modo === 'times' ? G.vez : 'g'
    let r
    if (c.dono === 'x') {
      r = 'hidra'
      G.fim = { vencedor: G.modo === 'times' ? outro(G.vez) : null, motivo: 'hidra' }
    } else if (c.dono === time) {
      r = 'certo'
      G.dica.palpites -= 1
      if (faltam(G, time) === 0) G.fim = { vencedor: G.modo === 'times' ? time : 'g', motivo: 'todos' }
      else if (G.dica.palpites <= 0) acabarDica(G)
    } else if (G.modo === 'times' && c.dono === outro(G.vez)) {
      r = 'outro'
      if (faltam(G, outro(G.vez)) === 0) G.fim = { vencedor: outro(G.vez), motivo: 'todos' }
      else acabarDica(G)
    } else {
      r = 'civil'
      acabarDica(G)
    }
    G.ultimo = { i, r, time }
    return r
  }

  function passar(G) {
    if (!G.dica || G.fim || G.dica.feitos < 1) return false
    acabarDica(G)
    G.ultimo = null
    return true
  }

  // ---------- peças de tela (também usadas no online) ----------
  const corTime = (t) => (t === 'v' ? 'var(--p1)' : t === 'a' ? 'var(--p2)' : 'var(--banca)')

  // mapa = mostrar de quem é cada capa fechada (só o Diretor vê)
  function grade(G, mapa, clicavel, attr = 'data-s') {
    return `<div class="sh-grade${mapa ? ' mapa' : ''}">${G.cartas.map((c, i) => {
      const lot = E.lotOf('hq:' + c.hq)
      const pode = clicavel && !c.aberta
      return `<button class="sh-carta dono-${c.dono}${c.aberta ? ' aberta' : ''}" type="button" ${attr}="tocar" data-v="${i}"${pode ? '' : ' disabled'}>
        ${V.cover(lot)}<span class="sh-nome">${esc(lot.n)}</span>
        <span class="sh-marca">${NOME[c.dono]}</span></button>`
    }).join('')}</div>`
  }

  function placar(G) {
    // no online os agentes não sabem de quem são as capas fechadas: o anfitrião manda as contas prontas
    const f = (d) => (G.faltam ? G.faltam[d] : faltam(G, d))
    if (G.modo === 'times') {
      return `<div class="sh-placar"><span style="--cor: var(--p1)">Vermelho <b>${f('v')}</b></span>
        <span style="--cor: var(--p2)">Azul <b>${f('a')}</b></span><small>faltam achar</small></div>`
    }
    return `<div class="sh-placar"><span style="--cor: var(--banca)">Agentes <b>${f('g')}</b></span>
      <span style="--cor: var(--ink)">Dicas <b>${G.maxDicas - G.dicas}</b></span><small>faltam</small></div>`
  }

  function quemJoga(G) {
    if (G.modo !== 'times') return 'Time S.H.I.E.L.D.'
    return `Time ${NOME[G.vez]}`
  }

  const RESULTADO = {
    certo: 'Acertou! Pode tentar mais um.',
    outro: 'Era do outro time! A vez passou.',
    civil: 'Era um civil. A vez passou.',
    hidra: 'Era o agente da HIDRA!',
  }
  function aviso(G) {
    if (!G.ultimo) return ''
    const r = G.ultimo.r
    const fimDaVez = r !== 'certo' || !G.dica
    const msg = r === 'certo' && !G.dica && !G.fim ? 'Acertou! Acabaram os palpites desta dica.'
      : r === 'civil' && G.modo !== 'times' ? 'Era um civil. Essa dica acabou.' : RESULTADO[r]
    return `<p class="sh-aviso ${r}${fimDaVez ? ' fim' : ''}">${msg}</p>`
  }

  function textoFim(G) {
    const f = G.fim
    if (G.modo === 'times') {
      const como = f.motivo === 'hidra' ? `O time ${NOME[outro(f.vencedor)]} tocou no agente da HIDRA.` : 'Acharam todos os seus personagens.'
      return { titulo: `Time ${NOME[f.vencedor]} venceu!`, sub: como, cor: corTime(f.vencedor) }
    }
    if (f.vencedor === 'g') return { titulo: 'Missão cumprida!', sub: `Acharam os 7 agentes usando ${G.dicas} ${G.dicas === 1 ? 'dica' : 'dicas'}.`, cor: corTime('g') }
    return { titulo: 'Missão fracassada', sub: f.motivo === 'hidra' ? 'Vocês tocaram no agente da HIDRA.' : 'Acabaram as 5 dicas.', cor: 'var(--ink)' }
  }

  const COMO = `<ol class="how">
    <li><b>Times:</b> dois times, Vermelho e Azul. Cada time escolhe um <b>Diretor</b>; o resto são agentes.</li>
    <li>Só os Diretores veem o <b>mapa secreto</b>: quais capas são do Vermelho, do Azul, civis e qual é o <b>agente da HIDRA</b>.</li>
    <li>Na vez do seu time, o Diretor fala <b>uma palavra e um número</b>. Ex.: "Asgard, 3" quer dizer que 3 personagens do time têm a ver com Asgard.</li>
    <li>Os agentes conversam e tocam nas capas. Capa do time: continua (até número + 1). Civil ou do outro time: a vez passa. <b>HIDRA: perdem na hora.</b></li>
    <li>Ganha o time que achar todos os seus personagens primeiro.</li>
    <li><b>Cooperativo (2 ou 3):</b> um é o Diretor e os outros adivinham. Juntos, achem os 7 agentes em até 5 dicas.</li>
  </ol>`

  // ---------- jogo num aparelho só ----------
  let G = null
  let tela = 'regras'
  let num = 2
  let palavra = ''
  let confirmar = null

  function telaRegras() {
    const escolha = (v, t, s) => `<button class="mode" type="button" data-s="modo" data-v="${v}" aria-pressed="${C.modo === v}"><b>${t}</b><small>${s}</small></button>`
    const online = window.ShieldOnline ? `<div class="panel">${window.ShieldOnline.caixa()}</div>` : ''
    return `<section class="setup sh">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Regras</h2>
          <div class="field"><span class="lbl">Modo</span><div class="modes">
            ${escolha('times', 'Times', '4 ou mais · Vermelho x Azul')}
            ${escolha('coop', 'Cooperativo', '2 ou 3 · todos juntos')}
          </div></div>
          <div class="field"><span class="lbl">Como jogar</span>${COMO}</div>
        </div>
        <div class="imp-coluna">${online}</div>
      </div>
      <div class="go-row"><span class="lbl">Num aparelho só: todo mundo olha a mesma tela</span>
        <button class="btn big" type="button" data-s="comecar">Começar</button></div>
    </section>`
  }

  // painel da dica: sem dica, o Diretor espia o mapa e dá a dica; com dica, mostra a dica e os palpites
  // o = { podeDar, podePassar, attr, num, palavra, espera } (espera = texto pra quem não é o Diretor)
  function painelDica(G, o) {
    const attr = o.attr || 'data-s'
    const num = o.num
    if (G.dica) {
      const d = G.dica
      return `<div class="panel sh-dica"><span class="lbl">Dica do Diretor</span>
        <p class="sh-palavra">${esc(d.palavra || '(falada)')} <b>${d.n}</b></p>
        <p>Pode tocar em mais <b>${d.palpites}</b> ${d.palpites === 1 ? 'capa' : 'capas'}.</p>
        ${o.podePassar && d.feitos > 0 ? `<button class="btn paper" type="button" ${attr}="passar">Passar a vez</button>` : ''}</div>`
    }
    if (!o.podeDar) return o.espera ? `<div class="panel sh-dica"><span class="lbl">Vez do Diretor</span><p>${o.espera}</p></div>` : ''
    return `<div class="panel sh-dica"><span class="lbl">Vez do Diretor</span>
      <p>Pense numa palavra que liga alguns personagens do seu time e diga quantos são.</p>
      <div class="sh-dar">
        <input id="sh-palavra" maxlength="20" autocomplete="off" placeholder="palavra (opcional)" aria-label="Palavra da dica" value="${esc(o.palavra || '')}">
        <div class="stepper">
          <button class="btn paper step" type="button" ${attr}="num" data-v="-1" aria-label="Menos"${num <= 1 ? ' disabled' : ''}>−</button>
          <b class="imp-n" id="sh-num">${num}</b>
          <button class="btn paper step" type="button" ${attr}="num" data-v="1" aria-label="Mais"${num >= 6 ? ' disabled' : ''}>+</button>
        </div>
        <button class="btn" type="button" ${attr}="dica">Dar dica</button>
      </div></div>`
  }

  function telaJogo() {
    const espiar = !G.dica ? `<button class="btn green sh-espiar" type="button" id="sh-espiar">Mapa secreto · segure pra ver</button>
      <p class="note">Só o Diretor olha. Os outros viram o rosto.</p>` : ''
    return `<section class="sh-jogo">
      <div class="imp-topo"><span class="hint" style="--cor:${G.modo === 'times' ? corTime(G.vez) : corTime('g')}">${quemJoga(G)}</span>
        <button class="linkish" type="button" data-s="regras">Regras</button></div>
      ${placar(G)}
      <div class="sh-mesa">
        ${grade(G, false, !!G.dica)}
        <div class="sh-lado">${aviso(G)}${painelDica(G, { podeDar: true, podePassar: true, num, palavra })}${espiar}
          <button class="linkish" type="button" data-s="desistir">${confirmar === 'desistir' ? 'Toque de novo pra encerrar' : 'Encerrar partida'}</button></div>
      </div>
    </section>`
  }

  function telaFim(G, botoes) {
    const f = textoFim(G)
    return `<section class="sh-jogo">
      <div class="panel sh-final" style="--cor:${f.cor}"><h2>${f.titulo}</h2><p>${f.sub}</p></div>
      ${grade({ ...G, cartas: G.cartas.map((c) => ({ ...c })) }, true, false)}
      <div class="go-row">${botoes}</div>
    </section>`
  }

  function render() {
    if (window.ShieldOnline && window.ShieldOnline.ativo()) { el.innerHTML = window.ShieldOnline.tela(); window.ShieldOnline.depois(); return }
    if (tela !== 'regras' && !G) tela = 'regras'
    if (tela === 'regras') el.innerHTML = telaRegras()
    else if (G.fim) el.innerHTML = telaFim(G, `<button class="btn paper" type="button" data-s="regras">Regras</button>
      <button class="btn big" type="button" data-s="comecar">Jogar de novo</button>`)
    else el.innerHTML = telaJogo()
  }

  function depoisDeTocar(r) {
    som(r === 'certo' ? 'tick' : r === 'hidra' ? 'hammer' : 'undo')
    if (G.fim) setTimeout(() => som(G.fim.vencedor ? 'win' : 'undo'), 300)
  }

  const acoes = {
    modo: (v) => { C.modo = v; salvar() },
    comecar: () => { G = novoJogo(C.modo); tela = 'jogo'; num = 2; som('draw'); window.scrollTo(0, 0) },
    regras: () => { tela = 'regras' },
    num: (v) => { num = Math.min(6, Math.max(1, num + Number(v))) },
    dica: () => { if (darDica(G, palavra, num)) { palavra = ''; num = 2; som('bid') } },
    tocar: (v) => { const r = tocar(G, Number(v)); if (r) depoisDeTocar(r) },
    passar: () => { passar(G) },
    desistir: () => {
      if (confirmar !== 'desistir') { confirmar = 'desistir'; return }
      confirmar = null
      G = null
      tela = 'regras'
    },
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-s]')
    if (!b || b.disabled) return
    const a = b.dataset.s
    if (a !== 'desistir') confirmar = null
    acoes[a](b.dataset.v)
    render()
  })
  el.addEventListener('input', (ev) => { if (ev.target.id === 'sh-palavra') palavra = ev.target.value })
  // segurar "Mapa secreto" mostra de quem é cada capa; soltar esconde
  const mapa = (on) => { const g = el.querySelector('.sh-grade'); if (g) g.classList.toggle('mapa', on) }
  el.addEventListener('pointerdown', (ev) => { if (ev.target.closest('#sh-espiar')) { ev.preventDefault(); mapa(true) } })
  for (const nome of ['pointerup', 'pointercancel']) el.addEventListener(nome, () => mapa(false))
  el.addEventListener('pointerout', (ev) => { if (ev.target.closest('#sh-espiar')) mapa(false) })
  el.addEventListener('contextmenu', (ev) => { if (ev.target.closest('#sh-espiar')) ev.preventDefault() })
  el.addEventListener('keydown', (ev) => { if (ev.target.id === 'sh-espiar' && (ev.key === ' ' || ev.key === 'Enter')) { ev.preventDefault(); mapa(true) } })
  el.addEventListener('keyup', (ev) => { if (ev.target.id === 'sh-espiar') mapa(false) })

  let pronto = null
  window.Shield = {
    letreiro: () => ['Agentes da <em>S.H.I.E.L.D.</em>', 'uma palavra, vários personagens'],
    abrir() { if (!pronto) pronto = V.load(); pronto.then(render) },
    render,
    _: { novoJogo, darDica, tocar, passar, faltam, grade, placar, painelDica, telaFim, textoFim, aviso, corTime, quemJoga, NOME, COMO, som, esc },
  }
})()
