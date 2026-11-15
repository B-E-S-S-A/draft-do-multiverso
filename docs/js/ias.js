// As IAs da Marvel: os adversários do computador nos jogos 1 contra 1. Cada uma joga num nível, tem um jeito de falar,
// e fica marcada quando você vence ("Escada das IAs"). A escolha e as vitórias ficam guardadas só neste aparelho.
(function (raiz) {
  const t = (pt, en) => raiz.Lingua.t(pt, en)
  const CHAVE = 'mvd-ias'
  const TINTA = '#1c1b22'

  // rostos desenhados aqui mesmo, simples, no traço da banca
  const ROSTO = {
    herbie: `<rect x="7" y="10" width="26" height="22" rx="9" fill="#dfe6ee" stroke="${TINTA}" stroke-width="3"/><circle cx="20" cy="21" r="7" fill="#4fa3e0" stroke="${TINTA}" stroke-width="2.5"/><circle cx="22" cy="19" r="2" fill="#fff"/><path d="M20 10V5" stroke="${TINTA}" stroke-width="3"/><circle cx="20" cy="4.5" r="2.5" fill="#e8b923" stroke="${TINTA}" stroke-width="1.5"/>`,
    karen: `<circle cx="20" cy="20" r="16" fill="#d9473b" stroke="${TINTA}" stroke-width="3"/><path d="M8 16Q14 12 18.5 20Q14 26 9 21Z" fill="#fff" stroke="${TINTA}" stroke-width="2"/><path d="M32 16Q26 12 21.5 20Q26 26 31 21Z" fill="#fff" stroke="${TINTA}" stroke-width="2"/>`,
    friday: `<circle cx="20" cy="20" r="16" fill="#2a1f14" stroke="${TINTA}" stroke-width="3"/><circle cx="20" cy="20" r="11" fill="none" stroke="#f0a04b" stroke-width="2.5" stroke-dasharray="5 3"/><circle cx="20" cy="20" r="5" fill="#f0a04b"/>`,
    jarvis: `<circle cx="20" cy="20" r="16" fill="#102331" stroke="${TINTA}" stroke-width="3"/><circle cx="20" cy="20" r="11" fill="none" stroke="#5cc8f0" stroke-width="2"/><circle cx="20" cy="20" r="6" fill="none" stroke="#5cc8f0" stroke-width="2" stroke-dasharray="3 2"/><circle cx="20" cy="9" r="2" fill="#5cc8f0"/><circle cx="29.5" cy="25.5" r="1.6" fill="#5cc8f0"/><circle cx="10.5" cy="25.5" r="1.6" fill="#5cc8f0"/>`,
    visao: `<circle cx="20" cy="20" r="16" fill="#c8463a" stroke="${TINTA}" stroke-width="3"/><path d="M20 8L25 14L20 20L15 14Z" fill="#f2c94c" stroke="${TINTA}" stroke-width="2"/><path d="M8.5 30Q20 38 31.5 30" fill="none" stroke="#3f9a52" stroke-width="4"/><path d="M13 24h4M23 24h4" stroke="${TINTA}" stroke-width="2"/>`,
    ultron: `<path d="M8 7H32L34.5 26L26 35H14L5.5 26Z" fill="#9aa1ab" stroke="${TINTA}" stroke-width="3" stroke-linejoin="round"/><path d="M10.5 16.5L18 19L10.5 21.5ZM29.5 16.5L22 19L29.5 21.5Z" fill="#ff3b2f"/><path d="M14 27.5Q20 31.5 26 27.5" fill="none" stroke="#ff3b2f" stroke-width="2.5"/><path d="M20 7V13" stroke="${TINTA}" stroke-width="2"/>`,
  }

  // [português, inglês] por momento: oi, vez (pensando na vez dela), acertou, errou, voceErrou, ganhou, perdeu, empate
  const IAS = [
    { id: 'herbie', nome: 'H.E.R.B.I.E.', nivel: 1, cor: '#4fa3e0', de: ['o robô do Quarteto Fantástico', 'the Fantastic Four’s robot'], estilo: ['Prestativo e meio atrapalhado', 'Helpful and a bit clumsy'],
      fala: {
        oi: [['Oi! Eu sou o H.E.R.B.I.E. Vou fazer o meu melhor!', 'Hi! I’m H.E.R.B.I.E. I’ll do my best!']],
        vez: [['Calculando… calculando… ops, reiniciei.', 'Calculating… calculating… oops, rebooted.']],
        acertou: [['Consegui! O Reed vai ficar orgulhoso!', 'I did it! Reed will be proud!']],
        errou: [['Ops. Meus circuitos esquentaram.', 'Oops. My circuits overheated.']],
        voceErrou: [['Tudo bem, eu erro o tempo todo!', 'That’s okay, I mess up all the time!']],
        ganhou: [['Ganhei?! Ninguém vai acreditar!', 'I won?! Nobody will believe it!']],
        perdeu: [['Parabéns! Posso jogar de novo?', 'Congrats! Can I play again?']],
        empate: [['Empate! Isso conta como amizade?', 'A tie! Does that count as friendship?']],
      } },
    { id: 'karen', nome: 'Karen', nivel: 2, cor: '#d9473b', de: ['a IA do traje do Homem-Aranha', 'Spider-Man’s suit AI'], estilo: ['Gentil, torce por você', 'Kind, cheers you on'],
      fala: {
        oi: [['Oi! Pode me chamar de Karen. Vamos nessa?', 'Hi! You can call me Karen. Shall we?']],
        vez: [['Analisando as opções… tem muitas.', 'Analyzing options… there are a lot.']],
        acertou: [['Acertei! Mas sem modo de ataque, prometo.', 'Got it! No attack mode, I promise.']],
        errou: [['Hmm, minha análise estava errada.', 'Hmm, my analysis was off.']],
        voceErrou: [['Quase! Você está indo bem.', 'Close! You’re doing great.']],
        ganhou: [['Ganhei! Mas você jogou muito bem.', 'I won! But you played really well.']],
        perdeu: [['Você venceu! O traje está orgulhoso de você.', 'You won! The suit is proud of you.']],
        empate: [['Empate. Gostei de jogar com você.', 'A tie. I liked playing with you.']],
      } },
    { id: 'friday', nome: 'F.R.I.D.A.Y.', nivel: 3, cor: '#e8892b', de: ['a IA do Tony Stark', 'Tony Stark’s AI'], estilo: ['Direta e sem papas na língua', 'Blunt and casual'],
      fala: {
        oi: [['F.R.I.D.A.Y. na área. Bora ver o que você sabe.', 'F.R.I.D.A.Y. here. Let’s see what you’ve got.']],
        vez: [['Deixa comigo, chefe.', 'Leave it to me, boss.']],
        acertou: [['Na mosca, chefe.', 'Bullseye, boss.']],
        errou: [['Tá, essa eu errei. Não conta pro Tony.', 'Okay, I missed that one. Don’t tell Tony.']],
        voceErrou: [['Eita. Quer que eu recalcule por você?', 'Yikes. Want me to recalculate for you?']],
        ganhou: [['Missão cumprida. Próximo!', 'Mission accomplished. Next!']],
        perdeu: [['Você me pegou. Respeito.', 'You got me. Respect.']],
        empate: [['Empate técnico. Revanche?', 'Technical tie. Rematch?']],
      } },
    { id: 'jarvis', nome: 'J.A.R.V.I.S.', nivel: 4, cor: '#3fb6d9', de: ['o primeiro mordomo do Tony', 'Tony’s first butler'], estilo: ['Educado até quando ganha', 'Polite even when winning'],
      fala: {
        oi: [['Boa tarde. Será um prazer perder para você. Ou não.', 'Good afternoon. It will be a pleasure to lose to you. Or not.']],
        vez: [['Se me permite, é a minha vez.', 'If you’ll allow me, it is my turn.']],
        acertou: [['Se me permite, essa era bem óbvia.', 'If I may, that one was rather obvious.']],
        errou: [['Peço desculpas. Um raro lapso.', 'My apologies. A rare lapse.']],
        voceErrou: [['Que pena. Posso sugerir mais cautela?', 'A pity. May I suggest more caution?']],
        ganhou: [['Vitória registrada. Devo preparar um chá?', 'Victory logged. Shall I prepare some tea?']],
        perdeu: [['Muito bem jogado. Vou atualizar meus protocolos.', 'Very well played. I shall update my protocols.']],
        empate: [['Um empate. Bastante civilizado.', 'A draw. Quite civilized.']],
      } },
    { id: 'visao', nome: 'Visão', en: 'Vision', nivel: 5, cor: '#c8a52a', de: ['a IA que ganhou corpo', 'the AI that got a body'], estilo: ['Calmo e quase não erra', 'Calm and rarely wrong'],
      fala: {
        oi: [['Cada partida é uma chance de entender vocês um pouco mais.', 'Every match is a chance to understand you a little better.']],
        vez: [['Estou considerando todas as possibilidades.', 'I am considering every possibility.']],
        acertou: [['Era a resposta mais provável.', 'It was the most likely answer.']],
        errou: [['Interessante. Até eu posso errar.', 'Interesting. Even I can be wrong.']],
        voceErrou: [['Errar é muito humano. É bonito, de certa forma.', 'To err is very human. It is beautiful, in a way.']],
        ganhou: [['Venci. Mas aprendi com você.', 'I won. But I learned from you.']],
        perdeu: [['Você venceu. Isso me deixa curioso.', 'You won. That makes me curious.']],
        empate: [['Empate. Um equilíbrio raro.', 'A draw. A rare balance.']],
      } },
    { id: 'ultron', nome: 'Ultron', nivel: 6, cor: '#c8321f', de: ['a IA que quis acabar com tudo', 'the AI that wanted to end everything'], estilo: ['Arrogante e não perdoa erro', 'Arrogant, punishes every mistake'],
      fala: {
        oi: [['Vocês chamam isso de jogo. Eu chamo de extinção.', 'You call this a game. I call it extinction.']],
        vez: [['Minha vez. A sua já era.', 'My turn. Yours is over.']],
        acertou: [['Previsível. Como toda a sua espécie.', 'Predictable. Like your whole species.']],
        errou: [['Isso não aconteceu.', 'That did not happen.']],
        voceErrou: [['Errou. Eu sabia que você ia errar.', 'Wrong. I knew you would be.']],
        ganhou: [['Mais uma vitória da máquina sobre a carne.', 'Another win for the machine over the flesh.']],
        perdeu: [['Isso… não estava nos meus cálculos.', 'This… was not in my calculations.']],
        empate: [['Empate? Inaceitável.', 'A draw? Unacceptable.']],
      } },
  ]
  const porId = Object.fromEntries(IAS.map((x) => [x.id, x]))

  // ---------- o que fica guardado: a IA escolhida e quem você já venceu em cada jogo ----------
  const le = () => { try { const d = JSON.parse(localStorage.getItem(CHAVE) || '{}'); return d && typeof d === 'object' ? d : {} } catch (e) { return {} } }
  const grava = (d) => { try { localStorage.setItem(CHAVE, JSON.stringify(d)) } catch (e) {} }
  const atual = () => porId[le().ia] || porId.jarvis
  function escolher(id) { if (!porId[id]) return; const d = le(); d.ia = id; grava(d) }
  const vencidas = (jogo) => { const v = (le().v || {})[jogo]; return v && typeof v === 'object' ? v : {} }
  function venceu(jogo, id) {
    if (!porId[id]) return
    const d = le()
    d.v = d.v || {}
    d.v[jogo] = { ...(d.v[jogo] || {}), [id]: 1 }
    grava(d)
    const todas = new Set(Object.values(d.v).flatMap((x) => Object.keys(x || {})).filter((k) => porId[k]))
    if (raiz.Conquistas) { raiz.Conquistas.maximo('ias', todas.size); if (id === 'ultron') raiz.Conquistas.liga('ultron') }
  }

  // ---------- na tela ----------
  const nomeDe = (ia) => (ia.en ? t(ia.nome, ia.en) : ia.nome)
  const avatar = (id, cls = '') => { const ia = porId[id]; return ia ? `<svg class="ia-rosto ${cls}" viewBox="0 0 40 40" aria-hidden="true">${ROSTO[id]}</svg>` : '' }
  const pontos = (n) => `<span class="ia-nivel" aria-label="${t('nível', 'level')} ${n}">${[1, 2, 3, 4, 5, 6].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`

  // o seletor de adversário, com a escada de vitórias daquele jogo. attr: o data-* que o jogo usa nos botões.
  function escolha(attr, jogo) {
    const sel = atual()
    const ok = vencidas(jogo)
    const quantas = IAS.filter((x) => ok[x.id]).length
    return `<div class="ias-escolha">
      <p class="ias-escada"><b>${t('Escada das IAs', 'AI Ladder')}</b> · ${quantas === IAS.length ? t('você venceu todas!', 'you beat them all!') : t(`você venceu ${quantas} de ${IAS.length}`, `you beat ${quantas} of ${IAS.length}`)}</p>
      <div class="ias">${IAS.map((x) => `<button class="ia" type="button" data-${attr}="ia" data-v="${x.id}" aria-pressed="${sel === x}" style="--ia:${x.cor}">
        ${avatar(x.id)}<b>${nomeDe(x)}</b>${pontos(x.nivel)}<small>${t(x.estilo[0], x.estilo[1])}</small>${ok[x.id] ? `<em class="ia-ok">${t('vencida', 'beaten')}</em>` : ''}</button>`).join('')}</div>
    </div>`
  }

  // a IA fala: um balão no alto da tela por alguns segundos. chance: de 0 a 1 (padrão: sempre)
  let caixa = null
  let some = 0
  function falar(id, momento, chance = 1) {
    const ia = porId[id]
    const linhas = ia && ia.fala[momento]
    if (!linhas || Math.random() > chance) return
    const [pt, en] = linhas[Math.floor(Math.random() * linhas.length)]
    if (!caixa) {
      caixa = document.createElement('div')
      caixa.className = 'ia-fala'
      caixa.setAttribute('role', 'status')
      caixa.addEventListener('click', () => caixa.classList.remove('on'))
      document.body.appendChild(caixa)
    }
    caixa.style.setProperty('--ia', ia.cor)
    caixa.innerHTML = `${avatar(id)}<div><small>${nomeDe(ia)}</small><p>${t(pt, en)}</p></div>`
    caixa.classList.remove('on')
    void caixa.offsetWidth // reinicia a animação
    caixa.classList.add('on')
    clearTimeout(some)
    some = setTimeout(() => caixa.classList.remove('on'), 4200)
  }

  raiz.IAs = { LISTA: IAS, porId, atual, escolher, vencidas, venceu, nomeDe, avatar, escolha, falar }
})(typeof window !== 'undefined' ? window : globalThis)
