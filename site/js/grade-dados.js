// Grade do Multiverso: as categorias (temas) das linhas e colunas. Os personagens são os 154 de HQ do Draft (todos têm capa).
// Cada categoria diz quem vale: uma lista de chaves escrita à mão, ou uma conta em cima dos dados do Draft.
// nivel 1 = simples (mulher, voa, usa capa), nivel 2 = mais esperto (fase do MCU, tem irmão, mais de um ator).
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
    { id: 'atores', grupo: 'trivia', nivel: 2, pt: ['Mais de um ator já fez', 'Já foi interpretado por mais de um ator (filme ou série, MCU ou não).'], en: ['Played by 2+ actors', 'Has been played by more than one actor (movie or series, MCU or not).'],
      m: L('spider-man hulk human-torch mister-fantastic invisible-woman thing professor-x magneto mystique beast jean-grey cyclops storm quicksilver war-machine venom punisher daredevil elektra kingpin bullseye sabretooth red-skull silver-surfer doctor-doom captain-america thanos kitty-pryde nightcrawler colossus psylocke emma-frost mephisto green-goblin blade ghost-rider nick-fury doctor-strange thor') },
    { id: 'filme', grupo: 'titulo-obra', nivel: 2, pt: ['Nome em título de filme', 'Tem um filme com o nome dele no título (MCU ou não).'], en: ['Name in a movie title', 'Has a movie with their name in the title (MCU or not).'],
      m: L('iron-man thor captain-america hulk black-widow black-panther doctor-strange captain-marvel ant-man wasp spider-man miles-morales shang-chi deadpool wolverine daredevil elektra punisher blade ghost-rider venom carnage morbius kraven howard apocalypse jean-grey silver-surfer ultron') },
    { id: 'serie', grupo: 'titulo-obra', nivel: 2, pt: ['Nome em título de série', 'Tem uma série (live-action ou desenho) com o nome dele no título.'], en: ['Name in a series title', 'Has a series (live-action or cartoon) with their name in the title.'],
      m: L('scarlet-witch vision loki hawkeye moon-knight ms-marvel she-hulk echo agatha daredevil ironheart falcon winter-soldier jessica-jones luke-cage iron-fist punisher hulk spider-man blade iron-man silver-surfer wolverine modok spider-woman') },
    { id: 'nome', grupo: 'nome', nivel: 1, pt: ['"Homem", "Mulher" ou "Garota"', 'O nome tem Homem, Mulher ou Garota (ou Man, Woman, Girl em inglês).'], en: ['"Man", "Woman" or "Girl"', 'The name has Man, Woman or Girl (or Homem, Mulher, Garota in Portuguese).'],
      m: new Set(D.hq.filter((h) => /\b(homem|mulher|garota)\b/i.test(h.n) || /(^|[\s-])(man|woman|girl)(\b|$)/i.test((raiz.IMPOSTOR_EN || {})[h.key] || '')).map((h) => h.key)) },
  ]

  // ---------- mais temas: visual, nome, origem, vida, equipes e telas ----------
  const novo = (id, grupo, pt, en, m) => C.push({ id, grupo, nivel: 2, pt, en, m: L(m) })
  // visual e nome
  novo('garras', 'garras', ['Tem garras', 'Garras de verdade ou na roupa (as do traje de pantera contam).'], ['Has claws', 'Real claws or on the suit (panther-suit claws count).'],
    'wolverine x-23 sabretooth black-panther killmonger shuri black-cat lizard venom carnage werewolf')
  novo('careca', 'cabelo', ['Careca', 'Não tem cabelo nenhum na cabeça.'], ['Bald', 'No hair at all on the head.'],
    'professor-x kingpin watcher ancient-one modok silver-surfer vision drax thing gorr thanos nebula wong red-skull apocalypse abomination')
  novo('verde', 'cor', ['Verde é a cor dele', 'Pele, roupa ou marca registrada verde.'], ['Green is their color', 'Green skin, costume or trademark look.'],
    'hulk she-hulk gamora green-goblin lizard loki doctor-doom super-skrull leader abomination man-thing enchantress mysterio')
  novo('vermelho', 'cor', ['Vermelho é a cor dele', 'Pele, roupa ou marca registrada vermelha.'], ['Red is their color', 'Red skin, costume or trademark look.'],
    'deadpool daredevil scarlet-witch vision red-skull red-guardian carnage iron-man spider-man elektra mephisto miles-morales')
  novo('cornome', 'nome', ['Cor no nome', 'O nome de herói ou vilão tem uma cor (em português ou inglês).'], ['Color in the name', 'The hero or villain name has a color in it (English or Portuguese).'],
    'black-widow black-panther scarlet-witch red-skull green-goblin red-guardian black-cat black-bolt silver-surfer kitty-pryde jean-grey')
  novo('bichonome', 'nome', ['Bicho no nome', 'O nome tem um animal: aranha, formiga, falcão, gato… (em português ou inglês).'], ['Animal in the name', 'The name has an animal: spider, ant, falcon, cat… (English or Portuguese).'],
    'ant-man wasp black-panther falcon black-cat spider-man spider-woman spider-gwen spider-man-2099 squirrel-girl vulture lizard rhino wolverine howard werewolf rocket hawkeye black-widow mantis doctor-octopus kitty-pryde')
  novo('titulonome', 'nome', ['Título no nome', 'Capitão, Doutor, Professor, Senhor, Barão, Rei… no nome.'], ['Title in the name', 'Captain, Doctor, Professor, Mister, Baron, King… in the name.'],
    'captain-america captain-marvel captain-britain doctor-strange doctor-doom doctor-octopus professor-x mister-fantastic mister-sinister zemo star-lord ms-marvel kingpin')
  novo('iniciais', 'nome', ['Iniciais repetidas', 'O nome (de herói ou o verdadeiro) tem as duas iniciais iguais: Peter Parker, Doctor Doom…'], ['Matching initials', 'The name (hero or real one) has matching initials: Peter Parker, Doctor Doom…'],
    'spider-man hulk doctor-strange winter-soldier daredevil mister-fantastic invisible-woman cyclops deadpool ms-marvel doctor-octopus lizard jessica-jones morbius miles-morales doctor-doom green-goblin silver-surfer black-bolt beta-ray-bill')
  // origem e poderes
  novo('alienigena', 'origem', ['Alienígena', 'Nasceu em outro planeta (Asgard e outras dimensões não contam).'], ['Alien', 'Born on another planet (Asgard and other dimensions do not count).'],
    'silver-surfer gamora groot nebula ronan super-skrull gladiator thanos ego galactus beta-ray-bill knull watcher')
  novo('acidente', 'origem', ['Ganhou poder num acidente', 'Picada, raio gama, raio cósmico, produto químico, explosão…'], ['Got powers in an accident', 'A bite, gamma rays, cosmic rays, chemicals, an explosion…'],
    'spider-man miles-morales spider-gwen hulk she-hulk daredevil mister-fantastic invisible-woman human-torch thing electro sandman doctor-octopus captain-marvel leader man-thing jessica-jones luke-cage')
  novo('elemento', 'elemento', ['Controla um elemento', 'Fogo, gelo, raio, tempestade ou areia.'], ['Controls an element', 'Fire, ice, lightning, weather or sand.'],
    'human-torch iceman storm electro thor jane-foster ghost-rider surtur sandman')
  novo('telepata', 'mente', ['Lê mentes', 'Telepatia: lê ou controla pensamentos (sentir emoções conta).'], ['Reads minds', 'Telepathy: reads or controls thoughts (sensing feelings counts).'],
    'professor-x jean-grey emma-frost psylocke cable onslaught scarlet-witch mantis modok')
  novo('artes', 'luta', ['Mestre em artes marciais', 'Luta muito bem no braço: kung fu, ninjutsu, treino de espiã…'], ['Martial arts master', 'Excellent hand-to-hand fighter: kung fu, ninjutsu, spy training…'],
    'shang-chi iron-fist black-widow yelena daredevil elektra echo psylocke taskmaster wolverine black-panther')
  novo('assassino', 'oficio', ['Assassino ou mercenário', 'Já matou ou lutou por encomenda.'], ['Assassin or mercenary', 'Has killed or fought for hire.'],
    'black-widow yelena elektra bullseye deadpool domino taskmaster gamora nebula x-23 winter-soldier')
  novo('membro', 'corpo', ['Braço de metal ou parte faltando', 'Perdeu um olho, braço ou perna, ou tem um de metal.'], ['Metal arm or missing part', 'Lost an eye, arm or leg, or has a metal one.'],
    'winter-soldier nebula thor nick-fury odin cable echo deadpool')
  // vida
  novo('adolescente', 'idade', ['Adolescente', 'É adolescente (ou era, quando apareceu pela primeira vez).'], ['Teenager', 'Is a teenager (or was, when first introduced).'],
    'spider-man miles-morales spider-gwen ms-marvel kate-bishop america-chavez ironheart kitty-pryde jubilee x-23 nova human-torch iceman cyclops jean-grey beast wiccan squirrel-girl shuri rogue')
  novo('rico', 'dinheiro', ['Rico de verdade', 'Bilionário, herdeiro ou dono de um império.'], ['Seriously rich', 'A billionaire, an heir or the owner of an empire.'],
    'iron-man black-panther kingpin iron-fist emma-frost professor-x green-goblin zemo doctor-doom')
  novo('orfao', 'familia', ['Órfão ou criado por outros', 'Perdeu os pais cedo ou foi criado por quem não era pai nem mãe.'], ['Orphan or raised by others', 'Lost their parents young or was raised by someone else.'],
    'spider-man gamora nebula star-lord loki rogue nightcrawler black-widow yelena daredevil iron-fist jessica-jones storm cyclops jubilee captain-america')
  novo('filho', 'familia', ['Tem filho ou filha', 'Na HQ ou nas telas. Adotado conta.'], ['Has a child', 'In the comics or on screen. Adopted counts.'],
    'magneto scarlet-witch vision odin thanos ego mister-fantastic invisible-woman cyclops professor-x mystique sabretooth kingpin green-goblin black-bolt medusa luke-cage jessica-jones ant-man hawkeye wolverine red-skull black-panther red-guardian iron-man')
  novo('legado', 'legado', ['Herdou o nome de outro herói', 'Usou o título de quem veio antes: Sam virou Capitão América, Kate virou Gavião…'], ['Took another hero’s name', 'Took up a predecessor’s title: Sam became Captain America, Kate became Hawkeye…'],
    'falcon us-agent jane-foster kate-bishop miles-morales ms-marvel shuri war-machine yelena x-23 captain-marvel monica-rambeau ant-man')
  novo('tempo', 'aventura', ['Viajou no tempo', 'Já foi pro passado ou pro futuro (o assalto no tempo de Ultimato conta).'], ['Time traveler', 'Has gone to the past or the future (the Endgame time heist counts).'],
    'cable kang doctor-doom iron-man captain-america jean-grey cyclops beast iceman kitty-pryde wolverine deadpool spider-man-2099 loki doctor-strange thor hulk black-widow hawkeye ant-man war-machine nebula rocket')
  // equipes e eventos dos quadrinhos
  novo('illuminati', 'equipe', ['Já foi dos Illuminati', 'O grupo secreto dos maiorais da Marvel, nas HQs.'], ['Has been in the Illuminati', 'The secret club of Marvel’s top minds, in the comics.'],
    'iron-man mister-fantastic doctor-strange professor-x namor black-bolt black-panther beast captain-america')
  novo('defensores', 'equipe', ['Já foi dos Defensores', 'O time do Doutor Estranho e do Hulk nas HQs, ou o de rua (Demolidor, Jessica, Luke e Punho).'], ['Has been a Defender', 'Doctor Strange and Hulk’s comic team, or the street-level one (Daredevil, Jessica, Luke and Iron Fist).'],
    'doctor-strange namor hulk silver-surfer valkyrie hawkeye daredevil jessica-jones luke-cage iron-fist')
  novo('secret84', 'evento', ['Estava nas Guerras Secretas', 'Foi levado pelo Beyonder pro Mundo Bélico na HQ de 1984.'], ['Was in Secret Wars (1984)', 'Was taken to Battleworld by the Beyonder in the 1984 comic.'],
    'captain-america war-machine thor hulk spider-man hawkeye wasp monica-rambeau she-hulk cyclops wolverine storm rogue nightcrawler colossus kitty-pryde professor-x magneto human-torch thing mister-fantastic doctor-doom galactus ultron molecule-man enchantress doctor-octopus lizard beyonder kang')
  // telas
  novo('aeroporto', 'mcu', ['Lutou no aeroporto', 'Esteve na briga do aeroporto em Capitão América: Guerra Civil, de qualquer lado.'], ['Fought at the airport', 'Was in the airport fight in Captain America: Civil War, on either side.'],
    'iron-man war-machine black-widow vision black-panther spider-man captain-america winter-soldier falcon hawkeye scarlet-witch ant-man')
  novo('guerrainf', 'mcu', ['Apareceu em Guerra Infinita', 'Aparece em Vingadores: Guerra Infinita, nem que seja de relance.'], ['In Avengers: Infinity War', 'Shows up in Avengers: Infinity War, even briefly.'],
    'iron-man captain-america thor hulk black-widow spider-man black-panther doctor-strange scarlet-witch vision falcon winter-soldier war-machine star-lord gamora drax rocket groot mantis nebula thanos loki wong shuri nick-fury red-skull')
  novo('xfox', 'origem', ['Filmes dos X-Men da Fox', 'Apareceu nos filmes dos X-Men da Fox (de 2000 a 2020, com Wolverine e Deadpool).'], ['Fox X-Men movies', 'Appeared in Fox’s X-Men movies (2000 to 2020, Wolverine and Deadpool included).'],
    'wolverine cyclops jean-grey storm professor-x magneto beast rogue gambit nightcrawler colossus kitty-pryde psylocke iceman mystique sabretooth juggernaut apocalypse quicksilver emma-frost jubilee x-23 deadpool cable domino')
  novo('xdesenho', 'origem', ['Desenho dos X-Men', 'Apareceu em X-Men: A Série Animada (anos 90) ou em X-Men ’97.'], ['X-Men cartoon', 'Appeared in X-Men: The Animated Series (90s) or X-Men ’97.'],
    'cyclops jean-grey storm wolverine rogue gambit beast jubilee professor-x magneto mister-sinister cable apocalypse sabretooth juggernaut mystique nightcrawler colossus iceman emma-frost')
  novo('aranhaverso', 'animacao', ['Apareceu no Aranhaverso', 'Nos desenhos Homem-Aranha no Aranhaverso ou Através do Aranhaverso.'], ['In the Spider-Verse movies', 'In Into the Spider-Verse or Across the Spider-Verse.'],
    'miles-morales spider-gwen spider-man-2099 spider-man spider-woman kingpin green-goblin doctor-octopus vulture')
  novo('deadwolv', 'dw', ['Apareceu em Deadpool & Wolverine', 'Aparece no filme de 2024, nem que seja no Vazio.'], ['In Deadpool & Wolverine', 'Shows up in the 2024 movie, even in the Void.'],
    'deadpool wolverine x-23 elektra blade gambit sabretooth human-torch')
  novo('vilaomorto', 'lado', ['Vilão que morreu no filme', 'Era o vilão de um filme e morreu nele.'], ['Villain who died in the movie', 'Was a movie’s villain and died in it.'],
    'ultron ronan killmonger ego hela mysterio thanos gorr green-goblin doctor-octopus electro')

  // ---------- contas em cima dos dados do Draft: década de estreia, criador e revista ----------
  const conta = (id, grupo, pt, en, f) => C.push({ id, grupo, nivel: 2, pt, en, m: new Set(D.hq.filter(f).map((h) => h.key)) })
  conta('anos60', 'decada', ['Estreou nos anos 60', 'A primeira aparição na HQ foi entre 1960 e 1969.'], ['Debuted in the 1960s', 'First comic appearance between 1960 and 1969.'], (h) => ano(h) >= 1960 && ano(h) < 1970)
  conta('anos70', 'decada', ['Estreou nos anos 70', 'A primeira aparição na HQ foi entre 1970 e 1979.'], ['Debuted in the 1970s', 'First comic appearance between 1970 and 1979.'], (h) => ano(h) >= 1970 && ano(h) < 1980)
  conta('anos80', 'decada', ['Estreou nos anos 80', 'A primeira aparição na HQ foi entre 1980 e 1989.'], ['Debuted in the 1980s', 'First comic appearance between 1980 and 1989.'], (h) => ano(h) >= 1980 && ano(h) < 1990)
  conta('anos90', 'decada', ['Estreou de 1990 pra cá', 'A primeira aparição na HQ foi em 1990 ou depois.'], ['Debuted 1990 or later', 'First comic appearance in 1990 or later.'], (h) => ano(h) >= 1990)
  conta('stanlee', 'criador', ['Criado por Stan Lee', 'Stan Lee está entre os criadores.'], ['Created by Stan Lee', 'Stan Lee is one of the creators.'], (h) => /Stan Lee/.test(por(h)))
  conta('kirby', 'criador', ['Criado por Jack Kirby', 'Jack Kirby está entre os criadores.'], ['Created by Jack Kirby', 'Jack Kirby is one of the creators.'], (h) => /Kirby/.test(por(h)))
  conta('claremont', 'criador', ['Criado por Chris Claremont', 'Chris Claremont está entre os criadores.'], ['Created by Chris Claremont', 'Chris Claremont is one of the creators.'], (h) => /Claremont/.test(por(h)))
  conta('roythomas', 'criador', ['Criado por Roy Thomas', 'Roy Thomas está entre os criadores.'], ['Created by Roy Thomas', 'Roy Thomas is one of the creators.'], (h) => /Roy Thomas/.test(por(h)))
  conta('ditko', 'criador', ['Criado por Steve Ditko', 'Steve Ditko está entre os criadores.'], ['Created by Steve Ditko', 'Steve Ditko is one of the creators.'], (h) => /Ditko/.test(por(h)))
  conta('rev-ff', 'revista', ['Estreou em HQ do Quarteto', 'A primeira aparição foi numa revista Fantastic Four.'], ['Debuted in a Fantastic Four comic', 'First appeared in a Fantastic Four comic.'], (h) => /Fantastic Four/.test(revista(h)))
  conta('rev-aranha', 'revista', ['Estreou em HQ do Aranha', 'A primeira aparição foi em Amazing Fantasy ou Amazing Spider-Man.'], ['Debuted in a Spider-Man comic', 'First appeared in Amazing Fantasy or Amazing Spider-Man.'], (h) => /Amazing (Fantasy|Spider-Man)/.test(revista(h)))
  conta('rev-xmen', 'revista', ['Estreou em HQ dos X-Men', 'A primeira aparição foi numa revista dos X-Men.'], ['Debuted in an X-Men comic', 'First appeared in an X-Men comic.'], (h) => /X-Men/.test(revista(h)))
  conta('rev-thor', 'revista', ['Estreou em HQ do Thor', 'A primeira aparição foi em Journey into Mystery ou numa revista do Thor.'], ['Debuted in a Thor comic', 'First appeared in Journey into Mystery or a Thor comic.'], (h) => /Journey into Mystery|Thor/.test(revista(h)))
  conta('rev-ferro', 'revista', ['Estreou em HQ do Homem de Ferro', 'A primeira aparição foi em Tales of Suspense ou numa revista do Homem de Ferro.'], ['Debuted in an Iron Man comic', 'First appeared in Tales of Suspense or an Iron Man comic.'], (h) => /Tales of Suspense|Iron Man/.test(revista(h)))
  conta('rev-vingadores', 'revista', ['Estreou em HQ dos Vingadores', 'A primeira aparição foi numa revista dos Vingadores.'], ['Debuted in an Avengers comic', 'First appeared in an Avengers comic.'], (h) => /Avengers/.test(revista(h)))

  // ---------- a segunda leva de temas ----------
  // [id, grupo, ref, dificuldade, [rótulo, explicação] em pt, [rótulo, explicação] em en, quem vale]
  const MAIS = [
    // cinema e TV
    ['estalo', 'estalo', 'tela', 3, ['Virou pó no estalo', 'Sumiu no estalo de Guerra Infinita e voltou depois.'], ['Dusted by the Snap', 'Vanished in the Infinity War Snap and came back later.'], 'spider-man black-panther doctor-strange scarlet-witch falcon winter-soldier star-lord groot drax mantis nick-fury wasp shuri yelena monica-rambeau'],
    ['semvolta', 'mcu', 'tela', 4, ['Em Sem Volta Para Casa', 'Apareceu em Homem-Aranha: Sem Volta Para Casa, cena pós-créditos inclusive.'], ['In No Way Home', 'Appears in Spider-Man: No Way Home, post-credits included.'], 'spider-man doctor-strange wong green-goblin doctor-octopus electro sandman lizard daredevil venom'],
    ['loucura', 'mcu', 'tela', 5, ['Em Multiverso da Loucura', 'Apareceu em Doutor Estranho no Multiverso da Loucura (variante conta).'], ['In Multiverse of Madness', 'Appears in Doctor Strange in the Multiverse of Madness (variants count).'], 'doctor-strange wong scarlet-witch america-chavez professor-x mister-fantastic black-bolt captain-marvel'],
    ['avengers12', 'mcu', 'tela', 3, ['Em Os Vingadores (2012)', 'Apareceu no primeiro filme dos Vingadores, nem que seja na cena pós-créditos.'], ['In The Avengers (2012)', 'Appears in the first Avengers movie, even if only post-credits.'], 'iron-man captain-america thor hulk black-widow hawkeye loki nick-fury thanos'],
    ['vilaofilme', 'lado', 'tela', 3, ['Vilão principal de filme', 'Foi o grande vilão de algum filme, da Marvel Studios ou não.'], ['Main villain of a movie', 'Was the main villain of a movie, Marvel Studios or not.'], 'red-skull loki abomination mandarin ronan ultron thanos zemo ego vulture hela killmonger mysterio kang high-evolutionary gorr namor dormammu scarlet-witch green-goblin doctor-octopus sandman venom lizard electro magneto apocalypse kraven morbius carnage kingpin galactus doctor-doom'],
    ['oscar', 'trivia', 'tela', 6, ['Feito por ator com Oscar', 'Quem interpreta já ganhou um Oscar, por qualquer filme.'], ['Played by an Oscar winner', 'Played by someone who has won an Oscar, for any movie.'], 'captain-marvel odin hela ancient-one morbius gorr jane-foster storm mystique rogue iron-man mandarin electro ghost-rider daredevil gamora nick-fury doctor-doom killmonger human-torch blade'],
    ['desenho90', 'desenho', 'tela', 5, ['Desenho do Aranha dos anos 90', 'Apareceu no desenho animado de 1994 do Amigão da Vizinhança.'], ['In the ’90s Spider-Man cartoon', 'Appeared in the 1994 animated series about the wall-crawler.'], 'spider-man venom carnage green-goblin doctor-octopus vulture mysterio kraven lizard rhino kingpin black-cat punisher blade daredevil doctor-strange wong dormammu iron-man war-machine captain-america red-skull morbius mister-fantastic invisible-woman human-torch thing doctor-doom storm wolverine cyclops jean-grey beast rogue gambit jubilee'],
    // os objetos lendários
    ['joia', 'joias', 'ambos', 3, ['Já segurou Joia do Infinito', 'Teve uma Joia ou a Manopla nas mãos, na HQ ou num filme.'], ['Has held an Infinity Stone', 'Had a Stone or the Gauntlet in hand, in comics or movies.'], 'thanos iron-man hulk doctor-strange vision scarlet-witch loki red-skull ronan star-lord gamora drax rocket nebula captain-america ancient-one hawkeye captain-marvel spider-man black-panther jane-foster adam-warlock professor-x namor black-bolt mister-fantastic'],
    ['mjolnir', 'asgard', 'ambos', 5, ['Já ergueu o Mjolnir', 'Levantou o martelo mais famoso de Asgard, na HQ ou num filme.'], ['Has lifted Mjolnir', 'Lifted Asgard’s most famous hammer, in comics or movies.'], 'thor odin captain-america vision jane-foster beta-ray-bill storm hela'],
    // poderes e jeito de lutar
    ['teleporte', 'poder', 'ambos', 3, ['Teleporte ou portais', 'Some e aparece em outro lugar, sozinho ou com equipamento.'], ['Teleports or opens portals', 'Vanishes and reappears elsewhere, on their own or with gear.'], 'nightcrawler doctor-strange wong ancient-one clea loki america-chavez wiccan cable deadpool mephisto dormammu apocalypse beyonder molecule-man mister-sinister thanos'],
    ['armanome', 'poder', 'ambos', 5, ['A arma dele tem nome', 'A arma principal tem nome próprio.'], ['Their weapon has a name', 'Their main weapon has its own proper name.'], 'thor odin valkyrie surtur knull gorr beta-ray-bill jane-foster ronan gamora hercules deadpool namor'],
    ['espada', 'poder', 'ambos', 3, ['Luta de espada', 'Espada, katana ou lâmina longa (de energia vale).'], ['Fights with a sword', 'Sword, katana or long blade (energy blades count).'], 'deadpool psylocke valkyrie hela gamora surtur blade knull gorr taskmaster'],
    ['pistola', 'poder', 'ambos', 2, ['Usa arma de fogo', 'Pistola, fuzil ou blaster.'], ['Uses guns', 'Pistol, rifle or blaster.'], 'deadpool punisher star-lord domino cable bullseye taskmaster rocket nick-fury black-widow yelena us-agent red-guardian winter-soldier war-machine elsa-bloodstone'],
    ['semsuper', 'poder', 'ambos', 2, ['Sem superpoder', 'Só treino, cérebro, dinheiro ou equipamento.'], ['No superpowers', 'Just training, brains, money or gear.'], 'iron-man hawkeye black-widow yelena punisher nick-fury kingpin kate-bishop war-machine falcon zemo mysterio vulture ironheart bullseye howard doctor-octopus'],
    ['mudaforma', 'forma', 'ambos', 3, ['Muda de forma', 'Muda o corpo ou o rosto quando quer.'], ['Shapeshifter', 'Changes body or face at will.'], 'mystique loki super-skrull mister-fantastic ms-marvel venom carnage sandman mephisto beyonder molecule-man'],
    ['viramonstro', 'forma', 'ambos', 2, ['Vira monstro', 'Tem uma forma normal e outra de monstro.'], ['Turns into a monster', 'Has a normal form and a monster form.'], 'hulk she-hulk werewolf lizard venom carnage ghost-rider abomination morbius sentry'],
    // quando e onde
    ['mais100', 'idade', 'ambos', 3, ['Tem mais de 100 anos', 'Deus, imortal, ser cósmico ou quem ficou parado no tempo.'], ['Over 100 years old', 'Gods, immortals, cosmic beings or people frozen in time.'], 'captain-america winter-soldier wolverine sabretooth thor loki odin hela hercules namor valkyrie enchantress sersi ikaris ancient-one apocalypse mister-sinister mystique thanos ego watcher galactus silver-surfer mephisto dormammu shuma-gorath surtur knull beyonder annihilus agatha arnim-zola red-skull nick-fury black-widow high-evolutionary magneto clea beta-ray-bill'],
    ['guerra2', 'epoca', 'ambos', 4, ['Viveu a 2ª Guerra', 'Já estava por aí na Segunda Guerra Mundial.'], ['Lived through WWII', 'Was around during World War II.'], 'captain-america winter-soldier wolverine sabretooth namor nick-fury red-skull arnim-zola magneto black-widow'],
    ['ny', 'lugar', 'ambos', 2, ['De Nova York', 'Nasceu, mora ou atua na cidade.'], ['From New York', 'Born, lives or works in the city.'], 'spider-man miles-morales spider-gwen daredevil jessica-jones luke-cage iron-fist punisher kingpin doctor-strange wong mister-fantastic invisible-woman human-torch thing captain-america hawkeye kate-bishop moon-knight black-cat green-goblin vulture squirrel-girl she-hulk doctor-octopus sandman iron-man bullseye falcon wasp echo electro'],
    ['gringo', 'lugar', 'ambos', 3, ['De fora dos EUA', 'Nasceu ou cresceu em outro país da Terra.'], ['Not from the US', 'Born or raised in another country on Earth.'], 'storm colossus wolverine nightcrawler black-widow yelena red-guardian deadpool sabretooth magneto psylocke captain-britain black-panther shuri shang-chi doctor-doom zemo arnim-zola red-skull mandarin scarlet-witch quicksilver namor kraven rhino apocalypse elektra hercules elsa-bloodstone mister-sinister wong ancient-one x-23'],
    // o visual
    ['barba', 'cabelo', 'ambos', 2, ['Barba ou cavanhaque', 'Costuma aparecer com barba.'], ['Beard or goatee', 'Usually seen with facial hair.'], 'thor iron-man doctor-strange odin star-lord blade hercules kraven mephisto ego red-guardian nick-fury surtur luke-cage ancient-one mandarin wolverine hawkeye captain-america zemo cable punisher'],
    ['cabelobranco', 'cabelo', 'ambos', 3, ['Cabelo branco', 'Branco, prateado, platinado ou com mecha branca.'], ['White hair', 'White, silver, platinum or with a white streak.'], 'storm quicksilver magneto cable odin rogue clea black-cat emma-frost agatha'],
    ['azul', 'cor', 'ambos', 2, ['Azul é a cor dele', 'Pele, roupa ou marca registrada azul.'], ['Blue is their color', 'Blue skin, costume or trademark look.'], 'captain-america beast nightcrawler mystique cyclops iceman nebula ronan mister-fantastic invisible-woman apocalypse spider-man-2099'],
    ['roxo', 'cor', 'ambos', 3, ['Roxo é a cor dele', 'Pele, roupa ou marca registrada roxa.'], ['Purple is their color', 'Purple skin, costume or trademark look.'], 'thanos hawkeye kate-bishop psylocke kang mysterio magneto green-goblin hulk'],
    ['preto', 'cor', 'ambos', 2, ['Preto é a cor dele', 'Uniforme ou visual quase todo preto.'], ['Black is their color', 'A costume or look that is almost all black.'], 'black-panther venom black-widow punisher black-bolt black-cat blade knull x-23 miles-morales'],
    ['amarelo', 'cor', 'ambos', 2, ['Amarelo é a cor dele', 'Amarelo ou dourado é o que mais marca o visual.'], ['Yellow is their color', 'Yellow or gold defines their look.'], 'wolverine iron-fist luke-cage sentry jubilee electro wasp iron-man captain-marvel adam-warlock nova cyclops'],
    // vida pessoal
    ['casado', 'familia', 'hq', 5, ['Casou com outro super', 'Na HQ, casou com outro herói ou vilão.'], ['Married another super', 'In comics, married another hero or villain.'], 'black-panther storm mister-fantastic invisible-woman scarlet-witch vision luke-cage jessica-jones cyclops jean-grey black-bolt medusa quicksilver gambit rogue doctor-strange clea hawkeye wasp'],
    ['filhofamoso', 'familia', 'ambos', 4, ['Filho de alguém famoso', 'O pai ou a mãe também é personagem conhecido. Adotivo conta.'], ['Child of someone famous', 'Their parent is a known character too. Adopted counts.'], 'thor loki hela hercules scarlet-witch quicksilver nebula gamora star-lord black-panther shuri shang-chi iron-man wiccan cable nightcrawler rogue x-23 monica-rambeau'],
    ['pet', 'pet', 'ambos', 4, ['Tem bicho de estimação', 'Cachorro, dragão, gato, esquilo, pássaro, bode…'], ['Has a pet', 'Dog, dragon, cat, squirrel, bird, goat…'], 'kitty-pryde black-bolt medusa falcon captain-marvel nick-fury squirrel-girl hawkeye kate-bishop doctor-strange thor'],
    ['dupla', 'dupla', 'ambos', 2, ['Faz dupla famosa', 'Quase sempre lembrado ao lado do mesmo parceiro.'], ['Part of a famous duo', 'Almost always remembered alongside the same partner.'], 'cable deadpool luke-cage iron-fist rocket groot captain-america winter-soldier falcon iron-man war-machine hawkeye kate-bishop doctor-strange wong wolverine jubilee thor loki'],
    ['professor', 'oficio', 'ambos', 3, ['Já foi professor', 'Deu aula ou treinou alunos numa escola.'], ['Has been a teacher', 'Taught or trained students at a school.'], 'professor-x spider-man storm cyclops beast emma-frost kitty-pryde wolverine magneto iceman rogue nightcrawler ancient-one wong doctor-strange'],
    // as grandes viradas
    ['exvilao', 'lado', 'ambos', 3, ['Começou vilão, virou herói', 'Estreou ou passou um bom tempo do lado errado e mudou.'], ['Villain turned hero', 'Started out or spent a long time on the wrong side, then changed.'], 'scarlet-witch quicksilver hawkeye black-widow rogue emma-frost nebula gamora winter-soldier venom juggernaut loki vision wonder-man yelena black-cat deadpool silver-surfer agatha mantis us-agent magneto namor'],
    ['surtou', 'lado', 'ambos', 4, ['Herói que virou vilão', 'Numa grande história virou o vilão: Fênix Negra, Dinastia M, Império Secreto…'], ['Hero turned villain', 'Became the villain in a big story: Dark Phoenix, House of M, Secret Empire…'], 'jean-grey scarlet-witch captain-america iron-man cyclops emma-frost colossus namor hulk sentry professor-x daredevil wolverine doctor-strange'],
    ['sexteto', 'lado', 'ambos', 3, ['Sexteto Sinistro', 'Já fez parte do Sexteto (ou das versões maiores).'], ['Sinister Six', 'Has been in the Six (or its bigger versions).'], 'doctor-octopus vulture electro sandman kraven mysterio rhino lizard green-goblin taskmaster'],
    ['inimigoxmen', 'lado', 'ambos', 3, ['Inimigo dos X-Men', 'Já enfrentou os X-Men como vilão.'], ['X-Men enemy', 'Has fought the X-Men as a villain.'], 'magneto mystique sabretooth juggernaut apocalypse mister-sinister onslaught emma-frost rogue gladiator'],
    ['inimigoquarteto', 'lado', 'hq', 5, ['Inimigo do Quarteto', 'Já enfrentou o Quarteto Fantástico como vilão.'], ['Fantastic Four enemy', 'Has fought the Fantastic Four as a villain.'], 'doctor-doom galactus annihilus super-skrull molecule-man silver-surfer namor kang'],
    ['cobaia', 'cobaia', 'ambos', 3, ['Foi cobaia', 'O poder ou o corpo vem de um experimento feito nele.'], ['Was a test subject', 'Their powers or body came from an experiment on them.'], 'captain-america wolverine winter-soldier deadpool x-23 sabretooth luke-cage rocket nebula black-widow yelena scarlet-witch quicksilver red-guardian us-agent sentry domino abomination modok'],
    ['lavagem', 'mente', 'ambos', 4, ['Teve a mente controlada', 'Lavagem cerebral ou controle da mente.'], ['Has been mind-controlled', 'Brainwashed or mind-controlled.'], 'hawkeye winter-soldier wolverine jean-grey vision daredevil elektra psylocke x-23 scarlet-witch black-widow yelena taskmaster iron-man'],
    ['clone', 'clone', 'hq', 6, ['Já foi clonado', 'Tem clone na HQ, ou é o próprio clone.'], ['Has been cloned', 'Has a clone in the comics, or is one.'], 'spider-man wolverine x-23 jean-grey thor cable red-skull captain-america mister-sinister arnim-zola'],
    ['zumbi', 'zumbi', 'hq', 5, ['Virou zumbi', 'Foi zumbi em Marvel Zombies.'], ['Became a zombie', 'Was a zombie in Marvel Zombies.'], 'captain-america iron-man hulk spider-man wolverine luke-cage thor daredevil mister-fantastic invisible-woman human-torch thing silver-surfer scarlet-witch quicksilver hawkeye beast cyclops colossus ghost-rider punisher doctor-strange deadpool storm wasp'],
    ['preso', 'crime', 'ambos', 2, ['Já foi preso', 'Já passou pela prisão, na HQ ou num filme.'], ['Has been in prison', 'Has done time, in comics or movies.'], 'luke-cage daredevil punisher winter-soldier falcon hawkeye ant-man scarlet-witch star-lord gamora drax rocket groot hulk thor loki kingpin bullseye electro rhino sandman doctor-octopus vulture green-goblin zemo abomination red-guardian mysterio carnage venom taskmaster sabretooth juggernaut magneto mystique nebula captain-america black-widow'],
    ['deus', 'origem', 'ambos', 2, ['Deus ou semideus', 'Vem da mitologia ou é tratado como deus.'], ['God or demigod', 'From mythology or treated as a god.'], 'thor loki odin hela hercules enchantress valkyrie knull surtur ego sersi'],
    ['dimensao', 'origem', 'ambos', 4, ['Veio de outro universo', 'Nasceu em outra dimensão ou outra Terra.'], ['From another universe', 'Born in another dimension or on another Earth.'], 'spider-gwen miles-morales america-chavez spider-man-2099 dormammu clea mephisto shuma-gorath beyonder annihilus'],
    // equipes e lados
    ['thunderbolts', 'equipe', 'ambos', 4, ['Já foi Thunderbolt', 'Fez parte dos Thunderbolts, na HQ ou no filme.'], ['Has been a Thunderbolt', 'Was on the Thunderbolts, in comics or the movie.'], 'yelena winter-soldier red-guardian us-agent sentry taskmaster zemo bullseye venom green-goblin elektra deadpool punisher juggernaut'],
    ['xforce', 'equipe', 'hq', 5, ['Já foi do X-Force', 'Fez parte de alguma formação do X-Force.'], ['Has been in X-Force', 'Was on some X-Force lineup.'], 'cable domino deadpool wolverine psylocke x-23 colossus nightcrawler storm beast jean-grey'],
    ['irmandade', 'equipe', 'ambos', 5, ['Irmandade ou Clube do Inferno', 'Fez parte da Irmandade de Mutantes ou do Clube do Inferno.'], ['Brotherhood or Hellfire Club', 'Was in the Brotherhood of Mutants or the Hellfire Club.'], 'magneto mystique sabretooth juggernaut rogue scarlet-witch quicksilver emma-frost'],
    ['apocalipse', 'equipe', 'hq', 7, ['Já serviu ao Apocalipse', 'Foi Cavaleiro ou servo dele.'], ['Has served Apocalypse', 'Was one of his Horsemen or servants.'], 'wolverine gambit hulk psylocke storm magneto sentry mister-sinister'],
    ['hidra', 'agencia', 'ambos', 5, ['Já serviu à Hidra', 'Trabalhou pra Hidra, mesmo enganado ou controlado.'], ['Has served Hydra', 'Worked for Hydra, even if tricked or controlled.'], 'red-skull arnim-zola winter-soldier captain-america zemo scarlet-witch quicksilver taskmaster doctor-octopus deadpool'],
    ['shield', 'agencia', 'ambos', 3, ['Trabalhou pra S.H.I.E.L.D.', 'Foi agente, diretor ou aliado oficial.'], ['Worked for S.H.I.E.L.D.', 'Was an agent, director or official ally.'], 'nick-fury black-widow hawkeye captain-america iron-man spider-woman wolverine winter-soldier deadpool yelena captain-marvel falcon'],
    ['timecap', 'guerracivil', 'ambos', 5, ['Time Capitão', 'Do lado do escudo na Guerra Civil, na HQ ou no filme.'], ['Team Cap', 'On the shield’s side of Civil War, in comics or the movie.'], 'captain-america falcon luke-cage iron-fist hercules wiccan invisible-woman human-torch spider-man black-panther storm punisher winter-soldier hawkeye scarlet-witch ant-man'],
    ['timestark', 'guerracivil', 'ambos', 5, ['Time Homem de Ferro', 'Do lado da armadura na Guerra Civil, na HQ ou no filme.'], ['Team Iron Man', 'On the armor’s side of Civil War, in comics or the movie.'], 'iron-man mister-fantastic she-hulk wasp captain-marvel wonder-man black-widow sentry bullseye taskmaster venom green-goblin spider-man war-machine black-panther vision'],
    // videogame
    ['mvc3', 'games', 'ambos', 5, ['Em Marvel vs. Capcom 3', 'Lutador do jogo (ou da versão Ultimate).'], ['In Marvel vs. Capcom 3', 'A fighter in the game (or its Ultimate version).'], 'captain-america deadpool doctor-doom doctor-strange dormammu ghost-rider hawkeye hulk iron-fist iron-man magneto modok nova jean-grey rocket she-hulk shuma-gorath spider-man storm super-skrull taskmaster thor wolverine x-23'],
    ['rivals', 'games', 'ambos', 3, ['Jogável em Marvel Rivals', 'Herói jogável até a temporada 10.'], ['Playable in Marvel Rivals', 'A playable hero up to Season 10.'], 'adam-warlock black-panther black-widow captain-america doctor-strange groot hawkeye hela hulk iron-fist iron-man loki magneto mantis moon-knight namor psylocke punisher rocket scarlet-witch spider-man squirrel-girl star-lord storm thor venom winter-soldier wolverine mister-fantastic invisible-woman human-torch thing emma-frost ultron jean-grey blade daredevil gambit rogue deadpool elsa-bloodstone black-cat cyclops jubilee gorr'],
    ['jogosolo', 'games', 'ambos', 6, ['Nome em título de jogo', 'Teve videogame com o nome dele no título.'], ['Name on a video game', 'Had a video game with their name in the title.'], 'spider-man miles-morales deadpool wolverine iron-man captain-america hulk punisher thor blade ghost-rider silver-surfer venom daredevil howard doctor-doom'],
    ['jogops', 'lado', 'ambos', 4, ['Nos Spider-Man do PlayStation', 'Aparece no jogo de 2018, em Miles Morales ou em Spider-Man 2.'], ['In PlayStation’s Spider-Man', 'Appears in the 2018 game, Miles Morales or Spider-Man 2.'], 'spider-man miles-morales doctor-octopus kingpin electro vulture rhino kraven venom lizard sandman black-cat mysterio taskmaster'],
    // sobre o nome
    ['semcodinome', 'nome', 'ambos', 3, ['Sem codinome', 'O nome que todo mundo usa é o nome de verdade.'], ['No codename', 'The name everyone uses is their real name.'], 'luke-cage jessica-jones elektra shang-chi loki thor gamora drax groot mantis nebula wong clea agatha hercules hela odin thanos sersi ikaris shuri yelena ego surtur'],
    ['maisdeum', 'legado', 'ambos', 3, ['Mais de um já usou o nome', 'Outra pessoa já usou esse mesmo nome de herói ou vilão.'], ['Name used by several', 'Someone else has used this same hero or villain name.'], 'captain-america captain-marvel ant-man hawkeye spider-man ghost-rider thor nova wasp iron-man black-widow wolverine green-goblin venom vulture doctor-octopus daredevil hulk zemo human-torch black-panther captain-britain rhino kraven red-skull mysterio taskmaster ms-marvel'],
  ]
  MAIS.forEach(([id, grupo, ref, d, pt, en, m]) => C.push({ id, grupo, nivel: d <= 2 ? 1 : 2, pt, en, m: L(m), ficha: [ref, d], leva: 2 }))

  // ---------- de onde vem cada categoria e quão difícil ela é ----------
  // ref: 'hq' (precisa saber de quadrinhos), 'tela' (filmes e séries) ou 'ambos' (dá pra saber pelos dois)
  // d: dificuldade de 1 a 9 (1-3 fácil, 4-6 médio, 7-9 difícil), pensando em quem conhece Marvel "de turma"
  const FICHA = {
    mulher: ['ambos', 1], voa: ['ambos', 1], mascara: ['ambos', 1], capa: ['ambos', 1], vingador: ['ambos', 1], arma: ['ambos', 1], nome: ['ambos', 1], mcu: ['tela', 1],
    mutante: ['ambos', 2], naohumano: ['ambos', 2], vilao: ['ambos', 2], genio: ['ambos', 2], xmen: ['ambos', 2], armadura: ['ambos', 2], filme: ['tela', 2],
    realeza: ['ambos', 3], guardioes: ['ambos', 3], inimigoaranha: ['ambos', 3], pele: ['ambos', 3], magia: ['ambos', 3], fase3: ['tela', 3], ultimato: ['tela', 3],
    irmao: ['ambos', 4], morreu: ['ambos', 4], cura: ['ambos', 4], fase1: ['tela', 4], fase4: ['tela', 4], serie: ['tela', 4], stanlee: ['hq', 4],
    fase2: ['tela', 5], fase5: ['tela', 5], netflix: ['tela', 5], quarteto: ['hq', 5], anos60: ['hq', 5],
    atores: ['tela', 6], anos70: ['hq', 6], anos90: ['hq', 6], kirby: ['hq', 6], 'rev-aranha': ['hq', 6], 'rev-xmen': ['hq', 6],
    anos80: ['hq', 7], ditko: ['hq', 7], 'rev-ff': ['hq', 7],
    'rev-thor': ['hq', 8], 'rev-ferro': ['hq', 8],
    'rev-vingadores': ['hq', 9],
    // os novos
    bichonome: ['ambos', 1], cornome: ['ambos', 1], titulonome: ['ambos', 1],
    verde: ['ambos', 2], vermelho: ['ambos', 2], garras: ['ambos', 2], elemento: ['ambos', 2],
    careca: ['ambos', 3], alienigena: ['ambos', 3], assassino: ['ambos', 3], acidente: ['ambos', 3], adolescente: ['ambos', 3], artes: ['ambos', 3], telepata: ['ambos', 3],
    tempo: ['ambos', 4], orfao: ['ambos', 4], rico: ['ambos', 4], legado: ['ambos', 4], membro: ['ambos', 4],
    filho: ['ambos', 5], iniciais: ['ambos', 5],
    guerrainf: ['tela', 3], xfox: ['tela', 3], aeroporto: ['tela', 4], aranhaverso: ['tela', 5], vilaomorto: ['tela', 5], xdesenho: ['tela', 6], deadwolv: ['tela', 6],
    defensores: ['hq', 6], illuminati: ['hq', 7], secret84: ['hq', 8], claremont: ['hq', 8], roythomas: ['hq', 9],
  }
  // a terceira leva (grade-mais.js): temas feitos à mão e temas contados em cima dos dados
  const LEVA3 = raiz.GRADE_MAIS || { TAGS: {}, TEMAS: [], CONTAS: [] }
  LEVA3.TEMAS.forEach(([id, grupo, ref, d, pt, en, m]) => C.push({ id, grupo, nivel: d <= 2 ? 1 : 2, pt, en, m: L(m), ficha: [ref, d], leva: 3 }))
  LEVA3.CONTAS.forEach(([id, grupo, d, pt, en, f]) => C.push({ id, grupo, nivel: 2, pt, en, m: new Set(D.hq.filter((h) => f(ano(h), por(h))).map((h) => h.key)), ficha: ['hq', d], leva: 3 }))

  C.forEach((c) => { const f = c.ficha || FICHA[c.id] || ['ambos', 5]; c.ref = f[0]; c.d = f[1] })

  // ---------- a versão "só filmes e séries" ----------
  // quem dá pra conhecer só pelas telas: MCU, os filmes da Fox e da Sony, o Quarteto e o Motoqueiro antigos, Netflix e os desenhos
  const TELA = new Set([...C.find((c) => c.id === 'mcu').m, ...L(`cyclops jean-grey storm magneto rogue nightcrawler colossus kitty-pryde psylocke iceman cable domino
    deadpool mystique sabretooth juggernaut apocalypse x-23 wolverine professor-x beast gambit quicksilver emma-frost jubilee mister-sinister venom carnage kraven
    morbius rhino lizard electro sandman green-goblin doctor-octopus vulture mysterio black-cat spider-gwen miles-morales spider-man-2099 spider-woman doctor-doom
    silver-surfer galactus mister-fantastic invisible-woman human-torch thing ghost-rider mephisto blade daredevil elektra punisher kingpin bullseye jessica-jones
    luke-cage iron-fist hulk man-thing howard watcher`)])
  // nessas categorias o que conta nas telas é diferente do que conta nos quadrinhos
  const nasTelas = (id, m, pt, en) => { const c = C.find((x) => x.id === id); if (c) c.tela = { m: L(m), pt: pt || c.pt, en: en || c.en } }
  nasTelas('vingador', 'iron-man captain-america thor hulk black-widow hawkeye spider-man black-panther doctor-strange scarlet-witch vision falcon winter-soldier captain-marvel ant-man wasp war-machine rocket nebula yelena red-guardian us-agent sentry',
    ['Já foi Vingador', 'Fez parte dos Vingadores num filme ou série (os Novos Vingadores de Thunderbolts* contam).'], ['Has been an Avenger', 'Was on the Avengers in a movie or series (the New Avengers from Thunderbolts* count).'])
  nasTelas('irmao', 'thor loki hela scarlet-witch quicksilver black-panther shuri gamora nebula black-widow yelena mantis star-lord shang-chi ms-marvel falcon human-torch invisible-woman professor-x wiccan',
    ['Tem irmão ou irmã', 'Num filme ou série. Adotivo e meio-irmão contam.'], ['Has a sibling', 'In a movie or series. Adopted and half-siblings count.'])
  nasTelas('morreu', 'spider-man black-panther doctor-strange scarlet-witch falcon winter-soldier star-lord groot drax mantis nick-fury wasp shuri vision gamora loki',
    ['Morreu e voltou', 'Morreu num filme ou série (virar pó no estalo conta) e voltou depois.'], ['Died and came back', 'Died in a movie or series (turning to dust in the snap counts) and came back later.'])
  nasTelas('realeza', 'thor loki hela odin black-panther shuri killmonger namor black-bolt valkyrie dormammu hercules')
  nasTelas('guardioes', 'star-lord gamora drax rocket groot mantis nebula adam-warlock',
    ['Já foi Guardião da Galáxia', 'Fez parte dos Guardiões da Galáxia nos filmes.'], ['Has been a Guardian', 'Was on the Guardians of the Galaxy in the movies.'])
  nasTelas('tempo', 'iron-man captain-america thor hulk black-widow hawkeye ant-man war-machine nebula rocket doctor-strange kang loki cable wolverine deadpool',
    ['Viajou no tempo', 'Foi pro passado ou pro futuro num filme ou série (o assalto no tempo de Ultimato conta).'], ['Time traveler', 'Went to the past or the future in a movie or series (the Endgame time heist counts).'])
  nasTelas('orfao', 'spider-man gamora nebula star-lord loki black-widow yelena daredevil iron-fist jessica-jones captain-america',
    ['Órfão ou criado por outros', 'Num filme ou série, perdeu os pais cedo ou foi criado por outra pessoa.'], ['Orphan or raised by others', 'In a movie or series, lost their parents young or was raised by someone else.'])
  nasTelas('filho', 'odin thanos ego ant-man hawkeye magneto scarlet-witch vision green-goblin black-panther red-guardian wolverine mister-fantastic invisible-woman iron-man professor-x',
    ['Tem filho ou filha', 'Num filme ou série. Adotado conta.'], ['Has a child', 'In a movie or series. Adopted counts.'])
  nasTelas('legado', 'falcon us-agent jane-foster kate-bishop shuri ant-man miles-morales',
    ['Herdou o nome de outro herói', 'Num filme ou série, usou o título de quem veio antes: Sam virou Capitão América, Kate virou Gavião…'], ['Took another hero’s name', 'In a movie or series, took up a predecessor’s title: Sam became Captain America, Kate became Hawkeye…'])
  nasTelas('mutante', [...C.find((c) => c.id === 'mutante').m, 'ms-marvel'].join(' '),
    ['Mutante', 'É mutante num filme, série ou desenho.'], ['Mutant', 'Is a mutant in a movie, series or cartoon.'])
  nasTelas('joia', 'thanos iron-man hulk doctor-strange vision scarlet-witch loki red-skull ronan star-lord gamora drax rocket nebula captain-america ancient-one hawkeye captain-marvel spider-man black-panther jane-foster',
    ['Já segurou Joia do Infinito', 'Teve uma Joia ou a Manopla nas mãos num filme ou série.'], ['Has held an Infinity Stone', 'Had a Stone or the Gauntlet in hand in a movie or series.'])
  nasTelas('filhofamoso', 'thor loki hela nebula gamora star-lord black-panther shuri shang-chi iron-man quicksilver x-23 monica-rambeau wiccan',
    ['Filho de alguém famoso', 'Num filme ou série, o pai ou a mãe também é personagem conhecido. Adotivo conta.'], ['Child of someone famous', 'In a movie or series, their parent is a known character too. Adopted counts.'])
  nasTelas('thunderbolts', 'yelena winter-soldier red-guardian us-agent sentry taskmaster',
    ['Já foi Thunderbolt', 'Fez parte da equipe no filme Thunderbolts*.'], ['Has been a Thunderbolt', 'Was on the team in the movie Thunderbolts*.'])
  nasTelas('shield', 'nick-fury black-widow hawkeye captain-america iron-man captain-marvel',
    ['Trabalhou pra S.H.I.E.L.D.', 'Num filme ou série, foi agente, diretor ou aliado oficial.'], ['Worked for S.H.I.E.L.D.', 'In a movie or series, was an agent, director or official ally.'])
  nasTelas('timecap', 'captain-america winter-soldier falcon hawkeye scarlet-witch ant-man',
    ['Time Capitão', 'Do lado do escudo no filme Guerra Civil.'], ['Team Cap', 'On the shield’s side in the movie Civil War.'])
  nasTelas('timestark', 'iron-man war-machine black-widow black-panther vision spider-man',
    ['Time Homem de Ferro', 'Do lado da armadura no filme Guerra Civil.'], ['Team Iron Man', 'On the armor’s side in the movie Civil War.'])

  // os personagens novos entram nos temas: "tema" (HQ), "tema+" (HQ e filmes), "tema:t" (só filmes)
  const elenco = new Set(D.hq.map((h) => h.key))
  for (const [key, tags] of Object.entries(LEVA3.TAGS)) {
    if (!elenco.has(key)) continue
    for (const tag of L(tags)) {
      const id = tag.replace(/(\+|:t)$/, '')
      const c = C.find((x) => x.id === id)
      if (!c) throw new Error(`tema desconhecido: ${id} (${key})`)
      const nasTelasTambem = id !== tag
      if (!tag.endsWith(':t')) c.m.add(key)
      if (c.tela && nasTelasTambem) c.tela.m.add(key)
      if (c.ref === 'tela' || nasTelasTambem) TELA.add(key)
    }
  }

  // ---------- o que muda por versão: as categorias, quem vale e quem conta como resposta ----------
  const VERSOES = { hq: ['hq', 'ambos'], ambos: ['hq', 'tela', 'ambos'], tela: ['tela', 'ambos'] }
  const versao = (v) => (VERSOES[v] ? v : 'ambos')
  const categoriasDa = (v) => C.filter((c) => VERSOES[versao(v)].includes(c.ref))
  const membros = (c, v) => (versao(v) === 'tela' && c.tela ? c.tela.m : c.m)
  const poolDa = (v) => (versao(v) === 'tela' ? [...TELA].filter((k) => D.hq.some((h) => h.key === k)) : D.hq.map((h) => h.key))
  // o texto da categoria na versão (rótulo e explicação, em pt e en)
  const textos = (c, v) => (versao(v) === 'tela' && c.tela ? { pt: c.tela.pt, en: c.tela.en } : { pt: c.pt, en: c.en })

  const porId = Object.fromEntries(C.map((c) => [c.id, c]))
  const chaves = D.hq.map((h) => h.key)
  // quem já estava no elenco quando os dias de desafio começaram (o grid que já foi ao ar não pode mudar)
  const antigos = new Set(chaves.slice(0, 154))
  raiz.GradeDados = { categorias: C, porId, chaves, antigos, ano, revista, TELA, VERSOES, versao, categoriasDa, membros, poolDa, textos }
})(typeof window !== 'undefined' ? window : globalThis)
