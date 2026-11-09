// A invasão do Doutor Destino: na última semana antes da estreia ele toma um jogo por dia, e na estreia o site inteiro é dele.
// Os jogos continuam funcionando; muda o nome, a cor e quem fala no lugar do Uatu. Tudo pela data de Brasília.
(function (raiz) {
  const t = (pt, en) => raiz.Lingua.t(pt, en)
  const ORDEM = [['2026-12-10', 'missao'], ['2026-12-11', 'impostor'], ['2026-12-12', 'aposto'], ['2026-12-13', 'draft'], ['2026-12-14', 'lab'], ['2026-12-15', 'arquivo'], ['2026-12-16', 'grade']]
  const ESTREIA = '2026-12-17'
  const FIM = '2026-12-20' // o fim de semana da estreia; depois a banca volta ao normal
  const NOMES = {
    draft: ['Leilão de <em>Latvéria</em>', 'Latverian <em>Auction</em>'], impostor: ['Impostor de <em>Latvéria</em>', 'Latverian <em>Impostor</em>'], aposto: ['Aposto Que <em>Destino</em> Sabe', '<em>Doom</em> Bets He Knows'],
    grade: ['Grade de <em>Latvéria</em>', 'Latverian <em>Grid</em>'], arquivo: ['Arquivo de <em>Latvéria</em>', 'Latverian <em>File</em>'], lab: ['Laboratório de <em>Destino</em>', '<em>Doom’s</em> Laboratory'], missao: ['Missão de <em>Destino</em>', '<em>Doom’s</em> Mission'],
  }
  const dia = () => raiz.DestinoMotor.diaDe()
  const fase = () => { const d = dia(); return d < ORDEM[0][0] || d > FIM ? 'nada' : d >= ESTREIA ? 'total' : 'invadindo' }
  const tomados = () => (fase() === 'nada' ? [] : fase() === 'total' ? ORDEM.map((x) => x[1]) : ORDEM.filter(([d]) => dia() >= d).map((x) => x[1]))
  const tomado = (jogo) => (fase() === 'total' ? true : tomados().includes(jogo))
  let atual = 'home'
  let avisou = false

  // ---------- o que Doom diz no lugar do Uatu ----------
  const GERAL = [
    () => t('Destino não pede. Destino toma.', 'Doom does not ask. Doom takes.'),
    () => t('Este jogo finalmente tem um governante decente.', 'This game finally has a decent ruler.'),
    () => t('Joguem. Destino permite. Por enquanto.', 'Play. Doom allows it. For now.'),
    () => t('O Vigia pode olhar. É tudo o que ele sabe fazer.', 'The Watcher may look. It is all he knows how to do.'),
    () => t('Latvéria agradece sua presença obrigatória.', 'Latveria thanks you for your mandatory attendance.'),
    () => t('Reed Richards jamais faria um jogo melhor.', 'Reed Richards could never make a better game.'),
  ]
  const FIM_JOGO = [
    (d) => (d.nome ? t(`${d.nome} venceu. Destino permitiu.`, `${d.nome} won. Doom allowed it.`) : t('Acabou. Destino decidiu assim.', 'It is over. Doom decided so.')),
    () => t('Uma vitória pequena, num reino que é meu.', 'A small victory, in a kingdom that is mine.'),
  ]
  const ERRO = [
    () => t('Errou. Destino anotou seu nome.', 'Wrong. Doom has written down your name.'),
    () => t('Patético. Até o Richards acertaria.', 'Pathetic. Even Richards would get that.'),
    () => t('Em Latvéria, isso é crime.', 'In Latveria, that is a crime.'),
  ]
  const falasDe = (tipo) => (/fim|campeao/.test(tipo) ? FIM_JOGO : /erro|errou|zerou/.test(tipo) ? ERRO : GERAL)

  // ---------- como isso aparece no site ----------
  function marcar(jogo) {
    atual = jogo
    document.documentElement.classList.toggle('doom-on', tomado(jogo))
    if (raiz.Conquistas) { if (tomado(jogo) && jogo !== 'home') raiz.Conquistas.liga('ddSubdito'); if (dia() === ESTREIA) raiz.Conquistas.liga('ddEstreia') }
    // na tela inicial, durante a invasão, o Uatu tenta avisar uma vez (ele não pode interferir)
    if (jogo === 'home' && fase() === 'invadindo' && !avisou && raiz.Uatu) { avisou = true; setTimeout(() => { if (atual === 'home' && !tomado('home')) raiz.Uatu.falar(t('Eu não posso interferir… mas olhem o que ele já tomou.', 'I cannot interfere… but look at what he has already taken.')) }, 2500) }
  }
  function letreiro(jogo, original) {
    if (!tomado(jogo)) return original
    if (jogo === 'home') return [t('Banca de <em>Latvéria</em>', 'Latverian <em>Newsstand</em>'), t('tudo aqui agora pertence a Destino', 'everything here now belongs to Doom')]
    if (!NOMES[jogo]) return original
    return [t(NOMES[jogo][0], NOMES[jogo][1]), t('este jogo agora pertence a Destino', 'this game now belongs to Doom')]
  }
  // os cartões dos jogos já tomados, na tela inicial
  function pintarHome(raizHome) {
    for (const [, jogo] of ORDEM) {
      if (!tomado(jogo)) continue
      const botao = raizHome.querySelector(`[data-ir="${jogo}"]`)
      const cartao = botao && botao.closest('.jogo')
      if (!cartao) continue
      cartao.classList.add('doom')
      cartao.querySelector('h2').innerHTML = t(NOMES[jogo][0], NOMES[jogo][1])
      cartao.insertAdjacentHTML('afterbegin', `<b class="doom-selo">${t('Tomado por Destino', 'Taken by Doom')}</b>`)
    }
  }
  const status = () => (fase() === 'invadindo' ? t(`Destino já tomou ${tomados().length} de ${ORDEM.length} jogos.`, `Doom has taken ${tomados().length} of ${ORDEM.length} games.`) : '')

  raiz.Invasao = { ORDEM, ESTREIA, FIM, fase, tomados, tomado, marcar, letreiro, pintarHome, status, falasDe, aqui: () => tomado(atual), GERAL }
})(typeof window !== 'undefined' ? window : globalThis)
