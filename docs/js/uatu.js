// Easter egg: Uatu, o Vigia, escondido no fundo do site. Fica no canto de baixo, atrás de tudo, meio apagado,
// com os olhos brilhando devagar e a cabeça virando pro lado do seu dedo/mouse.
// Quem toca 3 vezes rápido no fundo vazio acorda ele: ele sobe, os olhos acendem e ele fala.
(function () {
  const t = (pt, en) => (window.Lingua ? window.Lingua.t(pt, en) : pt)
  const FALAS = [
    () => t('Eu sou Uatu. Eu observo… e não interfiro.', 'I am Uatu. I observe… and I do not interfere.'),
    () => t('Já vi esse jogo em mil universos. Neste, você está indo bem.', 'I have seen this game in a thousand universes. In this one, you are doing fine.'),
    () => t('Psiu. Eu não estou aqui.', 'Shh. I am not here.'),
    () => t('Num universo vizinho, você clicou quatro vezes.', 'In a neighboring universe, you clicked four times.'),
    () => t('Eu jurei nunca interferir. Mas aquela jogada…', 'I swore never to interfere. But that move…'),
    () => t('Eu vi todas as respostas. Não vou contar nenhuma.', 'I have seen every answer. I will not tell you a single one.'),
  ]

  const caixa = document.createElement('div')
  caixa.className = 'uatu'
  caixa.setAttribute('aria-hidden', 'true')
  // os olhos ficam onde estão na imagem (em % da largura e da altura)
  caixa.innerHTML = `<p class="uatu-fala"></p><div class="uatu-cabeca"><img src="img/uatu.webp" alt="" draggable="false">
    <i class="uatu-olho" style="left:46.9%;top:50.6%"></i><i class="uatu-olho" style="left:69.8%;top:49.9%"></i></div>`
  document.body.prepend(caixa)
  const estilo = document.createElement('style')
  estilo.textContent = `
    .uatu { position: fixed; right: -10px; bottom: 0; z-index: -1; width: clamp(170px, 22vw, 290px); pointer-events: none; opacity: .3;
      transform: translateY(34%); transition: opacity .8s, transform .9s cubic-bezier(.2, 1.3, .4, 1) }
    .uatu-cabeca { position: relative; transition: transform 1.2s ease-out }
    .uatu img { display: block; width: 100%; height: auto; user-select: none }
    .uatu-olho { position: absolute; width: 16%; aspect-ratio: 1; margin: -8% 0 0 -8%; border-radius: 50%; mix-blend-mode: screen;
      background: radial-gradient(circle, #fff 0 12%, #7fe7ff 30%, rgba(60, 190, 255, .35) 55%, transparent 72%); animation: uatu-olha 4s ease-in-out infinite }
    @keyframes uatu-olha { 0%, 100% { opacity: .55; transform: scale(.85) } 50% { opacity: 1; transform: scale(1.1) } }
    .uatu.acordado { z-index: 70; opacity: 1; transform: none }
    .uatu.acordado .uatu-olho { animation: uatu-acende .5s ease-out both }
    @keyframes uatu-acende { from { opacity: 0; transform: scale(.3) } 60% { opacity: 1; transform: scale(1.8) } to { opacity: 1; transform: scale(1.2) } }
    .uatu-fala { position: absolute; right: 62%; bottom: 82%; width: max-content; max-width: min(64vw, 260px); margin: 0; padding: 8px 12px; font-size: 15px;
      background: var(--paper); border: 3px solid var(--ink); border-radius: 14px 14px 0 14px; box-shadow: 3px 3px 0 var(--ink); opacity: 0; transition: opacity .4s .3s }
    .uatu.acordado .uatu-fala { opacity: 1 }
    @media (prefers-reduced-motion: reduce) { .uatu, .uatu-cabeca { transition: none } .uatu-olho { animation: none } }`
  document.head.appendChild(estilo)

  // a cabeça vira de leve pro lado do ponteiro: ele está sempre olhando
  const cabeca = caixa.querySelector('.uatu-cabeca')
  let pedido = 0
  function olhar(ev) {
    if (pedido) return
    pedido = requestAnimationFrame(() => {
      pedido = 0
      const r = caixa.getBoundingClientRect()
      const dx = Math.max(-1, Math.min(1, (ev.clientX - (r.left + r.width / 2)) / (window.innerWidth / 2)))
      const dy = Math.max(-1, Math.min(1, (ev.clientY - r.top) / (window.innerHeight / 2)))
      cabeca.style.transform = `rotate(${dx * 5}deg) translate(${dx * 6}px, ${Math.min(0, dy) * 6}px)`
    })
  }
  window.addEventListener('pointermove', olhar, { passive: true })
  window.addEventListener('pointerdown', olhar, { passive: true })

  // 3 toques rápidos no fundo vazio (fora dos painéis e botões) acordam o Vigia
  const vazio = (alvo) => alvo === document.documentElement || alvo === document.body || (alvo.matches && alvo.matches('main, .wrap, .home, .setup, .setup-grid, .gd-jogo, .gd-palco, .ap-coluna'))
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
    dormir = setTimeout(() => caixa.classList.remove('acordado'), 5000)
  })
})()
