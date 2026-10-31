// Aposto Que Sei: os temas. Cada tema tem a lista dos certos, os "ambíguos" (que dariam briga, então nunca aparecem
// na grade daquele tema) e as pegadinhas (erradas, mas parecidas o bastante pra enganar quem não sabe).
// Os temas de ano, criador e força vêm da mesma ficha do Draft.
(function (raiz) {
  const L = (s) => s.split(/\s+/).filter(Boolean)
  const T = (id, titulo, certos, ambiguos, pegadinhas) => ({ id, titulo, certos: L(certos), ambiguos: L(ambiguos || ''), pegadinhas: L(pegadinhas || '') })

  const FIXOS = [
    T('xmen', 'Já foram dos X-Men', 'wolverine cyclops jean-grey storm beast nightcrawler rogue gambit colossus iceman kitty-pryde psylocke professor-x jubilee',
      'cable x-23 emma-frost magneto quicksilver domino deadpool sabretooth mystique juggernaut captain-britain scarlet-witch',
      'apocalypse mister-sinister onslaught she-hulk spider-woman invisible-woman medusa black-bolt human-torch wonder-man sentry hercules'),
    T('aranha-viloes', 'Inimigos do Homem-Aranha', 'green-goblin doctor-octopus venom lizard electro sandman rhino vulture mysterio kraven carnage morbius kingpin',
      'black-cat', 'bullseye taskmaster leader abomination red-skull zemo modok sabretooth mandarin juggernaut man-thing werewolf'),
    T('xmen-viloes', 'Inimigos clássicos dos X-Men', 'magneto mystique sabretooth juggernaut mister-sinister apocalypse onslaught',
      'emma-frost deadpool', 'green-goblin doctor-doom kang ultron red-skull loki thanos venom leader modok abomination carnage'),
    T('guardioes', 'Guardiões da Galáxia (dos filmes)', 'star-lord gamora drax rocket groot mantis nebula',
      'adam-warlock nova howard', 'ronan ego thanos silver-surfer gladiator captain-marvel super-skrull high-evolutionary annihilus beta-ray-bill valkyrie'),
    T('quarteto', 'Quarteto Fantástico', 'mister-fantastic invisible-woman human-torch thing',
      'she-hulk medusa ant-man storm black-panther spider-man', 'doctor-doom silver-surfer galactus namor iceman beast molecule-man wasp black-bolt nova'),
    T('vingadores-hq', 'Vingadores originais (a HQ de 1963)', 'iron-man thor hulk ant-man wasp', 'captain-america loki',
      'hawkeye black-widow vision scarlet-witch quicksilver falcon black-panther doctor-strange spider-man war-machine hercules wonder-man'),
    T('vingadores-2012', 'Eram do time no primeiro filme dos Vingadores (2012)', 'iron-man captain-america thor hulk black-widow hawkeye', '',
      'nick-fury loki falcon scarlet-witch vision war-machine black-panther ant-man spider-man captain-marvel winter-soldier quicksilver'),
    T('netflix', 'Estavam nas séries da Netflix', 'daredevil jessica-jones luke-cage iron-fist punisher elektra kingpin bullseye', '',
      'moon-knight echo ms-marvel she-hulk blade black-cat taskmaster shang-chi werewolf kate-bishop yelena ghost-rider elsa-bloodstone'),
    T('magia', 'Usam magia', 'doctor-strange wong scarlet-witch agatha clea ancient-one dormammu mephisto enchantress wiccan shuma-gorath loki',
      'hela doctor-doom werewolf man-thing ghost-rider america-chavez thor vision odin surtur knull moon-knight',
      'iron-man captain-marvel jean-grey professor-x silver-surfer black-bolt sentry galactus high-evolutionary ultron iceman storm beast'),
    T('alienigenas', 'Alienígenas (não nasceram na Terra)', 'thanos gamora groot rocket ronan nebula ego galactus silver-surfer super-skrull gladiator beta-ray-bill watcher',
      'drax mantis adam-warlock annihilus knull star-lord captain-marvel nova thor loki hela odin black-bolt medusa sersi ikaris beyonder molecule-man dormammu mephisto surtur shuma-gorath',
      'kang high-evolutionary ultron vision sentry hulk iron-man wonder-man she-hulk quicksilver'),
    T('asgard', 'Asgardianos', 'thor hela odin valkyrie enchantress', 'loki jane-foster beta-ray-bill',
      'surtur hercules gorr sersi ikaris mephisto dormammu captain-marvel silver-surfer doctor-strange wonder-man sentry'),
    T('aranhas', 'Heróis-aranha', 'spider-man miles-morales spider-gwen spider-woman spider-man-2099', 'venom black-cat carnage',
      'black-widow ant-man wasp scarlet-witch kate-bishop squirrel-girl moon-knight silver-surfer nova falcon hawkeye black-panther'),
    T('mcu-viloes', 'Foram vilões num FILME do MCU', 'loki ultron thanos hela killmonger kang ronan abomination gorr high-evolutionary red-skull zemo vulture mysterio electro green-goblin doctor-octopus sandman lizard ego dormammu surtur arnim-zola taskmaster galactus mandarin leader modok',
      'nebula doctor-doom venom morbius kraven rhino carnage mystique magneto sabretooth juggernaut apocalypse knull',
      'red-guardian yelena agatha kingpin mephisto werewolf bullseye black-cat onslaught mister-sinister'),
    T('disney', 'Têm o nome no título de uma série do Disney+', 'scarlet-witch vision loki falcon winter-soldier hawkeye moon-knight ms-marvel she-hulk echo agatha daredevil ironheart',
      'werewolf punisher spider-man', 'kate-bishop yelena shang-chi black-widow captain-marvel wong kingpin nick-fury black-panther thor iron-man captain-america'),
    T('sem-poderes', 'Não têm superpoderes (só treino ou tecnologia)', 'black-widow hawkeye kate-bishop punisher nick-fury iron-man war-machine falcon kingpin bullseye zemo yelena ironheart mysterio vulture',
      'taskmaster winter-soldier shang-chi moon-knight elektra kraven doctor-octopus red-skull elsa-bloodstone howard ant-man wasp arnim-zola doctor-doom us-agent red-guardian black-cat echo',
      'captain-america daredevil black-panther iron-fist spider-man wolverine luke-cage jessica-jones deadpool squirrel-girl ms-marvel she-hulk blade'),
    T('estalo', 'Viraram pó no estalo do Thanos (Guerra Infinita)', 'spider-man black-panther doctor-strange scarlet-witch falcon winter-soldier star-lord drax mantis groot nick-fury wasp shuri',
      '', 'ant-man hawkeye loki gamora vision rocket nebula war-machine iron-man thor hulk black-widow captain-america valkyrie captain-marvel wong'),
  ]

  // temas tirados da ficha do Draft (ano de estreia, criadores, força)
  const DATA_AMBIGUOS = L('loki spider-gwen human-torch vision captain-marvel ms-marvel x-23 yelena')
  function daFicha(D) {
    const k = (f) => D.hq.filter(f).map((h) => h.key).filter((x) => !DATA_AMBIGUOS.includes(x))
    return [
      { id: 'anos60', titulo: 'Estrearam nos quadrinhos nos anos 60', certos: k((h) => h.year >= 1960 && h.year <= 1969), ambiguos: DATA_AMBIGUOS,
        pegadinhas: k((h) => (h.year >= 1970 && h.year <= 1979) || (h.year >= 1939 && h.year <= 1959)) },
      { id: 'kirby', titulo: 'Criados (ou cocriados) por Jack Kirby', certos: k((h) => /Kirby/.test(h.by)), ambiguos: DATA_AMBIGUOS,
        pegadinhas: k((h) => !/Kirby/.test(h.by) && /Ditko|Romita|Lee/.test(h.by)) },
      { id: 'forca5', titulo: 'Têm força 5 no Draft (a máxima)', certos: k((h) => h.f === 5), ambiguos: [], pegadinhas: k((h) => h.f === 4) },
      { id: 'pos2000', titulo: 'Estrearam nos quadrinhos de 2000 pra cá', certos: k((h) => h.year >= 2000), ambiguos: DATA_AMBIGUOS,
        pegadinhas: k((h) => h.year >= 1985 && h.year <= 1999) },
    ]
  }

  // monta a grade de 16 capas: k certos + pegadinhas + o resto sorteado (nunca os ambíguos)
  function montar(D, tema, rnd = Math.random) {
    const idx = new Map(D.hq.map((h, i) => [h.key, i]))
    const emb = (l) => { const a = [...l]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [a[i], a[j]] = [a[j], a[i]] } return a }
    const tem = (key) => idx.has(key)
    const certos = emb(tema.certos.filter(tem))
    const k = Math.min(certos.length, 4 + Math.floor(rnd() * 5))
    const fora = new Set([...tema.certos, ...tema.ambiguos])
    const pegas = emb(tema.pegadinhas.filter((x) => tem(x) && !fora.has(x))).slice(0, Math.min(7, 16 - k))
    const resto = emb(D.hq.map((h) => h.key).filter((x) => !fora.has(x) && !pegas.includes(x))).slice(0, 16 - k - pegas.length)
    const grade = emb([...certos.slice(0, k), ...pegas, ...resto]).map((x) => idx.get(x))
    return { id: tema.id, titulo: tema.titulo, k, grade, certos: grade.filter((i) => tema.certos.includes(D.hq[i].key)) }
  }

  const todos = (D) => [...FIXOS, ...daFicha(D)]
  raiz.ApostoTemas = { todos, montar, FIXOS }
})(typeof window !== 'undefined' ? window : globalThis)
