// Grade do Multiverso: as categorias das linhas e colunas. Os personagens são os 154 de HQ do Draft (todos têm capa).
// Cada categoria diz quem vale: uma lista de chaves escrita à mão, ou uma conta em cima dos dados do Draft.
// nivel 1 = simples (mulher, voa, usa capa), nivel 2 = mais esperto (fase do MCU, tem irmão, já usou uma Joia).
// grupo: duas categorias do mesmo grupo nunca se cruzam (Fase 3 x Fase 4, anos 60 x anos 70…).
(function (raiz) {
  const D = raiz.DRAFT_DATA
  const L = (s) => new Set(s.split(/\s+/).filter(Boolean))

  // estreia que a turma conhece (o Draft às vezes guarda um personagem antigo com o mesmo nome)
  const ANO = { vulture: 1963, loki: 1962, 'jessica-jones': 2001, hercules: 1965, sersi: 1963 }
  const REVISTA = { vulture: 'The Amazing Spider-Man #2', loki: 'Journey into Mystery #85', 'jessica-jones': 'Alias #1', hercules: 'Journey into Mystery Annual #1', sersi: 'Strange Tales #109' }
  const ano = (h) => ANO[h.key] || h.year
  const revista = (h) => REVISTA[h.key] || h.debut || ''
  const por = (h) => h.by || ''

  // ---------- MCU (filmes e séries da Marvel Studios; Netflix não conta) ----------
  const FASE1 = 'iron-man captain-america thor hulk black-widow hawkeye winter-soldier war-machine thanos loki red-skull abomination leader arnim-zola nick-fury odin jane-foster'
  const FASE2 = 'iron-man captain-america thor hulk black-widow hawkeye scarlet-witch vision falcon winter-soldier ant-man wasp war-machine quicksilver thanos loki ultron mandarin arnim-zola ronan star-lord gamora drax rocket groot nebula howard nick-fury odin jane-foster'
  const FASE3 = 'iron-man captain-america thor hulk black-widow hawkeye spider-man black-panther doctor-strange scarlet-witch vision falcon winter-soldier captain-marvel ant-man wasp war-machine thanos loki red-skull dormammu hela ego vulture mysterio zemo ronan killmonger surtur star-lord gamora drax rocket groot mantis nebula howard wong ancient-one nick-fury odin jane-foster valkyrie shuri monica-rambeau'
  const FASE4 = 'thor hulk black-widow hawkeye spider-man doctor-strange scarlet-witch vision falcon winter-soldier captain-marvel war-machine she-hulk daredevil moon-knight shang-chi ms-marvel kate-bishop hercules namor mister-fantastic professor-x kang loki quicksilver green-goblin venom doctor-octopus lizard electro sandman kingpin zemo taskmaster abomination mandarin gorr star-lord drax rocket groot mantis nebula man-thing werewolf clea wong agatha wiccan america-chavez ironheart echo yelena red-guardian us-agent sersi ikaris black-bolt jane-foster valkyrie elsa-bloodstone shuri monica-rambeau'
  const FASE5 = 'thor falcon winter-soldier captain-marvel ant-man wasp war-machine daredevil punisher blade elektra ms-marvel adam-warlock sentry human-torch wolverine deadpool x-23 sabretooth gambit beast kang loki kingpin bullseye taskmaster leader modok high-evolutionary star-lord gamora drax rocket groot mantis nebula agatha wiccan ironheart echo yelena red-guardian us-agent nick-fury valkyrie monica-rambeau'
  const FASE6 = 'mister-fantastic invisible-woman human-torch thing silver-surfer galactus'
  const ULTIMATO = 'iron-man captain-america thor hulk black-widow hawkeye thanos ant-man captain-marvel nebula rocket war-machine spider-man black-panther doctor-strange scarlet-witch falcon winter-soldier gamora groot drax mantis star-lord wasp valkyrie wong shuri loki red-skull ancient-one jane-foster nick-fury howard'

  const C = [
    // ---------- MCU ----------
    { id: 'fase1', grupo: 'mcu', nivel: 2, pt: ['Fase 1 do MCU', 'Apareceu na Fase 1 (de Homem de Ferro até Os Vingadores).'], en: ['MCU Phase 1', 'Appeared in Phase 1 (Iron Man to The Avengers).'], m: L(FASE1) },
    { id: 'fase2', grupo: 'mcu', nivel: 2, pt: ['Fase 2 do MCU', 'Apareceu na Fase 2 (de Homem de Ferro 3 até Homem-Formiga).'], en: ['MCU Phase 2', 'Appeared in Phase 2 (Iron Man 3 to Ant-Man).'], m: L(FASE2) },
    { id: 'fase3', grupo: 'mcu', nivel: 2, pt: ['Fase 3 do MCU', 'Apareceu na Fase 3 (de Guerra Civil até Longe de Casa).'], en: ['MCU Phase 3', 'Appeared in Phase 3 (Civil War to Far From Home).'], m: L(FASE3) },
    { id: 'fase4', grupo: 'mcu', nivel: 2, pt: ['Fase 4 do MCU', 'Apareceu na Fase 4 (de WandaVision até Wakanda Para Sempre, filmes e séries).'], en: ['MCU Phase 4', 'Appeared in Phase 4 (WandaVision to Wakanda Forever, movies and series).'], m: L(FASE4) },
    { id: 'fase5', grupo: 'mcu', nivel: 2, pt: ['Fase 5 do MCU', 'Apareceu na Fase 5 (de Quantumania até Thunderbolts*, filmes e séries).'], en: ['MCU Phase 5', 'Appeared in Phase 5 (Quantumania to Thunderbolts*, movies and series).'], m: L(FASE5) },
    { id: 'mcu', grupo: 'mcu', nivel: 1, pt: ['Já apareceu no MCU', 'Em algum filme ou série da Marvel Studios (as séries da Netflix não contam).'], en: ['Has been in the MCU', 'In any Marvel Studios movie or series (the Netflix shows do not count).'], m: L([FASE1, FASE2, FASE3, FASE4, FASE5, FASE6].join(' ')) },
    { id: 'ultimato', grupo: 'mcu', nivel: 2, pt: ['Apareceu em Ultimato', 'Aparece em Vingadores: Ultimato, nem que seja de relance.'], en: ['In Avengers: Endgame', 'Shows up in Avengers: Endgame, even briefly.'], m: L(ULTIMATO) },
    { id: 'netflix', grupo: 'tv', nivel: 2, pt: ['Série Marvel da Netflix', 'Apareceu em Demolidor, Jessica Jones, Luke Cage, Punho de Ferro, Defensores ou Justiceiro.'], en: ['Marvel Netflix series', 'Appeared in Daredevil, Jessica Jones, Luke Cage, Iron Fist, The Defenders or The Punisher.'],
      m: L('daredevil punisher jessica-jones luke-cage iron-fist elektra kingpin bullseye') },

    // ---------- quem é ----------
    { id: 'mulher', grupo: 'genero', nivel: 1, pt: ['Mulher', 'A personagem é mulher.'], en: ['Woman', 'The character is a woman.'],
      m: L('black-widow scarlet-witch captain-marvel wasp she-hulk spider-gwen spider-woman jessica-jones elektra ms-marvel kate-bishop invisible-woman jean-grey storm rogue kitty-pryde psylocke x-23 emma-frost jubilee domino mystique hela gamora mantis nebula squirrel-girl clea agatha america-chavez ironheart black-cat echo yelena sersi medusa jane-foster valkyrie elsa-bloodstone shuri monica-rambeau enchantress') },
    { id: 'mutante', grupo: 'origem', nivel: 1, pt: ['Mutante', 'Nasceu com o gene X.'], en: ['Mutant', 'Born with the X-gene.'],
      m: L('wolverine cyclops jean-grey storm professor-x magneto beast rogue gambit nightcrawler colossus kitty-pryde psylocke iceman cable x-23 emma-frost jubilee domino quicksilver scarlet-witch apocalypse mystique sabretooth namor') },
    { id: 'naohumano', grupo: 'origem', nivel: 1, pt: ['Não é humano', 'Deus, alienígena, robô, monstro ou ser cósmico.'], en: ['Not human', 'A god, alien, robot, monster or cosmic being.'],
      m: L('thor loki hela odin hercules vision ultron silver-surfer adam-warlock thanos galactus ego dormammu mephisto knull annihilus ronan super-skrull gorr surtur gamora drax rocket groot mantis nebula gladiator howard man-thing shuma-gorath beyonder watcher beta-ray-bill sersi ikaris valkyrie enchantress clea') },
    { id: 'vilao', grupo: 'lado', nivel: 1, pt: ['Já foi vilão', 'É vilão ou anti-herói, ou já passou um tempo do lado do mal.'], en: ['Has been a villain', 'Is a villain or anti-hero, or spent some time on the evil side.'],
      m: new Set([...D.hq.filter((h) => h.s !== 'H').map((h) => h.key), ...L('hawkeye black-widow quicksilver scarlet-witch wonder-man rogue gamora captain-america jean-grey cyclops silver-surfer')]) },
    { id: 'realeza', grupo: 'titulo', nivel: 2, pt: ['Realeza', 'Rei, rainha, príncipe, princesa ou governante de um reino.'], en: ['Royalty', 'A king, queen, prince, princess or ruler of a realm.'],
      m: L('thor loki hela odin black-panther shuri killmonger namor black-bolt medusa storm doctor-doom star-lord dormammu clea hercules valkyrie') },
    { id: 'genio', grupo: 'titulo', nivel: 2, pt: ['Gênio ou cientista', 'Cientista, inventor ou gênio da tecnologia.'], en: ['Genius or scientist', 'A scientist, inventor or tech genius.'],
      m: L('iron-man mister-fantastic hulk ant-man black-panther shuri doctor-doom doctor-octopus lizard green-goblin leader modok high-evolutionary beast professor-x ultron ironheart jane-foster doctor-strange morbius arnim-zola kang mysterio vulture spider-man rocket zemo mister-sinister') },
    { id: 'irmao', grupo: 'familia', nivel: 2, pt: ['Tem irmão ou irmã', 'Na HQ ou no MCU. Adotivo e meio-irmão contam.'], en: ['Has a sibling', 'In the comics or the MCU. Adopted and half-siblings count.'],
      m: L('thor loki hela scarlet-witch quicksilver black-panther shuri human-torch invisible-woman captain-britain psylocke cyclops colossus gamora nebula thanos professor-x juggernaut nightcrawler rogue black-widow yelena wolverine doctor-strange iron-man captain-marvel jessica-jones luke-cage moon-knight shang-chi ms-marvel kate-bishop hercules thing jean-grey emma-frost x-23 odin wiccan mantis black-bolt medusa miles-morales hawkeye falcon winter-soldier wonder-man dormammu nova elsa-bloodstone nick-fury') },
    { id: 'morreu', grupo: 'familia', nivel: 2, pt: ['Morreu e voltou', 'Já morreu (na HQ ou no filme) e voltou depois.'], en: ['Died and came back', 'Has died (comics or movie) and come back later.'],
      m: L('captain-america jean-grey wolverine professor-x cyclops spider-man thor loki hulk vision black-widow hawkeye ultron doctor-octopus green-goblin kraven elektra winter-soldier punisher nova adam-warlock sentry human-torch colossus psylocke nightcrawler gamora groot drax thanos odin red-skull mysterio hercules wasp wonder-man jane-foster moon-knight thing') },

    // ---------- equipes e inimigos ----------
    { id: 'vingador', grupo: 'equipe', nivel: 1, pt: ['Já foi Vingador', 'Fez parte dos Vingadores na HQ ou no MCU.'], en: ['Has been an Avenger', 'Was on the Avengers in the comics or the MCU.'],
      m: L('iron-man captain-america thor hulk black-widow hawkeye spider-man black-panther doctor-strange scarlet-witch vision falcon winter-soldier captain-marvel ant-man wasp war-machine she-hulk miles-morales spider-woman jessica-jones luke-cage iron-fist moon-knight ghost-rider blade shang-chi ms-marvel kate-bishop nova sentry hercules namor mister-fantastic invisible-woman thing human-torch wolverine storm beast rogue quicksilver deadpool squirrel-girl mantis valkyrie jane-foster echo monica-rambeau wonder-man us-agent sersi') },
    { id: 'xmen', grupo: 'equipe', nivel: 1, pt: ['Já foi X-Men', 'Fez parte dos X-Men.'], en: ['Has been an X-Man', 'Was on the X-Men.'],
      m: L('wolverine cyclops jean-grey storm professor-x magneto beast rogue gambit nightcrawler colossus kitty-pryde psylocke iceman cable jubilee emma-frost x-23 namor') },
    { id: 'guardioes', grupo: 'equipe', nivel: 2, pt: ['Já foi Guardião da Galáxia', 'Fez parte dos Guardiões da Galáxia (HQ ou filme).'], en: ['Has been a Guardian', 'Was on the Guardians of the Galaxy (comics or movie).'],
      m: L('star-lord gamora drax rocket groot mantis nebula adam-warlock captain-marvel thing kitty-pryde') },
    { id: 'quarteto', grupo: 'equipe', nivel: 2, pt: ['Já foi do Quarteto', 'Fez parte do Quarteto Fantástico (ou da Fundação Futuro), nem que seja por um tempo.'], en: ['Has been in the Fantastic Four', 'Was on the Fantastic Four (or the Future Foundation), even for a while.'],
      m: L('mister-fantastic invisible-woman human-torch thing she-hulk spider-man black-panther storm ant-man wolverine ghost-rider hulk luke-cage medusa') },
    { id: 'inimigoaranha', grupo: 'lado', nivel: 2, pt: ['Inimigo do Homem-Aranha', 'Já foi inimigo do Homem-Aranha.'], en: ['Spider-Man foe', 'Has been an enemy of Spider-Man.'],
      m: L('green-goblin venom carnage doctor-octopus kingpin vulture mysterio kraven lizard electro sandman rhino morbius black-cat') },

    // ---------- poderes e visual ----------
    { id: 'voa', grupo: 'poder', nivel: 1, pt: ['Voa', 'Voa sozinho ou com traje, asas, prancha ou planador.'], en: ['Can fly', 'Flies alone or with a suit, wings, board or glider.'],
      m: L('iron-man thor vision falcon captain-marvel war-machine human-torch silver-surfer adam-warlock sentry nova storm magneto rogue jean-grey doctor-strange scarlet-witch wasp star-lord green-goblin vulture ultron galactus gladiator captain-britain namor black-bolt monica-rambeau wonder-man ikaris jane-foster beta-ray-bill ironheart modok wiccan') },
    { id: 'mascara', grupo: 'visual', nivel: 1, pt: ['Usa máscara', 'Máscara ou capacete que cobre o rosto.'], en: ['Wears a mask', 'A mask or helmet that covers the face.'],
      m: L('spider-man black-panther daredevil moon-knight deadpool spider-gwen miles-morales spider-man-2099 iron-man war-machine ant-man captain-america hawkeye doctor-doom kang green-goblin mysterio electro zemo taskmaster venom carnage wolverine nova star-lord black-cat ironheart spider-woman captain-britain') },
    { id: 'capa', grupo: 'visual', nivel: 1, pt: ['Usa capa', 'Tem capa no uniforme.'], en: ['Wears a cape', 'Has a cape on the costume.'],
      m: L('thor doctor-strange vision loki doctor-doom magneto storm odin sentry mephisto mister-sinister mysterio adam-warlock wiccan beta-ray-bill jane-foster spider-man-2099 moon-knight') },
    { id: 'pele', grupo: 'visual', nivel: 2, pt: ['Pele não humana', 'Verde, azul, roxa, de metal, de pedra, de fogo…'], en: ['Non-human skin', 'Green, blue, purple, metal, rock, fire…'],
      m: L('hulk she-hulk gamora drax nebula mystique beast nightcrawler thanos ronan silver-surfer vision ultron groot abomination leader man-thing super-skrull annihilus gorr beta-ray-bill surtur dormammu mephisto thing colossus apocalypse venom carnage lizard red-skull adam-warlock') },
    { id: 'arma', grupo: 'poder', nivel: 1, pt: ['Luta com arma', 'Escudo, martelo, arco, espada, lança, armas de fogo…'], en: ['Fights with a weapon', 'Shield, hammer, bow, sword, spear, guns…'],
      m: L('captain-america thor hawkeye kate-bishop black-widow punisher blade elektra deadpool winter-soldier us-agent falcon gamora star-lord drax rocket nebula hela valkyrie jane-foster beta-ray-bill thanos ronan kraven bullseye taskmaster daredevil yelena red-guardian moon-knight shang-chi cable domino ghost-rider odin loki gorr surtur zemo nick-fury hercules psylocke') },
    { id: 'armadura', grupo: 'poder', nivel: 2, pt: ['Armadura ou traje tech', 'Os poderes vêm (ou vêm muito) de uma armadura ou traje tecnológico.'], en: ['Armor or tech suit', 'Their powers come (mostly) from armor or a tech suit.'],
      m: L('iron-man war-machine ironheart ant-man wasp falcon black-panther shuri vulture mysterio rhino doctor-octopus green-goblin kang doctor-doom spider-man') },
    { id: 'magia', grupo: 'poder', nivel: 2, pt: ['Usa magia', 'Feitiços, magia ou poderes místicos.'], en: ['Uses magic', 'Spells, magic or mystic powers.'],
      m: L('doctor-strange scarlet-witch agatha loki wong ancient-one clea dormammu mephisto enchantress shuma-gorath wiccan doctor-doom odin man-thing') },
    { id: 'cura', grupo: 'poder', nivel: 2, pt: ['Fator de cura', 'Se cura sozinho bem mais rápido que um humano.'], en: ['Healing factor', 'Heals much faster than a human.'],
      m: L('wolverine x-23 deadpool sabretooth hulk venom carnage groot ms-marvel blade') },
    { id: 'joia', grupo: 'trivia', nivel: 2, pt: ['Usou uma Joia do Infinito', 'Já segurou ou usou uma Joia do Infinito (HQ ou filme).'], en: ['Used an Infinity Stone', 'Has held or used an Infinity Stone (comics or movie).'],
      m: L('thanos iron-man hulk star-lord drax gamora ronan loki vision scarlet-witch doctor-strange red-skull adam-warlock nebula jane-foster captain-marvel mister-fantastic professor-x namor black-bolt') },
    { id: 'atores', grupo: 'trivia', nivel: 2, pt: ['Mais de um ator já fez', 'Já foi interpretado por mais de um ator (filme ou série, MCU ou não).'], en: ['Played by 2+ actors', 'Has been played by more than one actor (movie or series, MCU or not).'],
      m: L('spider-man hulk human-torch mister-fantastic invisible-woman thing professor-x magneto mystique beast jean-grey cyclops storm quicksilver war-machine venom punisher daredevil elektra kingpin bullseye sabretooth red-skull silver-surfer doctor-doom captain-america thanos kitty-pryde nightcrawler colossus psylocke emma-frost mephisto green-goblin blade ghost-rider nick-fury doctor-strange thor') },
    { id: 'filme', grupo: 'titulo-obra', nivel: 2, pt: ['Nome em título de filme', 'Tem um filme com o nome dele no título (MCU ou não).'], en: ['Name in a movie title', 'Has a movie with their name in the title (MCU or not).'],
      m: L('iron-man thor captain-america hulk black-widow black-panther doctor-strange captain-marvel ant-man wasp spider-man miles-morales shang-chi deadpool wolverine daredevil elektra punisher blade ghost-rider venom carnage morbius kraven howard apocalypse jean-grey silver-surfer ultron') },
    { id: 'serie', grupo: 'titulo-obra', nivel: 2, pt: ['Nome em título de série', 'Tem uma série (live-action ou desenho) com o nome dele no título.'], en: ['Name in a series title', 'Has a series (live-action or cartoon) with their name in the title.'],
      m: L('scarlet-witch vision loki hawkeye moon-knight ms-marvel she-hulk echo agatha daredevil ironheart falcon winter-soldier jessica-jones luke-cage iron-fist punisher hulk spider-man blade iron-man silver-surfer wolverine modok spider-woman') },
    { id: 'nome', grupo: 'nome', nivel: 1, pt: ['"Homem", "Mulher" ou "Garota"', 'O nome tem Homem, Mulher ou Garota (ou Man, Woman, Girl em inglês).'], en: ['"Man", "Woman" or "Girl"', 'The name has Man, Woman or Girl (or Homem, Mulher, Garota in Portuguese).'],
      m: new Set(D.hq.filter((h) => /\b(homem|mulher|garota)\b/i.test(h.n) || /(^|[\s-])(man|woman|girl)(\b|$)/i.test((raiz.IMPOSTOR_EN || {})[h.key] || '')).map((h) => h.key)) },
  ]

  // ---------- contas em cima dos dados do Draft: década de estreia, criador e revista ----------
  const conta = (id, grupo, pt, en, f) => C.push({ id, grupo, nivel: 2, pt, en, m: new Set(D.hq.filter(f).map((h) => h.key)) })
  conta('anos60', 'decada', ['Estreou nos anos 60', 'A primeira aparição na HQ foi entre 1960 e 1969.'], ['Debuted in the 1960s', 'First comic appearance between 1960 and 1969.'], (h) => ano(h) >= 1960 && ano(h) < 1970)
  conta('anos70', 'decada', ['Estreou nos anos 70', 'A primeira aparição na HQ foi entre 1970 e 1979.'], ['Debuted in the 1970s', 'First comic appearance between 1970 and 1979.'], (h) => ano(h) >= 1970 && ano(h) < 1980)
  conta('anos80', 'decada', ['Estreou nos anos 80', 'A primeira aparição na HQ foi entre 1980 e 1989.'], ['Debuted in the 1980s', 'First comic appearance between 1980 and 1989.'], (h) => ano(h) >= 1980 && ano(h) < 1990)
  conta('anos90', 'decada', ['Estreou de 1990 pra cá', 'A primeira aparição na HQ foi em 1990 ou depois.'], ['Debuted 1990 or later', 'First comic appearance in 1990 or later.'], (h) => ano(h) >= 1990)
  conta('stanlee', 'criador', ['Criado por Stan Lee', 'Stan Lee está entre os criadores.'], ['Created by Stan Lee', 'Stan Lee is one of the creators.'], (h) => /Stan Lee/.test(por(h)))
  conta('kirby', 'criador', ['Criado por Jack Kirby', 'Jack Kirby está entre os criadores.'], ['Created by Jack Kirby', 'Jack Kirby is one of the creators.'], (h) => /Kirby/.test(por(h)))
  conta('ditko', 'criador', ['Criado por Steve Ditko', 'Steve Ditko está entre os criadores.'], ['Created by Steve Ditko', 'Steve Ditko is one of the creators.'], (h) => /Ditko/.test(por(h)))
  conta('rev-ff', 'revista', ['Estreou em HQ do Quarteto', 'A primeira aparição foi numa revista Fantastic Four.'], ['Debuted in a Fantastic Four comic', 'First appeared in a Fantastic Four comic.'], (h) => /Fantastic Four/.test(revista(h)))
  conta('rev-aranha', 'revista', ['Estreou em HQ do Aranha', 'A primeira aparição foi em Amazing Fantasy ou Amazing Spider-Man.'], ['Debuted in a Spider-Man comic', 'First appeared in Amazing Fantasy or Amazing Spider-Man.'], (h) => /Amazing (Fantasy|Spider-Man)/.test(revista(h)))
  conta('rev-xmen', 'revista', ['Estreou em HQ dos X-Men', 'A primeira aparição foi numa revista dos X-Men.'], ['Debuted in an X-Men comic', 'First appeared in an X-Men comic.'], (h) => /X-Men/.test(revista(h)))
  conta('rev-thor', 'revista', ['Estreou em HQ do Thor', 'A primeira aparição foi em Journey into Mystery ou numa revista do Thor.'], ['Debuted in a Thor comic', 'First appeared in Journey into Mystery or a Thor comic.'], (h) => /Journey into Mystery|Thor/.test(revista(h)))
  conta('rev-ferro', 'revista', ['Estreou em HQ do Homem de Ferro', 'A primeira aparição foi em Tales of Suspense ou numa revista do Homem de Ferro.'], ['Debuted in an Iron Man comic', 'First appeared in Tales of Suspense or an Iron Man comic.'], (h) => /Tales of Suspense|Iron Man/.test(revista(h)))
  conta('rev-vingadores', 'revista', ['Estreou em HQ dos Vingadores', 'A primeira aparição foi numa revista dos Vingadores.'], ['Debuted in an Avengers comic', 'First appeared in an Avengers comic.'], (h) => /Avengers/.test(revista(h)))

  const porId = Object.fromEntries(C.map((c) => [c.id, c]))
  const chaves = D.hq.map((h) => h.key)
  raiz.GradeDados = { categorias: C, porId, chaves, ano, revista }
})(typeof window !== 'undefined' ? window : globalThis)
