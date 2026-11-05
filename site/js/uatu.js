// Easter egg: Uatu, o Vigia, escondido no fundo do site. Fica quase invisível no canto, atrás de tudo,
// e os olhos dele seguem o seu dedo/mouse. Quem toca 3 vezes rápido no fundo vazio acorda ele, e ele fala.
(function () {
  // meio rosto em pixel art (10 colunas); a outra metade é o espelho. k = contorno, s = pele, w = olho, c = manto
  const META = [
    '......kkkk', '....kkssss', '...kssssss', '..ksssssss', '..ksssssss', '.kssssssss', '.kssssssss', '.kssssssss',
    '.kssssssss', '.kssssssss', '.kskkkkkss', '.kswwwwwks', '.kswwwwwks', '.kskwwwkss', '.ksssssssk', '.ksssssskk',
    '..ksssssss', '..kssskkkk', '..ksssssss', '...kssssss', '....kkssss', '......kkkk', '......ksss', 'cccc..ksss',
    'ccccc.ksss', 'cccccccccc', 'cccccccccc',
  ]
  const LINHAS = META.map((m) => m + m.split('').reverse().join(''))
  const P = 10
  const COR = { k: '#1d1b2c', s: '#f1ead8', w: '#ffffff', c: '#4b5b8c' }
  // cada linha vira poucos retângulos (um por trecho da mesma cor); os olhos ficam numa camada à parte, bem mais visível
  let rects = ''
  let olhos = ''
  LINHAS.forEach((linha, y) => {
    let x = 0
    while (x < linha.length) {
      const ch = linha[x]
      let fim = x
      while (fim < linha.length && linha[fim] === ch) fim++
      const r = `<rect x="${x * P}" y="${y * P}" width="${(fim - x) * P}" height="${P}" fill="${COR[ch]}"/>`
      if (ch === 'w') olhos += r
      else if (COR[ch]) rects += r
      x = fim
    }
  })
  const pupila = (x) => `<rect class="u-pupila" x="${x * P}" y="${11 * P}" width="${2 * P}" height="${2 * P}" fill="#1d1b2c"/>`

  const t = (pt, en) => (window.Lingua ? window.Lingua.t(pt, en) : pt)
  const FALAS = [
    () => t('Eu sou Uatu. Eu observo… e não interfiro.', 'I am Uatu. I observe… and I do not interfere.'),
    () => t('Já vi esse jogo em mil universos. Neste, você está indo bem.', 'I have seen this game in a thousand universes. In this one, you are doing fine.'),
    () => t('Psiu. Eu não estou aqui.', 'Shh. I am not here.'),
    () => t('Num universo vizinho, você clicou quatro vezes.', 'In a neighboring universe, you clicked four times.'),
    () => t('Eu jurei nunca interferir. Mas aquela jogada…', 'I swore never to interfere. But that move…'),
    () => t('As Joias do Infinito estão mais perto do que você imagina.', 'The Infinity Stones are closer than you think.'),
  ]

  const caixa = document.createElement('div')
  caixa.className = 'uatu'
  caixa.setAttribute('aria-hidden', 'true')
  caixa.innerHTML = `<p class="uatu-fala"></p><svg viewBox="0 0 200 270" shape-rendering="crispEdges"><g class="u-corpo">${rects}</g><g class="u-olhos">${olhos}${pupila(4)}${pupila(14)}</g></svg>`
  document.body.prepend(caixa)
  const estilo = document.createElement('style')
  estilo.textContent = `
    .uatu { position: fixed; right: -18px; bottom: -30px; z-index: -1; width: clamp(160px, 21vw, 250px); pointer-events: none;
      transition: transform .8s cubic-bezier(.2, 1.4, .4, 1); transform: translateY(16%) }
    .u-corpo { opacity: .24; transition: opacity .8s }
    .u-olhos { opacity: .9 }
    .uatu svg { display: block; width: 100%; height: auto }
    .u-olhos rect { transition: transform .25s }
    .uatu.acordado { z-index: 70; transform: none }
    .uatu.acordado .u-corpo { opacity: 1 }
    .uatu-fala { position: absolute; right: 70%; bottom: 72%; width: max-content; max-width: min(64vw, 260px); margin: 0; padding: 8px 12px; font-size: 15px;
      background: var(--paper); border: 3px solid var(--ink); border-radius: 14px 14px 0 14px; box-shadow: 3px 3px 0 var(--ink); opacity: 0; transition: opacity .4s .3s }
    .uatu.acordado .uatu-fala { opacity: 1 }
    @media (prefers-reduced-motion: reduce) { .uatu, .u-olhos rect { transition: none } }`
  document.head.appendChild(estilo)

  // os olhos seguem o ponteiro (um pixel pra cada lado)
  const pupilas = caixa.querySelectorAll('.u-pupila')
  let pedido = 0
  function olhar(ev) {
    if (pedido) return
    pedido = requestAnimationFrame(() => {
      pedido = 0
      const r = caixa.getBoundingClientRect()
      const cx = r.left + r.width / 2
      const cy = r.top + r.height * 0.45
      const dx = ev.clientX < cx - 40 ? -1 : ev.clientX > cx + 40 ? 1 : 0
      const dy = ev.clientY < cy - 120 ? -0.5 : 0
      pupilas.forEach((p) => { p.style.transform = `translate(${dx * P}px, ${dy * P}px)` })
    })
  }
  window.addEventListener('pointermove', olhar, { passive: true })
  window.addEventListener('pointerdown', olhar, { passive: true })

  // 3 toques rápidos no fundo vazio (fora dos painéis e botões) acordam o Vigia
  const vazio = (alvo) => alvo === document.documentElement || alvo === document.body || (alvo.matches && alvo.matches('main, .wrap, .home, .setup, .setup-grid, .gd-jogo, .ap-coluna'))
  let toques = []
  let dormir = 0
  document.addEventListener('click', (ev) => {
    if (!vazio(ev.target)) return
    const agora = Date.now()
    toques = toques.filter((x) => agora - x < 1500).concat(agora)
    if (toques.length < 3) return
    toques = []
    caixa.querySelector('.uatu-fala').textContent = FALAS[Math.floor(Math.random() * FALAS.length)]()
    caixa.classList.add('acordado')
    clearTimeout(dormir)
    dormir = setTimeout(() => caixa.classList.remove('acordado'), 4500)
  })
})()
