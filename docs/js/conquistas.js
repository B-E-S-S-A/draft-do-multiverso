// Conquistas: badges coloridas que a pessoa vai ganhando jogando. A cor mostra a raridade, e cada uma é um título pra exibir na carteirinha.
// As de Doomsday são especiais: só dá pra ganhar durante o evento. Tudo fica guardado neste aparelho.
(function (raiz) {
  const t = (pt, en) => raiz.Lingua.t(pt, en)
  const CHAVE = 'mvd-conquistas'
  const RARIDADES = { comum: { cor: '#b4763a', nome: ['Comum', 'Common'] }, rara: { cor: '#2b7fd4', nome: ['Rara', 'Rare'] }, epica: { cor: '#8c52ce', nome: ['Épica', 'Epic'] }, lendaria: { cor: '#d99a12', nome: ['Lendária', 'Legendary'] }, doomsday: { cor: '#1f9d5b', nome: ['Doomsday', 'Doomsday'] } }
  const B = (id, r, i, pt, en, cpt, cen, teste) => ({ id, r, i, nome: [pt, en], como: [cpt, cen], teste })
  const LISTA = [
    // dias de destino
    B('primeiro', 'comum', 'estrela', 'Recruta do Destino', 'Recruit of Doom', 'Faça seu primeiro desafio do dia', 'Finish your first daily challenge', (c) => c.desafios >= 1),
    B('dez', 'rara', 'escudo', 'Dez Arquivos', 'Ten Files', 'Faça 10 desafios do dia', 'Finish 10 daily challenges', (c) => c.desafios >= 10),
    B('seq3', 'comum', 'chama', 'Três Seguidos', 'Three in a Row', 'Jogue 3 dias seguidos', 'Play 3 days in a row', (c) => c.seq >= 3),
    B('seq7', 'rara', 'chama', 'Semana de Ferro', 'Iron Week', 'Jogue 7 dias seguidos', 'Play 7 days in a row', (c) => c.seq >= 7),
    B('seq14', 'epica', 'chama', 'Quinzena Implacável', 'Relentless Fortnight', 'Jogue 14 dias seguidos', 'Play 14 days in a row', (c) => c.seq >= 14),
    B('seq30', 'lendaria', 'chama', 'Inquebrável', 'Unbreakable', 'Jogue 30 dias seguidos', 'Play 30 days in a row', (c) => c.seq >= 30),
    B('ficha1', 'epica', 'olho', 'Olho do Vigia', 'Watcher’s Eye', 'Acerte a ficha do dia na 1ª pista', 'Get the daily file on the 1st clue', (c) => c.ficha1 >= 1),
    B('perfeito', 'epica', 'x', 'Grid Perfeito', 'Perfect Grid', 'Complete a Grade do dia sem errar', 'Complete the daily Grid with no misses', (c) => c.perfeito >= 1),
    // jogos, valendo contra gente
    B('grade1', 'comum', 'martelo', 'Dono da Casa', 'Square Owner', 'Vença uma Grade online', 'Win a Grid game online', (c) => c.w_grade >= 1),
    B('grade10', 'lendaria', 'coroa', 'Senhor da Grade', 'Lord of the Grid', 'Vença 10 Grades online', 'Win 10 Grid games online', (c) => c.w_grade >= 10),
    B('arquivo1', 'comum', 'olho', 'Detetive', 'Detective', 'Vença um Arquivo Secreto online', 'Win a Secret File game online', (c) => c.w_arquivo >= 1),
    B('vidente', 'epica', 'raio', 'Vidente', 'Psychic', 'Acerte uma ficha na 1ª pista, em partida', 'Get a file on the 1st clue in a match', (c) => c.pista1 >= 1),
    B('aposto1', 'comum', 'estrela', 'Sabichão', 'Know-It-All', 'Vença um Aposto Que Sei online', 'Win a Bet I Know game online', (c) => c.w_aposto >= 1),
    B('draft1', 'comum', 'coracao', 'Leiloeiro', 'Auctioneer', 'Termine um Draft online', 'Finish a Draft online', (c) => c.draft >= 1),
    B('lab1', 'rara', 'raio', 'Cientista Maluco', 'Mad Scientist', 'Tenha o herói campeão no Laboratório online', 'Have the champion hero in the Lab online', (c) => c.w_lab >= 1),
    B('labvigia', 'epica', 'olho', 'Escolhido do Vigia', 'Chosen by the Watcher', 'Ganhe um duelo no desempate do Uatu', 'Win a duel on Uatu’s tie-break', (c) => c.labvigia >= 1),
    // partida aleatória
    B('ale1', 'comum', 'estrela', 'Porta do Multiverso', 'Multiverse Door', 'Jogue uma partida aleatória', 'Play a random match', (c) => c.ale >= 1),
    B('alew', 'rara', 'garras', 'Caçador de Estranhos', 'Stranger Hunter', 'Vença alguém numa partida aleatória', 'Beat someone in a random match', (c) => c.w_ale >= 1),
    B('ale10', 'lendaria', 'garras', 'Terror da Fila', 'Terror of the Queue', 'Vença 10 partidas aleatórias', 'Win 10 random matches', (c) => c.w_ale >= 10),
    B('cobra', 'rara', 'aranha', 'Hail Hidra', 'Hail Hydra', 'Faça 30 pontos na Cobra da Hidra', 'Score 30 in Hydra’s Snake', (c) => c.cobra >= 30),
    // segredos
    B('uatu', 'rara', 'olho', 'Invocador', 'Summoner', 'Segredo: chame o Vigia', 'Secret: summon the Watcher', (c) => c.uatu >= 1),
    B('coruja', 'comum', 'caveira', 'Coruja do Multiverso', 'Multiverse Owl', 'Segredo: jogue de madrugada', 'Secret: play in the small hours', (c) => c.coruja >= 1),
    // especiais de doomsday: só durante o evento
    B('dd-todos', 'doomsday', 'coroa', 'Todos os Dias', 'Every Single Day', 'Faça os 40 Dias de Destino', 'Finish all 40 Days of Doom', (c) => c.desafios >= 40),
    B('dd-patente', 'doomsday', 'escudo', 'Sobrevivente', 'Survivor', 'Chegue à patente máxima', 'Reach the top rank', (c) => c.ddPatente >= 1),
    B('dd-ultimo', 'doomsday', 'caveira', 'O Último Arquivo', 'The Last File', 'Acerte a ficha do Doutor Destino na estreia', 'Get Doctor Doom’s file on premiere day', (c) => c.ddUltimo >= 1),
    B('dd-estreia', 'doomsday', 'estrela', 'Testemunha da Estreia', 'Premiere Witness', 'Entre no site no dia da estreia', 'Visit the site on premiere day', (c) => c.ddEstreia >= 1),
    B('dd-subdito', 'doomsday', 'coroa', 'Súdito de Latvéria', 'Subject of Latveria', 'Jogue um jogo tomado pelo Destino', 'Play a game taken by Doom', (c) => c.ddSubdito >= 1),
    B('dd-resiste', 'doomsday', 'raio', 'Resistência', 'The Resistance', 'Jogue os 7 dias da invasão', 'Play all 7 days of the invasion', (c) => c.ddResiste >= 7),
  ]
  const porId = Object.fromEntries(LISTA.map((b) => [b.id, b]))
  const memoria = {}
  const guarda = { ler() { try { return JSON.parse(raiz.localStorage.getItem(CHAVE) || '{}') } catch (e) { return memoria.dado || {} } }, gravar(x) { memoria.dado = x; try { raiz.localStorage.setItem(CHAVE, JSON.stringify(x)) } catch (e) {} } }
  const lido = guarda.ler()
  const e = { c: lido.c && typeof lido.c === 'object' ? lido.c : {}, g: lido.g && typeof lido.g === 'object' ? lido.g : {} }
  const contadores = new Proxy(e.c, { get: (o, k) => o[k] || 0 })

  const fila = []
  function avisar(b) {
    if (typeof document === 'undefined') return
    fila.push(b)
    if (fila.length === 1) mostrar()
  }
  function mostrar() {
    const b = fila[0]
    if (!b) return
    const x = document.createElement('div')
    x.className = 'cq-toast'
    x.style.setProperty('--c', RARIDADES[b.r].cor)
    x.setAttribute('role', 'status')
    const svg = raiz.DestinoCartao ? raiz.DestinoCartao.seloSvg(b.i) : ''
    x.innerHTML = `<i>${svg}</i><span><small>${t('Nova conquista', 'New badge')} · ${t(RARIDADES[b.r].nome[0], RARIDADES[b.r].nome[1])}</small><b></b></span>`
    x.querySelector('b').textContent = t(b.nome[0], b.nome[1])
    document.body.appendChild(x)
    if (raiz.Sfx && raiz.Sfx.on) raiz.Sfx.sold()
    setTimeout(() => { x.remove(); fila.shift(); mostrar() }, 3200)
  }

  function avalia() {
    let mudou = false
    for (const b of LISTA) {
      if (e.g[b.id] || !b.teste(contadores)) continue
      e.g[b.id] = Date.now()
      mudou = true
      avisar(b)
    }
    return mudou
  }
  const salva = () => { avalia(); guarda.gravar(e) }
  const marca = (k, n = 1) => { e.c[k] = (e.c[k] || 0) + n; salva() }
  const maximo = (k, v) => { if (v > (e.c[k] || 0)) { e.c[k] = v; salva() } }
  const liga = (k) => maximo(k, 1)
  // venceu um jogo contra gente; se foi em partida aleatória, conta pra essas também
  function vitoria(jogo) { marca('w_' + jogo); if (raiz.Fila && raiz.Fila.aleatoria()) marca('w_ale') }
  const tem = (id) => !!e.g[id]
  const ganhas = () => LISTA.filter((b) => e.g[b.id])

  raiz.Conquistas = { LISTA, RARIDADES, porId, marca, maximo, liga, vitoria, tem, ganhas, contadores }
})(typeof window !== 'undefined' ? window : globalThis)
