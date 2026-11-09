// Cobra da Hidra: o joguinho pra passar o tempo enquanto a fila procura alguém. Cada personagem comido faz a cobra crescer.
(function () {
  const t = (pt, en) => window.Lingua.t(pt, en)
  const N = 17
  const CHAVE = 'mvd-cobra'
  const recorde = () => { try { return Number(localStorage.getItem(CHAVE) || 0) } catch (e) { return 0 } }

  function iniciar(caixa) {
    caixa.innerHTML = `<div class="cb-topo"><b>${t('Cobra da Hidra', 'Hydra’s Snake')}</b><span>${t('Pontos', 'Score')} <b data-c="p">0</b> · ${t('Recorde', 'Best')} <b data-c="r">${recorde()}</b></span></div>
      <canvas width="340" height="340" aria-label="${t('Jogo da cobra', 'Snake game')}"></canvas>
      <div class="cb-setas" aria-hidden="false"><button type="button" data-c="u" aria-label="${t('Cima', 'Up')}">▲</button><button type="button" data-c="l" aria-label="${t('Esquerda', 'Left')}">◀</button><button type="button" data-c="d" aria-label="${t('Baixo', 'Down')}">▼</button><button type="button" data-c="r2" aria-label="${t('Direita', 'Right')}">▶</button></div>`
    const cv = caixa.querySelector('canvas')
    const c = cv.getContext('2d')
    const C = cv.width / N
    const DIRS = { u: [0, -1], d: [0, 1], l: [-1, 0], r: [1, 0] }
    let cobra, dir, prox, comida, pontos, morta, timer = 0
    const rnd = (n) => Math.floor(Math.random() * n)
    function novaComida() { do { comida = [rnd(N), rnd(N)] } while (cobra.some(([x, y]) => x === comida[0] && y === comida[1])) }
    function reinicia() { cobra = [[8, 8], [7, 8], [6, 8]]; dir = 'r'; prox = 'r'; pontos = 0; morta = false; novaComida(); placar(); clearInterval(timer); timer = setInterval(passo, 135); pinta() }
    function placar() { caixa.querySelector('[data-c="p"]').textContent = pontos; caixa.querySelector('[data-c="r"]').textContent = Math.max(recorde(), pontos) }
    function pinta() {
      c.fillStyle = '#10201a'
      c.fillRect(0, 0, cv.width, cv.height)
      c.fillStyle = '#ffc83d'
      c.fillRect(comida[0] * C + 3, comida[1] * C + 3, C - 6, C - 6)
      cobra.forEach(([x, y], i) => { c.fillStyle = i === 0 ? '#db3b2b' : i % 2 ? '#63d08d' : '#3a9a62'; c.fillRect(x * C + 1, y * C + 1, C - 2, C - 2) })
      if (morta) {
        c.fillStyle = 'rgba(0,0,0,.65)'
        c.fillRect(0, 0, cv.width, cv.height)
        c.fillStyle = '#fff'
        c.textAlign = 'center'
        c.font = '24px Silkscreen, monospace'
        c.fillText(t('Toque pra', 'Tap to'), cv.width / 2, cv.height / 2 - 8)
        c.fillText(t('jogar de novo', 'play again'), cv.width / 2, cv.height / 2 + 26)
      }
    }
    function morre() {
      morta = true
      clearInterval(timer)
      try { if (pontos > recorde()) localStorage.setItem(CHAVE, String(pontos)) } catch (e) {}
      if (window.Conquistas) window.Conquistas.maximo('cobra', pontos)
      placar()
      pinta()
    }
    function passo() {
      dir = prox
      const [dx, dy] = DIRS[dir]
      const cab = [cobra[0][0] + dx, cobra[0][1] + dy]
      if (cab[0] < 0 || cab[1] < 0 || cab[0] >= N || cab[1] >= N || cobra.some(([x, y]) => x === cab[0] && y === cab[1])) return morre()
      cobra.unshift(cab)
      if (cab[0] === comida[0] && cab[1] === comida[1]) { pontos += 1; placar(); novaComida() } else cobra.pop()
      pinta()
    }
    const OPOSTO = { u: 'd', d: 'u', l: 'r', r: 'l' }
    const vira = (d) => { if (morta) return reinicia(); if (OPOSTO[d] !== dir) prox = d }
    const teclas = { ArrowUp: 'u', ArrowDown: 'd', ArrowLeft: 'l', ArrowRight: 'r', w: 'u', s: 'd', a: 'l', d: 'r' }
    const tecla = (ev) => { const d = teclas[ev.key]; if (d) { ev.preventDefault(); vira(d) } }
    window.addEventListener('keydown', tecla)
    caixa.addEventListener('click', (ev) => { const b = ev.target.closest('[data-c]'); if (b && b.tagName === 'BUTTON') vira(b.dataset.c === 'r2' ? 'r' : b.dataset.c); else if (morta && ev.target === cv) reinicia() })
    let ini = null
    cv.addEventListener('touchstart', (ev) => { ini = [ev.touches[0].clientX, ev.touches[0].clientY] }, { passive: true })
    cv.addEventListener('touchend', (ev) => {
      if (!ini) return
      const dx = ev.changedTouches[0].clientX - ini[0]
      const dy = ev.changedTouches[0].clientY - ini[1]
      ini = null
      if (Math.abs(dx) < 16 && Math.abs(dy) < 16) { if (morta) reinicia(); return }
      vira(Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? 'r' : 'l') : (dy > 0 ? 'd' : 'u'))
    }, { passive: true })
    reinicia()
    return { parar() { clearInterval(timer); window.removeEventListener('keydown', tecla); if (!morta && pontos) { try { if (pontos > recorde()) localStorage.setItem(CHAVE, String(pontos)) } catch (e) {} if (window.Conquistas) window.Conquistas.maximo('cobra', pontos) } } }
  }

  window.Cobra = { iniciar }
})()
