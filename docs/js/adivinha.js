// Adivinha do Multiverso: a capa aparece bem pixelada e vai clareando. Quem souber, bate primeiro.
// De 2 a 4 jogadores num aparelho só. Quanto mais pixelada a imagem quando acerta, mais pontos (5 → 1); errar tira 1.
// Dois jeitos de responder: "bate e fala" (o grupo confere a resposta) e "bate e escolhe" (4 opções na tela).
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const X = window.Sfx
  const el = document.getElementById('adivinha')
  const SAVE = 'mvd-adivinha'
  const BLOCOS = [24, 16, 10, 6, 3, 1]   // tamanho do "pixel" em cada nível (o último é a imagem nítida)
  const PASSO = 3000                      // tempo de cada nível
  const TECLAS = ['a', 'l', 'z', 'm']
  const PARES = (window.ImpostorDados && window.ImpostorDados.PARES) || []

  const C = { n: 2, nomes: ['', '', '', ''], modo: 'fala', imagens: 'hq', rodadas: 10 }
  try { Object.assign(C, JSON.parse(localStorage.getItem(SAVE) || '{}')) } catch (e) {}
  C.n = Math.min(4, Math.max(2, Number(C.n) || 2))
  C.nomes = [0, 1, 2, 3].map((i) => String((C.nomes && C.nomes[i]) || ''))
  const salvar = () => { try { localStorage.setItem(SAVE, JSON.stringify(C)) } catch (e) {} }
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const esc = V.esc
  const nome = (p) => (C.nomes[p] && C.nomes[p].trim()) || `Jogador ${p + 1}`
  const cor = (p) => `--cor: var(--c${p})`

  // ---------- o que dá pra adivinhar ----------
  const HQ = D.hq.map((h) => ({ tipo: 'hq', cel: h.i, nome: h.n, sub: h.id, key: h.key }))
  const MCU = Object.values(D.works).map((w) => ({ tipo: 'mcu', cel: w.i, nome: w.t, sub: `${w.k} · ${w.y}` }))
  const monte = () => (C.imagens === 'hq' ? HQ : C.imagens === 'mcu' ? MCU : HQ.concat(MCU))

  // 4 opções: a certa, o "par parecido" do Impostor quando existe (fica mais difícil) e outras do mesmo tipo
  function opcoes(item) {
    const mesmos = item.tipo === 'hq' ? HQ : MCU
    const par = item.key && PARES.find(([a, b]) => a === item.key || b === item.key)
    const parecido = par && HQ.find((h) => h.key === (par[0] === item.key ? par[1] : par[0]))
    const outros = E.shuffle(mesmos.filter((x) => x !== item && x !== parecido)).slice(0, parecido ? 2 : 3)
    return E.shuffle([item, ...(parecido ? [parecido] : []), ...outros]).map((x) => x.nome)
  }

  // ---------- estado da partida ----------
  let G = null        // { pontos, fila, rodada, item, nivel, fase, travados, quem, ops, ganho, laco }
  let tela = 'regras'

  function comecar() {
    G = { pontos: Array(C.n).fill(0), fila: E.shuffle([...monte()]).slice(0, C.rodadas), rodada: -1, laco: 0 }
    tela = 'jogo'
    proxima()
  }

  function proxima() {
    clearInterval(G.laco)
    G.rodada += 1
    if (G.rodada >= G.fila.length) { tela = 'fim'; som('win'); render(); return }
    Object.assign(G, { item: G.fila[G.rodada], nivel: 0, fase: 'mostrando', travados: [], quem: -1, ops: null, ganho: null })
    som('draw')
    rodarRelogio()
    render()
  }

  // a cada PASSO a imagem fica mais nítida; depois de nítida, ainda dá um tempinho e acaba a rodada
  function rodarRelogio() {
    clearInterval(G.laco)
    G.laco = setInterval(() => {
      if (G.fase !== 'mostrando') return
      if (G.nivel < BLOCOS.length - 1) { G.nivel += 1; som('tick'); render() }
      else fimDaRodada(-1)
    }, PASSO)
  }

  const vale = () => Math.max(1, 5 - G.nivel)

  function bater(p) {
    if (!G || tela !== 'jogo' || G.fase !== 'mostrando' || G.travados.includes(p) || p >= C.n) return
    G.quem = p
    G.fase = C.modo === 'escolhe' ? 'escolhendo' : 'bateu'
    if (G.fase === 'escolhendo') G.ops = opcoes(G.item)
    som('bid', p % 2)
    render()
  }

  function errou() {
    const p = G.quem
    G.pontos[p] -= 1
    G.travados.push(p)
    som('undo')
    // no "bate e fala" a resposta já apareceu: a rodada acaba. No "bate e escolhe" a imagem continua pros outros.
    if (C.modo === 'fala' || G.travados.length >= C.n) { fimDaRodada(-1, p); return }
    G.fase = 'mostrando'
    G.quem = -1
    render()
  }

  function acertou() {
    const p = G.quem
    const v = vale()
    G.pontos[p] += v
    som('sold')
    fimDaRodada(p, null, v)
  }

  function fimDaRodada(vencedor, errado, v) {
    clearInterval(G.laco)
    G.fase = 'fim-rodada'
    G.ganho = { vencedor, errado: errado == null ? -1 : errado, v: v || 0 }
    G.nivel = BLOCOS.length - 1
    render()
  }

  // ---------- a imagem pixelada ----------
  const atlas = {}
  function carregarAtlas() {
    return Promise.all(['hq', 'mcu'].map((src) => atlas[src] ? null : new Promise((ok) => {
      const im = new Image()
      im.onload = () => { atlas[src] = im; ok() }
      im.onerror = ok
      im.src = D.atlas[src].src
    })))
  }
  const pequeno = document.createElement('canvas')
  function desenhar() {
    const c = document.getElementById('adv-tela')
    const im = G && atlas[G.item.tipo]
    if (!c || !im) return
    const a = D.atlas[G.item.tipo]
    const w = im.naturalWidth / a.cols
    const h = im.naturalHeight / a.rows
    const sx = (G.item.cel % a.cols) * w
    const sy = Math.floor(G.item.cel / a.cols) * h
    const b = BLOCOS[G.nivel]
    pequeno.width = Math.max(1, Math.ceil(w / b))
    pequeno.height = Math.max(1, Math.ceil(h / b))
    const pc = pequeno.getContext('2d')
    pc.imageSmoothingEnabled = true
    pc.drawImage(im, sx, sy, w, h, 0, 0, pequeno.width, pequeno.height)
    const ctx = c.getContext('2d')
    ctx.imageSmoothingEnabled = false
    ctx.drawImage(pequeno, 0, 0, c.width, c.height)
  }

  // ---------- telas ----------
  const escolha = (a, v, atual, titulo, sub) =>
    `<button class="mode" type="button" data-x="${a}" data-v="${v}" aria-pressed="${atual === v}"><b>${titulo}</b><small>${sub}</small></button>`

  function telaRegras() {
    const nomes = [...Array(C.n).keys()].map((p) => `<label class="imp-nome" style="${cor(p)}"><span class="sr-only">Jogador ${p + 1}</span>
      <input id="adv-nome-${p}" maxlength="14" autocomplete="off" placeholder="Jogador ${p + 1} · tecla ${TECLAS[p].toUpperCase()}" value="${esc(C.nomes[p])}"></label>`).join('')
    return `<section class="setup adv">
      <div class="setup-grid">
        <div class="panel rules">
          <h2>Regras</h2>
          <div class="field"><span class="lbl">Jogadores</span>
            <div class="stepper">
              <button class="btn paper step" type="button" data-x="n" data-v="-1" aria-label="Um jogador a menos"${C.n <= 2 ? ' disabled' : ''}>−</button>
              <b class="imp-n">${C.n}</b>
              <button class="btn paper step" type="button" data-x="n" data-v="1" aria-label="Um jogador a mais"${C.n >= 4 ? ' disabled' : ''}>+</button>
            </div>
            <div class="imp-nomes">${nomes}</div>
          </div>
          <div class="field"><span class="lbl">Como responder</span><div class="modes">
            ${escolha('modo', 'fala', C.modo, 'Bate e fala', 'fala o nome em voz alta e o grupo confere')}
            ${escolha('modo', 'escolhe', C.modo, 'Bate e escolhe', 'escolhe entre 4 nomes na tela')}
          </div></div>
          <div class="field"><span class="lbl">O que adivinhar</span><div class="modes">
            ${escolha('imagens', 'hq', C.imagens, 'HQ', `${HQ.length} personagens`)}
            ${escolha('imagens', 'mcu', C.imagens, 'MCU', `${MCU.length} filmes e séries`)}
            ${escolha('imagens', 'tudo', C.imagens, 'Os dois', 'misturado')}
          </div></div>
          <div class="field"><span class="lbl">Rodadas</span><div class="presets">
            ${[5, 10, 15].map((r) => `<button class="preset" type="button" data-x="rodadas" data-v="${r}" aria-pressed="${C.rodadas === r}">${r} rodadas</button>`).join('')}
          </div></div>
        </div>
        <div class="panel">
          <h2>Como funciona</h2>
          <ol class="how">
            <li>A capa aparece bem pixelada e fica mais nítida a cada 3 segundos.</li>
            <li>Quem souber quem é, bate primeiro: toca no seu botão ou aperta sua tecla.</li>
            <li>Acertar com a imagem bem pixelada vale 5 pontos. Quase nítida, vale 1. Errar tira 1.</li>
            <li>No "bate e escolhe", quem erra fica fora da rodada e a imagem continua clareando pros outros.</li>
          </ol>
        </div>
      </div>
      <div class="go-row"><button class="btn big" type="button" data-x="comecar">Começar</button></div>
    </section>`
  }

  function lado() {
    const it = G.item
    const resposta = `<div class="adv-resp"><b>${esc(it.nome)}</b><small>${esc(it.sub || '')}</small></div>`
    if (G.fase === 'mostrando') {
      const fora = G.travados.length ? `<p class="note">Fora desta rodada: ${G.travados.map((p) => esc(nome(p))).join(', ')}</p>` : ''
      return `<span class="lbl">Quem é?</span><p class="adv-grande">Quem souber, bate!</p>
        <p class="adv-vale">Agora vale <b>${vale()}</b> ${vale() === 1 ? 'ponto' : 'pontos'}</p>${fora}`
    }
    const quem = `<p class="adv-quem" style="${cor(G.quem)}">${esc(nome(G.quem))} bateu!</p>`
    if (G.fase === 'bateu') {
      return `${quem}<p>Fala o nome em voz alta. Depois mostra a resposta.</p>
        <button class="btn big" type="button" data-x="mostrar">Mostrar resposta</button>`
    }
    if (G.fase === 'resposta') {
      return `${quem}${resposta}<div class="go-row adv-juiz">
        <button class="btn green" type="button" data-x="certo">Acertou (+${vale()})</button>
        <button class="btn red" type="button" data-x="errado">Errou (−1)</button></div>`
    }
    if (G.fase === 'escolhendo') {
      return `${quem}<p>Quem é?</p><div class="adv-ops">${G.ops.map((o, i) =>
        `<button class="btn paper" type="button" data-x="op" data-v="${i}">${esc(o)}</button>`).join('')}</div>`
    }
    // fim da rodada
    const g = G.ganho
    const msg = g.vencedor >= 0 ? `<p class="adv-quem" style="${cor(g.vencedor)}">${esc(nome(g.vencedor))} acertou! +${g.v}</p>`
      : g.errado >= 0 ? `<p class="adv-quem" style="${cor(g.errado)}">${esc(nome(g.errado))} errou (−1)</p>` : '<p class="adv-grande">Ninguém acertou</p>'
    const ultima = G.rodada >= G.fila.length - 1
    return `${msg}<span class="lbl">Era</span>${resposta}
      <button class="btn big" type="button" data-x="proxima">${ultima ? 'Ver resultado' : 'Próxima rodada'}</button>`
  }

  function botoesBater() {
    return `<div class="adv-botoes" style="--n:${C.n}">${[...Array(C.n).keys()].map((p) => {
      const fora = G.travados.includes(p)
      const pode = G.fase === 'mostrando' && !fora
      return `<button class="btn adv-bater" type="button" data-x="bater" data-v="${p}" style="${cor(p)}"${pode ? '' : ' disabled'}>
        <span>${esc(nome(p))}</span><b>${G.pontos[p]}</b><kbd>${TECLAS[p].toUpperCase()}</kbd></button>`
    }).join('')}</div>`
  }

  function telaJogo() {
    const pontos = BLOCOS.map((_, i) => `<i class="${i <= G.nivel ? 'on' : ''}"></i>`).join('')
    return `<section class="adv-jogo">
      <div class="imp-topo"><span class="hint">Rodada ${G.rodada + 1} de ${G.fila.length}</span>
        <button class="linkish" type="button" data-x="regras">Regras</button></div>
      <div class="adv-palco">
        <div class="adv-quadro"><canvas id="adv-tela" width="288" height="432" role="img" aria-label="Imagem pixelada"></canvas>
          <div class="adv-niveis" aria-hidden="true">${pontos}</div></div>
        <div class="panel adv-lado">${lado()}</div>
      </div>
      ${botoesBater()}
    </section>`
  }

  function telaFim() {
    const ordem = [...Array(C.n).keys()].sort((a, b) => G.pontos[b] - G.pontos[a])
    const topo = G.pontos[ordem[0]]
    const campeoes = ordem.filter((p) => G.pontos[p] === topo)
    const titulo = campeoes.length > 1 ? 'Deu empate!' : `${esc(nome(campeoes[0]))} venceu!`
    return `<section class="adv-jogo">
      <div class="panel adv-final"><h2>${titulo}</h2>
        <ol class="imp-placar">${ordem.map((p) => `<li style="${cor(p)}"><span>${esc(nome(p))}</span><b>${G.pontos[p]}</b></li>`).join('')}</ol>
      </div>
      <div class="go-row"><button class="btn paper" type="button" data-x="regras">Regras</button>
        <button class="btn big" type="button" data-x="comecar">Jogar de novo</button></div>
    </section>`
  }

  let faseVista = ''
  function render() {
    if (tela === 'jogo' && !G) tela = 'regras'
    el.innerHTML = tela === 'regras' ? telaRegras() : tela === 'jogo' ? telaJogo() : telaFim()
    if (tela !== 'jogo') { faseVista = ''; return }
    desenhar()
    // no celular o painel fica embaixo dos botões: quando alguém bate, rola até ele; quando volta a mostrar, rola pra imagem
    if (G.fase !== faseVista && window.innerWidth <= 700) {
      const alvo = document.querySelector(G.fase === 'mostrando' ? '.adv-quadro' : '.adv-lado')
      if (alvo) alvo.scrollIntoView({ block: G.fase === 'mostrando' ? 'start' : 'nearest' })
    }
    faseVista = G.fase
  }

  // ---------- eventos ----------
  const acoes = {
    n: (v) => { C.n = Math.min(4, Math.max(2, C.n + Number(v))); salvar(); render() },
    modo: (v) => { C.modo = v; salvar(); render() },
    imagens: (v) => { C.imagens = v; salvar(); render() },
    rodadas: (v) => { C.rodadas = Number(v); salvar(); render() },
    comecar: () => { comecar(); window.scrollTo(0, 0) },
    regras: () => { if (G) clearInterval(G.laco); tela = 'regras'; render() },
    bater: (v) => bater(Number(v)),
    mostrar: () => { G.fase = 'resposta'; render() },
    certo: () => acertou(),
    errado: () => errou(),
    op: (v) => { if (G.ops[Number(v)] === G.item.nome) acertou(); else errou() },
    proxima: () => proxima(),
  }
  el.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-x]')
    if (!b || b.disabled) return
    acoes[b.dataset.x](b.dataset.v)
  })
  el.addEventListener('input', (ev) => {
    const m = ev.target.id && ev.target.id.match(/^adv-nome-(\d)$/)
    if (!m) return
    C.nomes[Number(m[1])] = ev.target.value.slice(0, 14)
    salvar()
  })
  // teclas de bater: A, L, Z, M (só com este jogo na tela e fora dos campos de texto)
  document.addEventListener('keydown', (ev) => {
    if (document.body.dataset.jogo !== 'adivinha' || ev.repeat || /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return
    const p = TECLAS.indexOf(ev.key.toLowerCase())
    if (p >= 0 && G && tela === 'jogo' && G.fase === 'mostrando') { ev.preventDefault(); bater(p) }
  })

  window.Adivinha = {
    letreiro: () => ['Adivinha do <em>Multiverso</em>', 'a capa vai clareando: quem é?'],
    abrir() { carregarAtlas().then(render) },
  }
})()
