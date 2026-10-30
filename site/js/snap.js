// Snap do Multiverso: o aparelho fica deitado na mesa e cada jogador tem um canto da tela.
// Duas cartas no meio vão trocando cada vez mais rápido. Quando as duas forem o MESMO personagem, bata no seu
// canto primeiro (+1). Bateu na hora errada: −1 e fica congelado um pouco. Se aparecer o Thanos, ninguém bate.
// Cada escudo (os pares da memória) segura um erro. Quem fizer 7 pontos primeiro vence.
(function () {
  const E = window.Engine
  const V = window.View
  const D = E.D
  const X = window.Sfx
  const esc = V.esc
  const META = 7
  const TECLAS = ['z', 'p', 'q', 'm'] // jogador 1 embaixo à esquerda, 2 em cima à direita, 3 em cima à esquerda, 4 embaixo à direita
  const THANOS = D.hq.findIndex((h) => h.key === 'thanos')
  const som = (f, p) => { if (X && X.on) X[f](p) }
  const vibrar = (ms) => { try { if (navigator.vibrate) navigator.vibrate(ms) } catch (e) {} }

  let S = null

  function comecar({ el, nomes, escudos, aoSair }) {
    parar()
    const pool = E.shuffle(D.hq.map((_, i) => i).filter((i) => i !== THANOS)).slice(0, 10)
    S = {
      el, nomes, aoSair, pool, n: nomes.length, pontos: nomes.map(() => 0), escudos: [...escudos], gelo: nomes.map(() => 0),
      cartas: [pool[0], pool[1]], lado: 0, igual: false, pego: false, graca: 0, ritmo: 1350, laco: 0, fase: 'contagem', vencedor: -1, confirmar: false,
    }
    document.body.classList.add('sn-aberto')
    montar()
    contagem(3)
  }

  function parar() {
    if (!S) return
    clearTimeout(S.laco)
    const m = document.querySelector('.sn-mesa')
    if (m) m.remove()
    document.body.classList.remove('sn-aberto')
    S = null
  }

  function contagem(k) {
    if (!S) return
    const c = S.el.ownerDocument.getElementById('sn-aviso')
    if (k === 0) { aviso('VAI!', 'vai'); som('bid', 1); S.fase = 'jogo'; S.laco = setTimeout(proxima, 700); return }
    if (c) aviso(String(k), 'conta')
    som('tick')
    S.laco = setTimeout(() => contagem(k - 1), 800)
  }

  // troca uma das duas cartas; ~30% das vezes ela fica igual à outra, às vezes vem o Thanos
  function proxima() {
    if (!S || S.fase !== 'jogo') return
    const outra = S.cartas[1 - S.lado]
    const r = Math.random()
    let nova
    if (r < 0.08 && outra !== THANOS) nova = THANOS
    else if (r < 0.38 && outra !== THANOS) nova = outra
    else { do { nova = S.pool[Math.floor(Math.random() * S.pool.length)] } while (nova === outra || nova === S.cartas[S.lado]) }
    // quem bate logo depois que o par sumiu não perde ponto: só leva um "tarde!"
    if (S.igual) S.graca = Date.now() + 300
    S.cartas[S.lado] = nova
    S.igual = S.cartas[0] === S.cartas[1] && nova !== THANOS
    S.pego = false
    pintarCarta(S.lado)
    S.lado = 1 - S.lado
    S.laco = setTimeout(proxima, S.ritmo)
  }

  function bater(p) {
    if (!S || p >= S.n) return
    if (S.fase !== 'jogo') return
    if (Date.now() < S.gelo[p]) return
    if (S.igual && !S.pego) {
      S.pego = true
      S.pontos[p] += 1
      S.ritmo = Math.max(620, S.ritmo - 60)
      som('bid', p % 2)
      vibrar(40)
      efeito(p, '+1', 'bom')
      if (S.pontos[p] >= META) return fim(p)
      if (S.ritmo === 620) aviso('VELOCIDADE MÁXIMA', 'rapido')
    } else if ((S.igual && S.pego) || Date.now() < S.graca) {
      efeito(p, 'tarde!', 'tarde')
    } else {
      const thanos = S.cartas.includes(THANOS)
      if (S.escudos[p] > 0) {
        S.escudos[p] -= 1
        efeito(p, 'escudo!', 'escudo')
        som('draw')
      } else {
        S.pontos[p] = Math.max(0, S.pontos[p] - (thanos ? 2 : 1))
        S.gelo[p] = Date.now() + 1500
        efeito(p, thanos ? 'THANOS −2' : '−1', 'ruim')
        som(thanos ? 'hammer' : 'undo')
        vibrar([30, 30, 30])
        setTimeout(() => pintarJogador(p), 1550)
      }
    }
    pintarJogador(p)
  }

  function fim(p) {
    S.fase = 'fim'
    S.vencedor = p
    clearTimeout(S.laco)
    som('win')
    vibrar([80, 50, 80, 50, 200])
    const mesa = document.querySelector('.sn-mesa')
    const ordem = [...Array(S.n).keys()].sort((a, b) => S.pontos[b] - S.pontos[a])
    mesa.insertAdjacentHTML('beforeend', `<div class="sn-fim" style="--cor: var(--c${p})">
      <div class="sn-fim-box"><span class="lbl">Snap do Multiverso</span><h2>${esc(S.nomes[p])} venceu!</h2>
        <ol>${ordem.map((i) => `<li style="--cor: var(--c${i})"><span>${esc(S.nomes[i])}</span><b>${S.pontos[i]}</b></li>`).join('')}</ol>
        <div class="sn-fim-btns"><button class="btn big" type="button" data-sn="denovo">Jogar de novo</button>
          <button class="btn paper" type="button" data-sn="sair">Sair da mesa</button></div></div></div>`)
  }

  // ---------- desenho ----------
  // cantos: 2 jogadores = metade de baixo e metade de cima; 3 ou 4 = quatro cantos (o 3º fica com os dois de baixo se forem 3)
  function montar() {
    const cantos = [...Array(S.n).keys()].map((p) => `<button class="sn-canto c${p}${S.n === 2 ? ' dois' : ''}${S.n === 3 && p === 0 ? ' largo' : ''}" type="button" data-p="${p}" style="--cor: var(--c${p})">
      <span class="sn-quem"><b>${esc(S.nomes[p])}</b><span class="sn-pts"></span><span class="sn-escudos"></span><kbd>${TECLAS[p].toUpperCase()}</kbd></span></button>`).join('')
    document.body.insertAdjacentHTML('beforeend', `<div class="sn-mesa n${S.n}" role="application" aria-label="Snap do Multiverso">
      ${cantos}
      <div class="sn-centro"><div class="sn-carta" id="sn-c0"></div><div class="sn-carta" id="sn-c1"></div></div>
      <div class="sn-regra">Bata quando as duas cartas forem o <b>mesmo personagem</b>. No Thanos, não!</div>
      <div class="sn-aviso" id="sn-aviso" aria-live="assertive"></div>
      <button class="sn-sair" type="button" data-sn="sair-pede">sair</button>
    </div>`)
    const mesa = document.querySelector('.sn-mesa')
    mesa.addEventListener('pointerdown', (ev) => {
      const c = ev.target.closest('.sn-canto')
      if (c) { ev.preventDefault(); bater(Number(c.dataset.p)) }
    })
    mesa.addEventListener('click', (ev) => {
      const b = ev.target.closest('[data-sn]')
      if (!b) return
      const a = b.dataset.sn
      if (a === 'denovo') { const { el, nomes, aoSair } = S; comecar({ el, nomes, escudos: nomes.map(() => 0), aoSair }) }
      else if (a === 'sair') { const fn = S.aoSair; parar(); if (fn) fn() }
      else if (a === 'sair-pede') {
        if (!S.confirmar) { S.confirmar = true; b.textContent = 'toque de novo pra sair'; setTimeout(() => { if (S) { S.confirmar = false; b.textContent = 'sair' } }, 2500); return }
        const fn = S.aoSair
        parar()
        if (fn) fn()
      }
    })
    mesa.addEventListener('contextmenu', (ev) => ev.preventDefault())
    pintarCarta(0)
    pintarCarta(1)
    for (let p = 0; p < S.n; p++) pintarJogador(p)
  }

  function pintarCarta(i) {
    const c = document.getElementById('sn-c' + i)
    if (!c) return
    const hq = S.cartas[i]
    const lot = E.lotOf('hq:' + hq)
    c.className = 'sn-carta entra' + (hq === THANOS ? ' thanos' : '')
    c.innerHTML = `${V.cover(lot)}<span>${esc(lot.n)}</span>`
    void c.offsetWidth // reinicia a animação de entrada
  }

  function pintarJogador(p) {
    if (!S) return
    const c = document.querySelector(`.sn-canto.c${p}`)
    if (!c) return
    c.classList.toggle('gelo', Date.now() < S.gelo[p])
    c.querySelector('.sn-pts').innerHTML = [...Array(META).keys()].map((k) => `<i class="${k < S.pontos[p] ? 'on' : ''}"></i>`).join('') + `<em>${S.pontos[p]}</em>`
    c.querySelector('.sn-escudos').textContent = S.escudos[p] ? '◆'.repeat(S.escudos[p]) : ''
  }

  function efeito(p, txt, tipo) {
    const c = document.querySelector(`.sn-canto.c${p}`)
    if (!c) return
    const f = document.createElement('span')
    f.className = 'sn-fx ' + tipo
    f.textContent = txt
    c.appendChild(f)
    c.classList.remove('bateu')
    void c.offsetWidth
    c.classList.add('bateu')
    setTimeout(() => f.remove(), 900)
  }

  function aviso(txt, tipo) {
    const a = document.getElementById('sn-aviso')
    if (!a) return
    a.className = 'sn-aviso ' + tipo
    a.textContent = txt
    void a.offsetWidth
    a.classList.add('mostra')
  }

  document.addEventListener('keydown', (ev) => {
    if (!S || ev.repeat || /^(INPUT|TEXTAREA)$/.test(ev.target.tagName)) return
    const p = TECLAS.indexOf(ev.key.toLowerCase())
    if (p >= 0 && p < S.n) { ev.preventDefault(); bater(p) }
  })

  window.Snap = { comecar, parar, ativo: () => !!S }
})()
