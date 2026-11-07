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
    /* a base da imagem (onde o manto é cortado) fica sempre abaixo do fim da tela: ele sobe sem passar do ponto e gira pela base */
    .uatu { position: fixed; right: -10px; bottom: -28px; z-index: -1; width: clamp(170px, 22vw, 290px); pointer-events: none; opacity: .3;
      transform: translateY(34%); transition: opacity .8s, transform .9s cubic-bezier(.2, .9, .3, 1) }
    .uatu-cabeca { position: relative; transform-origin: 50% 100%; transition: transform 1.2s ease-out }
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
      cabeca.style.transform = `rotate(${dx * 4}deg) translateX(${dx * 6}px)`
    })
  }
  window.addEventListener('pointermove', olhar, { passive: true })
  window.addEventListener('pointerdown', olhar, { passive: true })

  // 3 toques rápidos no fundo vazio (fora dos painéis e botões) acordam o Vigia
  const vazio = (alvo) => alvo === document.documentElement || alvo === document.body || (alvo.matches && alvo.matches('main, .wrap, .home, .setup, .setup-grid, .gd-jogo, .gd-palco, .ap-coluna'))
  let toques = []
  let dormir = 0
  let ultima = 0
  // ele sobe, fala e volta pro canto (fica mais tempo quando a fala é comprida)
  function falar(txt) {
    ultima = Date.now()
    caixa.querySelector('.uatu-fala').textContent = txt
    caixa.classList.remove('acordado')
    void caixa.offsetWidth
    caixa.classList.add('acordado')
    clearTimeout(dormir)
    dormir = setTimeout(() => caixa.classList.remove('acordado'), Math.min(8000, 3500 + txt.length * 45))
  }
  const sorteia = (lista) => lista[Math.floor(Math.random() * lista.length)]
  document.addEventListener('click', (ev) => {
    if (!vazio(ev.target)) return
    const agora = Date.now()
    toques = toques.filter((x) => agora - x < 1500).concat(agora)
    if (toques.length < 3) return
    toques = []
    falar(sorteia(FALAS)())
  })

  // ---------- ele também aparece sozinho nos momentos grandes dos jogos ----------
  // cada momento tem algumas falas e uma chance; entre uma aparição e outra ele espera um pouco, pra não cansar
  const MOMENTOS = {
    'grade-fim': [1, [
      (d) => t(`Em 14 milhões de universos, ${d.nome} ganhou essa. Neste também.`, `In 14 million universes, ${d.nome} won this one. In this one too.`),
      (d) => t(`${d.nome} fechou a linha. Anotei no meu livro.`, `${d.nome} filled the line. I wrote it in my book.`),
      (d) => t(`Eu juro que não ajudei ${d.nome}.`, `I swear I did not help ${d.nome}.`)]],
    'grade-empate': [0.8, [() => t('Empate. Num universo vizinho alguém ganhou… mas não foi neste.', 'A tie. In a neighboring universe someone won… but not in this one.')]],
    'grade-roubo': [0.45, [
      () => t('Roubar casa alheia… o Multiverso viu isso.', 'Stealing someone else’s square… the Multiverse saw that.'),
      () => t('Eu não interfiro. Mas essa casa tinha dono.', 'I do not interfere. But that square had an owner.')]],
    'grade-erro': [0.15, [
      () => t('Hmm. Num universo vizinho esse personagem valia.', 'Hmm. In a neighboring universe, that character counted.'),
      () => t('Eu sei a resposta. Você sabe que eu não posso dizer.', 'I know the answer. You know I cannot say it.')]],
    'minas-boom': [0.35, [
      () => t('BOOM. Essa eu vi chegando há três universos.', 'BOOM. I saw that one coming three universes ago.'),
      () => t('Eu não interfiro. Mas eu ri.', 'I do not interfere. But I laughed.')]],
    'minas-toaa': [1, [() => t('Até eu me ajoelho diante d’Aquele Acima de Todos.', 'Even I kneel before the One Above All.')]],
    'minas-fim': [0.9, [(d) => t(`${d.nome} sobreviveu ao campo minado. Registrado.`, `${d.nome} survived the minefield. Recorded.`)]],
    'aposto-provou': [0.35, [
      (d) => t(`${d.nome} provou. Eu estava contando também.`, `${d.nome} proved it. I was counting too.`),
      () => t('Nenhum nome errado. Eu teria percebido.', 'Not one wrong name. I would have noticed.')]],
    'aposto-errou': [0.35, [
      (d) => t(`Ah, ${d.nome}… eu sabia o nome que faltou.`, `Oh, ${d.nome}… I knew the name you were missing.`),
      () => t('Apostar alto é corajoso. Eu só observo.', 'Betting high is brave. I only observe.')]],
    'aposto-truco': [0.6, [() => t('Truco no Multiverso? Isso eu nunca tinha visto.', 'Truco across the Multiverse? I had never seen that.')]],
    'aposto-fim': [0.9, [(d) => t(`${d.nome} sabe mais de Marvel que alguns Vigias.`, `${d.nome} knows more Marvel than some Watchers.`)]],
    'impostor-pego': [0.6, [
      () => t('O impostor caiu. Eu sabia desde o começo, claro.', 'The impostor got caught. I knew from the start, of course.'),
      () => t('Pegaram o impostor. Nem precisei quebrar meu juramento.', 'You caught the impostor. I did not even have to break my oath.')]],
    'impostor-escapou': [0.6, [
      () => t('O impostor escapou. Eu vi tudo e não falei nada.', 'The impostor got away. I saw everything and said nothing.'),
      () => t('Enganou todo mundo. Menos eu.', 'Fooled everyone. Except me.')]],
    'draft-caro': [0.5, [
      (d) => t(`R$${d.preco} por ${d.lote}? Eu não interfiro… mas eu teria esperado.`, `R$${d.preco} for ${d.lote}? I do not interfere… but I would have waited.`)]],
    'draft-fim': [0.7, [
      () => t('Times montados. Em outro universo, os dois perderam pro Thanos.', 'Teams assembled. In another universe, both lost to Thanos.'),
      () => t('Eu já sei quem montou o melhor time. Discutam à vontade.', 'I already know who built the best team. Argue all you want.')]],
    'missao-pegou': [0.5, [() => t('Te peguei! …eu também estava de olho.', 'Gotcha! …I was watching too.')]],
  }
  const ESPERA = 35000
  function momento(tipo, dados = {}) {
    const m = MOMENTOS[tipo]
    if (!m || document.hidden) return
    const [chance, falas] = m
    if (chance < 1 && (Date.now() - ultima < ESPERA || Math.random() > chance)) return
    setTimeout(() => falar(sorteia(falas)(dados)), 900)
  }

  // parado na tela inicial sem saber o que jogar: uma vez por visita ele dá o ar da graça
  let parado = 0
  let jaFalouParado = false
  function reinicia() {
    if (jaFalouParado) return
    clearTimeout(parado)
    parado = setTimeout(() => {
      if (document.body.dataset.jogo !== 'home' || document.hidden || Date.now() - ultima < ESPERA) return reinicia()
      jaFalouParado = true
      falar(t('Não sabe o que jogar? Eu já vi o que você escolhe… mas não posso contar.', 'Can’t decide what to play? I have seen what you pick… but I cannot tell.'))
    }, 45000)
  }
  ;['pointerdown', 'keydown'].forEach((e) => window.addEventListener(e, reinicia, { passive: true }))
  reinicia()

  // escrever "uatu", "vigia" ou "watcher" em qualquer lugar (fora de um campo de texto) chama ele
  let digitado = ''
  window.addEventListener('keydown', (ev) => {
    if (ev.target.closest && ev.target.closest('input, textarea')) return
    if (ev.key.length !== 1) return
    digitado = (digitado + ev.key.toLowerCase()).slice(-7)
    if (/(uatu|vigia|watcher)$/.test(digitado)) { digitado = ''; falar(t('Você me chamou? Eu estava aqui o tempo todo.', 'You called? I was here all along.')) }
  })

  window.Uatu = { falar, momento }
})()
