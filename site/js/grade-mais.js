// Grade do Multiverso: a terceira leva. O que cada personagem novo é (TAGS) e os temas novos (TEMAS e CONTAS).
// Em TAGS: "tema" vale nas HQs; "tema+" vale nas HQs e nos filmes; "tema:t" vale só nos filmes (só muda nos temas que têm versão das telas).
(function (raiz) {
  const TAGS = {
    // X-Men e mutantes
    bishop: 'mutante+ xmen arma pistola tempo irmao surtou vilao xfox xdesenho x97 krakoa militar',
    angel: 'mutante+ xmen voa rico apocalipse vilao surtou xforce lavagem ny pele azul xfox xdesenho defensores atores loiro krakoa',
    havok: 'mutante+ xmen irmao+ vilao vingador orfao xfox energia krakoa',
    polaris: 'mutante xmen mulher verde filhofamoso irmao voa vilao apocalipse lavagem paivilao krakoa',
    dazzler: 'mutante xmen mulher ny energia loiro',
    banshee: 'mutante+ xmen voa gringo filho vilao exvilao xfox professor ruivo krakoa',
    magik: 'chifre mutante+ xmen mulher magia teleporte espada arma armanome irmao gringo adolescente vilao morreu rivals xfox inferno russo loiro krakoa',
    sunspot: 'mutante+ xmen gringo rico vingador voa adolescente xforce irmandade xfox x97 energia krakoa',
    cannonball: 'mutante+ xmen voa adolescente irmao xforce vingador xfox krakoa',
    'multiple-man': 'mutante+ morreu xfox krakoa',
    negasonic: 'mutante+ mulher adolescente xfox',
    legion: 'mutante+ telepata filhofamoso+ serie',
    blob: 'mutante+ irmandade xfox xdesenho preso forte krakoa',
    toad: 'mutante+ irmandade xfox xdesenho deadwolv preso bichonome atores krakoa',
    pyro: 'mutante+ irmandade elemento xfox xdesenho deadwolv gringo preso krakoa',
    'lady-deathstrike': 'mulher garras membro assassino gringo xfox deadwolv inimigoxmen cura titulonome',
    'omega-red': 'mutante+ gringo inimigoxmen xdesenho vermelho cornome cobaia russo',
    'sebastian-shaw': 'mutante+ irmandade rico inimigoxmen xfox semcodinome iniciais krakoa',
    // Aranhaverso
    'spider-ham': 'bichonome aranhaverso naohumano dimensao mascara iniciais teia',
    silk: 'mulher acidente mascara teia',
    'spider-noir': 'bichonome aranhaverso dimensao mascara pistola preto ny iniciais teia serie',
    'spider-punk': 'bichonome aranhaverso dimensao mascara arma adolescente teia',
    'scarlet-spider': 'bichonome cornome vermelho mascara clone morreu ny vilao surtou teia',
    prowler: 'aranhaverso mascara garras inimigoaranha ny roxo mcu fase3 jogops',
    mj: 'mulher ny semsuper semcodinome mcu fase3 fase4 semvolta desenho90 jogops atores ruivo',
    hobgoblin: 'inimigoaranha mascara arma ny desenho90 rico maisdeum',
    scorpion: 'inimigoaranha bichonome sexteto verde armadura desenho90 cobaia preso ny mcu fase3 thunderbolts jogops simbionte rabo',
    shocker: 'inimigoaranha amarelo mascara arma preso ny mcu fase3 desenho90 jogops energia',
    chameleon: 'inimigoaranha mudaforma gringo desenho90 irmao bichonome espiao russo',
    spot: 'inimigoaranha teleporte aranhaverso acidente genio',
    // Vingadores e amigos
    'hank-pym': 'capacete vingador genio casado surtou vilao professor mcu fase2 fase3 fase5 estalo filho+ oscar semcodinome ny doutor',
    tigra: 'mulher vingador pele garras naohumano rabo',
    mockingbird: 'mulher vingador shield arma casado morreu bichonome espiao cajado loiro',
    hyperion: 'vingador voa dimensao alienigena naohumano vilao energia forte',
    hulkling: 'alienigena naohumano mudaforma verde realeza casado filhofamoso adolescente voa',
    'black-knight': 'vingador arma espada armanome cornome gringo mcu fase4 genio semsuper',
    'brother-voodoo': 'vingador magia gringo irmao',
    quake: 'mulher shield vingador filhofamoso paivilao espiao',
    sif: 'mulher deus naohumano espada arma mcu fase1 fase2 fase4 mais100 irmao semcodinome titulonome asgard',
    heimdall: 'deus naohumano espada arma armanome irmao mcu fase1 fase2 fase3 guerrainf mais100 semcodinome asgard ragnarok heroimorto',
    'amadeus-cho': 'genio vingador legado verde viramonstro adolescente semcodinome orfao forte',
    'moon-girl': 'mulher genio adolescente serie dupla pet iniciais',
    // Ruas e vilões
    'misty-knight': 'mulher netflix membro dupla ny semsuper semcodinome ruas',
    'colleen-wing': 'mulher netflix espada arma artes dupla semsuper semcodinome ny ruas',
    'typhoid-mary': 'mulher assassino netflix espada arma mutante preso',
    'the-hood': 'magia capa pistola arma mascara mcu fase5 ny preso disney',
    crossbones: 'hidra arma mascara mcu fase2 fase3 ultimato vilaomorto preso assassino semsuper inimigocap',
    viper: 'mulher hidra arma verde assassino xfox bichonome espiao inimigocap',
    'baron-strucker': 'hidra titulonome mcu fase2 vilaomorto gringo guerra2 careca inimigocap',
    'absorbing-man': 'arma careca preso casado mudaforma secret84 iniciais inimigothor inimigovingadores forte',
    klaue: 'membro mcu fase2 fase3 vilaomorto gringo arma inimigoquarteto',
    'mole-man': 'inimigoquarteto genio mcu bichonome',
    // Cósmicos e bizarros
    collector: 'naohumano alienigena mais100 mcu fase2 fase3 guerrainf joia+ irmao oscar',
    grandmaster: 'naohumano alienigena mais100 mcu fase3 irmao azul pele ragnarok',
    'living-tribunal': 'naohumano mais100 dimensao',
    death: 'mulher naohumano mais100 mcu fase5 disney',
    nightmare: 'naohumano mais100 dimensao magia verde pele inferno',
    mordo: 'magia titulonome mcu fase3 fase4 loucura gringo surtou cajado',
    malekith: 'naohumano mcu fase2 vilaofilme vilaomorto magia mais100 cabelobranco joia+ asgard inimigothor',
    'fin-fang-foom': 'naohumano alienigena verde mais100 voa pele mudaforma iniciais rabo',
    'devil-dinosaur': 'naohumano vermelho serie dupla bichonome rabo',
    lockjaw: 'naohumano teleporte rabo',
    cosmo: 'naohumano gringo telepata guardioes+ mcu fase2 fase5 cobaia rabo russo guardioes3',
    throg: 'naohumano bichonome ny legado',
    yondu: 'alienigena naohumano azul pele guardioes arma mcu fase2 fase3 semcodinome heroimorto',
    gwenpool: 'mulher dimensao mascara pistola arma assassino adolescente vingador loiro',
  }

  // [id, grupo, de onde vem, dificuldade, [rótulo, explicação], [label, explanation], 'quem vale']
  const TEMAS = [
    // corpo e visual
    ['ruivo', 'cabelo', 'ambos', 2, ['Ruivo ou ruiva', 'Cabelo vermelho ou acobreado.'], ['Redhead', 'Red or copper hair.'], 'jean-grey black-widow daredevil medusa scarlet-witch mystique'],
    ['loiro', 'cabelo', 'ambos', 2, ['Loiro ou loira', 'Cabelo loiro no visual mais famoso.'], ['Blond', 'Blond hair in their most famous look.'], 'captain-america thor human-torch invisible-woman emma-frost spider-gwen yelena sentry'],
    ['rabo', 'corpo', 'ambos', 2, ['Tem rabo', 'Nasceu com um, ou o traje tem.'], ['Has a tail', 'Born with one, or the suit has one.'], 'nightcrawler lizard rocket squirrel-girl howard'],
    ['chifre', 'corpo', 'ambos', 2, ['Chifres no visual', 'Na cabeça, no capacete, na coroa ou na máscara.'], ['Horns in the look', 'On the head, the helmet, the crown or the mask.'], 'loki mephisto rhino hela surtur galactus daredevil'],
    ['capacete', 'visual', 'ambos', 2, ['Usa capacete', 'Faz parte do visual mais famoso.'], ['Wears a helmet', 'Part of their most famous look.'], 'magneto juggernaut nova galactus star-lord ant-man kang thor loki'],
    // poderes e armas
    ['teia', 'poder', 'ambos', 1, ['Solta teia', 'Do corpo ou de um lançador.'], ['Shoots webs', 'From their body or a shooter.'], 'spider-man miles-morales spider-gwen spider-man-2099 venom carnage'],
    ['energia', 'poder', 'ambos', 1, ['Solta rajada de energia', 'Raio, laser ou energia, pelas mãos, olhos ou armadura.'], ['Fires energy blasts', 'Lightning, lasers or energy, from hands, eyes or armor.'], 'iron-man thor storm electro captain-marvel scarlet-witch gambit vision cyclops monica-rambeau nova silver-surfer adam-warlock'],
    ['forte', 'poder', 'ambos', 1, ['Super-força absurda', 'Levanta prédio sem suar.'], ['Absurd super strength', 'Lifts buildings without breaking a sweat.'], 'hulk she-hulk thing thor colossus juggernaut luke-cage hercules rhino sentry gladiator abomination wonder-man beta-ray-bill namor valkyrie captain-marvel'],
    ['cajado', 'poder', 'ambos', 3, ['Luta de bastão ou cajado', 'Bastão, bengala, cajado ou lança na mão.'], ['Fights with a staff', 'Staff, cane, club or spear in hand.'], 'daredevil gambit loki odin moon-knight kingpin'],
    ['moto', 'veiculo', 'ambos', 3, ['Anda de moto', 'A moto é parte da imagem dele.'], ['Rides a motorcycle', 'The bike is part of their image.'], 'ghost-rider wolverine captain-america black-widow blade cyclops storm captain-marvel'],
    ['simbionte', 'simb', 'hq', 4, ['Já vestiu um simbionte', 'Foi hospedeiro, ou é um.'], ['Has worn a symbiote', 'Was a host, or is one.'], 'venom carnage knull spider-man silver-surfer spider-gwen deadpool'],
    // quem é
    ['inferno', 'origem', 'ambos', 3, ['Demônio ou coisa do inferno', 'É demônio, tem sangue de demônio ou manda no inferno.'], ['Demon or hell-related', 'Is a demon, has demon blood or rules a hell.'], 'mephisto ghost-rider nightcrawler dormammu shuma-gorath hela surtur'],
    ['asgard', 'asgard', 'ambos', 2, ['De Asgard e arredores', 'Nasceu em um dos Nove Reinos.'], ['From Asgard and nearby', 'Born in one of the Nine Realms.'], 'thor loki odin hela valkyrie enchantress surtur'],
    ['russo', 'lugar', 'ambos', 2, ['Russo ou russa', 'Nasceu na Rússia ou na União Soviética.'], ['Russian', 'Born in Russia or the Soviet Union.'], 'black-widow yelena red-guardian colossus kraven'],
    ['ruas', 'lugar', 'ambos', 2, ['Herói das ruas', 'Protege o bairro em Nova York, não o planeta.'], ['Street-level hero', 'Protects the neighborhood in New York, not the planet.'], 'daredevil punisher jessica-jones luke-cage iron-fist moon-knight spider-man shang-chi'],
    ['paivilao', 'familia', 'ambos', 3, ['Filho de vilão', 'Pai ou mãe é vilão. Adotivo conta.'], ['Child of a villain', 'A parent is a villain. Adopted counts.'], 'scarlet-witch quicksilver nebula gamora star-lord nightcrawler rogue shang-chi loki'],
    ['doutor', 'oficio', 'ambos', 3, ['Doutor de verdade', 'Médico ou com doutorado.'], ['An actual doctor', 'A physician or holds a PhD.'], 'doctor-strange jane-foster morbius beast mister-fantastic hulk doctor-octopus lizard professor-x'],
    ['militar', 'oficio', 'ambos', 2, ['Já foi militar', 'Serviu em algum exército ou força armada.'], ['Has served in the military', 'Served in an army or armed force.'], 'captain-america war-machine punisher winter-soldier falcon captain-marvel nick-fury wolverine cable us-agent moon-knight deadpool thing'],
    ['espiao', 'oficio', 'ambos', 3, ['Espião ou espiã', 'Espionagem é ou já foi o trabalho.'], ['Spy', 'Espionage is or was the job.'], 'black-widow yelena nick-fury mystique winter-soldier domino'],
    ['bordao', 'trivia', 'ambos', 3, ['Tem bordão famoso', 'Uma frase que todo mundo liga a ele.'], ['Has a famous catchphrase', 'A line everyone connects to them.'], 'hulk thing groot wolverine deadpool iron-man thanos captain-america juggernaut'],
    // inimigos
    ['inimigocap', 'lado', 'ambos', 3, ['Inimigo do Capitão América', 'Vilão clássico das histórias dele.'], ['Captain America villain', 'A classic foe from his stories.'], 'red-skull zemo arnim-zola modok taskmaster winter-soldier'],
    ['inimigothor', 'lado', 'ambos', 3, ['Inimigo do Thor', 'Vilão clássico das histórias dele.'], ['Thor villain', 'A classic foe from his stories.'], 'loki hela surtur enchantress gorr ego'],
    ['inimigovingadores', 'lado', 'ambos', 2, ['Inimigo dos Vingadores', 'Enfrentou a equipe inteira.'], ['Avengers villain', 'Took on the whole team.'], 'ultron kang thanos loki zemo enchantress taskmaster'],
    // equipes e eventos
    ['krakoa', 'equipe', 'hq', 5, ['Morou em Krakoa', 'Viveu na ilha-nação dos mutantes nas HQs.'], ['Lived on Krakoa', 'Lived on the mutant island nation in the comics.'], 'cyclops jean-grey storm wolverine magneto professor-x rogue gambit nightcrawler colossus kitty-pryde psylocke iceman cable jubilee emma-frost mister-sinister apocalypse mystique sabretooth juggernaut beast x-23 domino'],
    // telas
    ['x97', 'desenho', 'tela', 4, ['Em X-Men ’97', 'Apareceu na série animada de 2024.'], ['In X-Men ’97', 'Appeared in the 2024 animated series.'], 'cyclops jean-grey storm beast rogue gambit jubilee wolverine magneto mister-sinister professor-x nightcrawler apocalypse'],
    ['whatif', 'desenho', 'tela', 3, ['Em What If…?', 'Apareceu na série animada do Uatu.'], ['In What If…?', 'Appeared in Uatu’s animated series.'], 'watcher iron-man captain-america thor hulk black-panther doctor-strange star-lord killmonger ultron thanos black-widow hawkeye loki nebula gamora wong captain-marvel'],
    ['disney', 'tv', 'tela', 3, ['Em série do Disney+', 'Apareceu numa série da Marvel Studios.'], ['In a Disney+ series', 'Appeared in a Marvel Studios series.'], 'scarlet-witch vision agatha monica-rambeau falcon winter-soldier us-agent zemo loki kang hawkeye kate-bishop echo kingpin yelena moon-knight ms-marvel she-hulk abomination wong daredevil bullseye punisher nick-fury war-machine ironheart mephisto wiccan'],
    ['sony', 'sonyverso', 'tela', 5, ['No universo Sony', 'Filmes como Venom, Morbius e Kraven.'], ['In the Sony universe', 'Movies like Venom, Morbius and Kraven.'], 'venom carnage morbius kraven rhino vulture knull chameleon'],
    ['ragnarok', 'mcu', 'tela', 4, ['Em Thor: Ragnarok', 'Apareceu no filme de 2017.'], ['In Thor: Ragnarok', 'Appeared in the 2017 movie.'], 'thor loki hulk hela valkyrie surtur odin doctor-strange'],
    ['guardioes3', 'mcu', 'tela', 4, ['Em Guardiões Vol. 3', 'Apareceu no filme de 2023.'], ['In Guardians Vol. 3', 'Appeared in the 2023 movie.'], 'star-lord gamora drax rocket groot mantis nebula high-evolutionary adam-warlock'],
    ['heroimorto', 'lado', 'tela', 3, ['Herói que morreu em filme', 'Morreu na tela, mesmo que tenha voltado depois.'], ['Hero who died in a movie', 'Died on screen, even if they came back later.'], 'iron-man black-widow quicksilver odin wolverine professor-x cyclops black-panther vision gamora'],
  ]

  // [id, grupo, dificuldade, [rótulo, explicação], [label, explanation], (ano, criadores) => vale]
  const CONTAS = [
    ['anos2010', 'decada', 7, ['Estreou de 2010 pra cá', 'A primeira aparição na HQ foi em 2010 ou depois.'], ['Debuted in 2010 or later', 'First comic appearance was in 2010 or later.'], (a) => a && a >= 2010],
    ['romita', 'criador', 8, ['Criado por um John Romita', 'John Romita Sr. ou o filho, John Romita Jr., está entre os criadores.'], ['Created by a John Romita', 'John Romita Sr. or his son, John Romita Jr., is among the creators.'], (a, p) => p.includes('Romita')],
    ['buscema', 'criador', 8, ['Criado por um Buscema', 'John Buscema ou o irmão, Sal Buscema, está entre os criadores.'], ['Created by a Buscema', 'John Buscema or his brother, Sal Buscema, is among the creators.'], (a, p) => p.includes('Buscema')],
  ]

  raiz.GRADE_MAIS = { TAGS, TEMAS, CONTAS }
})(typeof window !== 'undefined' ? window : globalThis)
