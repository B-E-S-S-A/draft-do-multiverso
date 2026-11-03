// Aposto Que Sei (e Minas): os temas. Cada tema é uma lista fechada de respostas certas, separadas por raridade:
// 1 = todo mundo lembra, 2 = quem acompanha lembra, 3 = só quem sabe muito. No modo Raridade cada nome vale isso em pontos.
// Cada nome é "Português | English" (quando é igual nas duas línguas, só um). O celular aceita os dois quando alguém escreve.
(function (raiz) {
  const L = (s) => s.split(';').map((x) => x.trim()).filter(Boolean).map((x) => x.split('|').map((y) => y.trim()))
  const T = (id, titulo, titleEn, um, dois, tres) => ({ id, titulo, en: titleEn,
    itens: [...L(um).map(([n, en]) => [n, 1, en]), ...L(dois).map(([n, en]) => [n, 2, en]), ...L(tres).map(([n, en]) => [n, 3, en])] })

  const TEMAS = [
    T('filmes', 'Filmes do MCU', 'MCU movies',
      'Homem de Ferro | Iron Man; Os Vingadores | The Avengers; Vingadores: Era de Ultron | Avengers: Age of Ultron; Vingadores: Guerra Infinita | Avengers: Infinity War; Vingadores: Ultimato | Avengers: Endgame; Guardiões da Galáxia | Guardians of the Galaxy; Pantera Negra | Black Panther; Capitão América: Guerra Civil | Captain America: Civil War; Thor: Ragnarok; Homem-Aranha: Sem Volta Para Casa | Spider-Man: No Way Home; Doutor Estranho | Doctor Strange; Capitã Marvel | Captain Marvel; Homem-Formiga | Ant-Man; Deadpool & Wolverine',
      'Homem de Ferro 2 | Iron Man 2; Homem de Ferro 3 | Iron Man 3; Thor; Thor: O Mundo Sombrio | Thor: The Dark World; Capitão América: O Primeiro Vingador | Captain America: The First Avenger; Capitão América 2: O Soldado Invernal | Captain America: The Winter Soldier; Guardiões da Galáxia Vol. 2 | Guardians of the Galaxy Vol. 2; Guardiões da Galáxia Vol. 3 | Guardians of the Galaxy Vol. 3; Homem-Aranha: De Volta ao Lar | Spider-Man: Homecoming; Homem-Aranha: Longe de Casa | Spider-Man: Far From Home; Homem-Formiga e a Vespa | Ant-Man and the Wasp; Viúva Negra | Black Widow; Shang-Chi e a Lenda dos Dez Anéis | Shang-Chi and the Legend of the Ten Rings; Doutor Estranho no Multiverso da Loucura | Doctor Strange in the Multiverse of Madness; Thor: Amor e Trovão | Thor: Love and Thunder; Pantera Negra: Wakanda Para Sempre | Black Panther: Wakanda Forever; Thunderbolts*; Quarteto Fantástico: Primeiros Passos | The Fantastic Four: First Steps; Homem-Aranha: Um Novo Dia | Spider-Man: Brand New Day',
      'O Incrível Hulk | The Incredible Hulk; Eternos | Eternals; Homem-Formiga e a Vespa: Quantumania | Ant-Man and the Wasp: Quantumania; As Marvels | The Marvels; Capitão América: Admirável Mundo Novo | Captain America: Brave New World'),
    T('series', 'Séries e especiais da Marvel Studios no Disney+', 'Marvel Studios series and specials on Disney+',
      'WandaVision; Loki; Falcão e o Soldado Invernal | The Falcon and the Winter Soldier; Gavião Arqueiro | Hawkeye; Cavaleiro da Lua | Moon Knight; Ms. Marvel; Mulher-Hulk: Defensora de Heróis | She-Hulk: Attorney at Law; What If...?',
      'Invasão Secreta | Secret Invasion; Echo; Agatha Desde Sempre | Agatha All Along; Demolidor: Renascido | Daredevil: Born Again; Eu Sou Groot | I Am Groot; Lobisomem na Noite | Werewolf by Night; Guardiões da Galáxia: Especial de Festas | The Guardians of the Galaxy Holiday Special; X-Men \'97; Coração de Ferro | Ironheart',
      'Seu Amigão da Vizinhança: Homem-Aranha | Your Friendly Neighborhood Spider-Man; Marvel Zombies; Olhos de Wakanda | Eyes of Wakanda'),
    T('aranha-viloes', 'Inimigos do Homem-Aranha', 'Spider-Man villains',
      'Duende Verde | Green Goblin; Doutor Octopus | Doctor Octopus; Venom; Electro; Homem-Areia | Sandman; Lagarto | Lizard; Abutre | Vulture; Mysterio; Rino | Rhino; Carnificina | Carnage; Kraven',
      'Escorpião | Scorpion; Camaleão | Chameleon; Shocker; Duende Macabro (Hobgoblin) | Hobgoblin; Morbius; Rei do Crime (Kingpin) | Kingpin; Lápide (Tombstone) | Tombstone; Mancha (Spot) | The Spot; Homem-Hidro (Hydro-Man) | Hydro-Man; Senhor Negativo | Mister Negative; Chacal (Jackal) | Jackal; Morlun; Besouro (Beetle) | Beetle; Puma; Cabeça de Martelo (Hammerhead) | Hammerhead; Gata Negra (Black Cat) | Black Cat',
      'Boomerang; Cabelo de Prata (Silvermane) | Silvermane; Canguru (Kangaroo) | Kangaroo; Gibão (Gibbon) | Gibbon; Urso (Grizzly) | Grizzly; Roda Gigante (Big Wheel) | Big Wheel; Jack O\'Lantern; Tarântula | Tarantula; Mestre do Crime | Crime Master; Toxina (Toxin) | Toxin; Grito (Shriek) | Shriek; Enxame (Swarm) | Swarm; Stegron; Kaine; Demogoblin; Homem-Lobo (Man-Wolf) | Man-Wolf'),
    T('xmen', 'Já foram dos X-Men', 'Have been X-Men',
      'Wolverine; Ciclope | Cyclops; Jean Grey; Tempestade | Storm; Fera | Beast; Professor X; Vampira | Rogue; Gambit; Noturno | Nightcrawler; Colossus; Homem de Gelo | Iceman',
      'Lince Negra (Kitty Pryde) | Shadowcat (Kitty Pryde); Psylocke; Jubileu | Jubilee; Anjo / Arcanjo | Angel / Archangel; Emma Frost; Cable; Bishop; Destrutor (Havok) | Havok; Polaris; Magik; Banshee; Pássaro Trovejante (Thunderbird) | Thunderbird; Cristal (Dazzler) | Dazzler; Forge; X-23; Magneto',
      'Mancha Solar (Sunspot) | Sunspot; Lupina (Wolfsbane) | Wolfsbane; Míssil (Cannonball) | Cannonball; Estrela Polar (Northstar) | Northstar; Armadura (Armor) | Armor; Pixie; Rachel Summers; Medula (Marrow) | Marrow; Câmara (Chamber) | Chamber; Casca (Husk) | Husk; Sábia (Sage) | Sage; Apache (Warpath) | Warpath; Blink; Longshot; Karma; Miragem (Dani Moonstar) | Mirage (Dani Moonstar); Hope Summers; Mímico (Mimic) | Mimic; Sereia (Siryn) | Siryn'),
    T('mcu-viloes', 'Vilões dos FILMES do MCU', 'Villains of the MCU MOVIES',
      'Thanos; Loki; Ultron; Hela; Killmonger; Kang; Abutre | Vulture; Mysterio; Duende Verde | Green Goblin; Doutor Octopus | Doctor Octopus; Electro; Ego; Ronan',
      'Abominável | Abomination; Caveira Vermelha | Red Skull; Zemo; Malekith; Obadiah Stane (Monge de Ferro) | Obadiah Stane (Iron Monger); Chicote Negro (Whiplash / Ivan Vanko) | Whiplash (Ivan Vanko); Aldrich Killian; Alexander Pierce; Jaqueta Amarela (Darren Cross) | Yellowjacket (Darren Cross); Kaecilius; Dormammu; Fantasma (Ghost) | Ghost; Yon-Rogg; Treinador (Taskmaster) | Taskmaster; Wenwu (Mandarim dos Dez Anéis) | Wenwu (the Mandarin); Gorr; Namor; MODOK; Alto Evolucionário | High Evolutionary; Galactus; Homem-Areia | Sandman; Lagarto | Lizard; Hulk Vermelho | Red Hulk; Líder (Samuel Sterns) | The Leader (Samuel Sterns); Cassandra Nova; Feiticeira Escarlate (Multiverso da Loucura) | Scarlet Witch (Multiverse of Madness); Nebulosa (primeiro Guardiões) | Nebula (first Guardians); Fauce de Ébano (Ebony Maw) | Ebony Maw',
      'Surtur; Arnim Zola; Ayesha; Sonny Burch; Dreykov; Grão-Mestre | Grandmaster; Corvus Glaive; Próxima Meia-Noite | Proxima Midnight; Cull Obsidian; Taserface; Laufey; Kurse; Ikaris; Kro; Dar-Benn; Sentinela / Vácuo (Bob) | Sentry / The Void (Bob); Pyro; Ulysses Klaue; Justin Hammer; Ossos Cruzados (Crossbones) | Crossbones; Batroc; Korath; Raza; Razor Fist; Death Dealer; Paradoxo (Sr. Paradox) | Mr. Paradox; Surfista Prateada (Shalla-Bal) | Silver Surfer (Shalla-Bal)'),
    T('lugares', 'Lugares da Marvel (planetas, reinos, cidades)', 'Marvel places (planets, realms, cities)',
      'Asgard; Wakanda; Titã | Titan; Sakaar; Xandar; Nova York | New York; Sokóvia | Sokovia; Kamar-Taj; Reino Quântico | Quantum Realm; Lugar Nenhum (Knowhere) | Knowhere',
      'Vormir; Morag; Nidavellir; Jotunheim; Muspelheim; Hala (planeta dos Kree) | Hala (Kree homeworld); Latvéria | Latveria; Genosha; Madripur | Madripoor; Talokan; Sanctum Sanctorum; Mansão X (Escola Xavier) | X-Mansion (Xavier\'s School); Hell\'s Kitchen; Krakoa; Dimensão Sombria | Dark Dimension; Zona Negativa | Negative Zone; Mundo Bélico (Battleworld) | Battleworld; Ta Lo; K\'un-Lun; Attilan; Contraterra | Counter-Earth; Ego (o planeta vivo) | Ego (the living planet); Vanaheim; Torre dos Vingadores (Torre Stark) | Avengers Tower (Stark Tower); Westview; Nova Asgard | New Asgard',
      'Terra Selvagem (Savage Land) | Savage Land; Ilha Monstro | Monster Island; Zenn-La; Svartalfheim; Limbo; O Vazio (The Void) | The Void; Tarnax IV (planeta dos Skrull) | Tarnax IV (Skrull homeworld); Base dos Vingadores | Avengers Compound; Ravencroft; Balsa (The Raft) | The Raft'),
    T('objetos', 'Armas, objetos e materiais da Marvel', 'Marvel weapons, objects and materials',
      'Mjolnir; Escudo do Capitão América | Captain America\'s Shield; Manopla do Infinito | Infinity Gauntlet; Rompe-Tormentas (Stormbreaker) | Stormbreaker; Tesseract; Armadura do Homem de Ferro | Iron Man Armor; Capa da Levitação | Cloak of Levitation; Olho de Agamotto | Eye of Agamotto; Joia do Espaço | Space Stone; Joia da Mente | Mind Stone; Joia da Realidade | Reality Stone; Joia do Poder | Power Stone; Joia do Tempo | Time Stone; Joia da Alma | Soul Stone',
      'Dez Anéis | Ten Rings; Necroespada | Necrosword; Cetro do Loki | Loki\'s Scepter; Éter | Aether; Orbe | Orb; Reator Arc | Arc Reactor; Armadura Hulkbuster | Hulkbuster Armor; Lançador de Teias | Web-Shooters; Elmo do Magneto | Magneto\'s Helmet; Cérebro | Cerebro; Darkhold; Garras de Adamantium | Adamantium Claws; Arco do Gavião Arqueiro | Hawkeye\'s Bow; Traje do Homem-Formiga | Ant-Man Suit; Vibranium; Adamantium; Mordida da Viúva (Widow\'s Bite) | Widow\'s Bite; Bracelete da Ms. Marvel | Ms. Marvel\'s Bangle; Walkman do Senhor das Estrelas | Star-Lord\'s Walkman',
      'Jarnbjorn; Uru; Livro de Vishanti | Book of the Vishanti; Lança de Odin (Gungnir) | Gungnir (Odin\'s Spear); Partículas Pym | Pym Particles; Soro do Supersoldado | Super-Soldier Serum; Simbionte | Symbiote; Coroa Serpente | Serpent Crown; Cubo Cósmico | Cosmic Cube'),
    T('homem-mulher', 'Heróis e vilões com "Homem" ou "Mulher" no nome', 'Heroes and villains with "Man", "Woman" or "She" in the name',
      'Homem-Aranha | Spider-Man; Homem de Ferro | Iron Man; Homem-Formiga | Ant-Man; Mulher-Hulk | She-Hulk; Homem-Areia | Sandman; Mulher Invisível | Invisible Woman',
      'Homem de Gelo | Iceman; Mulher-Aranha | Spider-Woman; Homem-Coisa | Man-Thing; Homem-Molécula | Molecule Man; Homem-Absorvente | Absorbing Man; Homem-Máquina | Machine Man; Homem-Hidro | Hydro-Man; Homem-Púrpura | Purple Man; Homem-Gigante | Giant-Man; Homem-Aranha 2099 | Spider-Man 2099; Mulher-Hulk Vermelha | Red She-Hulk',
      'Homem-Lobo | Man-Wolf; Homem Impossível | Impossible Man; Homem-Toupeira | Mole Man; Homem de Ferro 2020 | Iron Man 2020'),
    T('guardioes', 'Já foram dos Guardiões da Galáxia (HQ ou filme)', 'Have been Guardians of the Galaxy (comics or movies)',
      'Senhor das Estrelas | Star-Lord; Gamora; Drax; Rocket; Groot; Mantis; Nebulosa | Nebula',
      'Kraglin; Cosmo; Adam Warlock; Yondu; Nova (Richard Rider); Phyla-Vell; Dragão da Lua (Moondragon) | Moondragon; Bug',
      'Agente Venom (Flash Thompson) | Agent Venom (Flash Thompson); Capitã Marvel | Captain Marvel; Coisa | The Thing; Angela; Kitty Pryde; Martinex; Charlie-27; Nikki; Falcão Estelar (Starhawk) | Starhawk; Aleta; Vance Astro; Jack Flag; Mainframe'),
    T('estalo', 'Viraram pó no estalo do Thanos (Guerra Infinita)', 'Turned to dust in Thanos\' snap (Infinity War)',
      'Homem-Aranha | Spider-Man; Pantera Negra | Black Panther; Doutor Estranho | Doctor Strange; Feiticeira Escarlate | Scarlet Witch; Falcão | Falcon; Soldado Invernal | Winter Soldier; Senhor das Estrelas | Star-Lord; Groot',
      'Drax; Mantis; Nick Fury; Maria Hill; Vespa (Hope van Dyne) | Wasp (Hope van Dyne); Shuri',
      'Hank Pym; Janet van Dyne; Laura Barton (mulher do Gavião) | Laura Barton (Hawkeye\'s wife); Filhos do Gavião | Hawkeye\'s kids; Monica Rambeau; Tia May | Aunt May; Ned Leeds; Betty Brant'),
    T('xmen-viloes', 'Inimigos dos X-Men', 'X-Men villains',
      'Magneto; Mística | Mystique; Dentes-de-Sabre | Sabretooth; Fanático (Juggernaut) | Juggernaut; Apocalipse | Apocalypse; Sentinelas | Sentinels',
      'Senhor Sinistro | Mister Sinister; Massacre (Onslaught) | Onslaught; Lady Letal (Deathstrike) | Lady Deathstrike; Ômega Vermelho | Omega Red; Sapo (Toad) | Toad; Blob; Pyro; William Stryker; Bolivar Trask; Cassandra Nova; Rei das Sombras | Shadow King; Selene; Mojo; Bastion; Arcade',
      'Mastermind; Avalanche; Destino (Irene Adler) | Destiny (Irene Adler); Fera Negra (Dark Beast) | Dark Beast; Vulcano | Vulcan; Êxodo | Exodus; Nimrod; Ahab; Calisto | Callisto; Fênix Negra | Dark Phoenix; Mãe Molde (Master Mold) | Master Mold'),
    T('thor-mundo', 'Personagens do universo do Thor (deuses, gigantes e companhia)', 'Characters from Thor\'s universe (gods, giants and company)',
      'Thor; Loki; Odin; Hela; Valquíria | Valkyrie; Heimdall; Jane Foster',
      'Frigga; Sif; Os Três Guerreiros (Volstagg, Fandral, Hogun) | The Warriors Three (Volstagg, Fandral, Hogun); Surtur; Malekith; Encantor (Amora) | Enchantress (Amora); Executor (Skurge) | Executioner (Skurge); Korg; Miek; Laufey; Gorr; Bill Raio Beta | Beta Ray Bill; Darcy Lewis; Erik Selvig; Grão-Mestre | Grandmaster',
      'Bor; Ymir; Fenris; Jormungand (Serpente de Midgard) | Jormungand (Midgard Serpent); Kurse; Ulik; Balder; Tyr; Karnilla; Destruidor | The Destroyer; Angela'),
  ]

  const en = () => !!(raiz.Lingua && raiz.Lingua.en())
  const porId = (id) => TEMAS.find((t) => t.id === id)
  const todos = () => TEMAS
  const montar = (_, tema) => ({ id: tema.id, titulo: tema.titulo, itens: tema.itens.map(([n, v, ingles]) => ({ n, v, en: ingles || '' })).sort((a, b) => a.n.localeCompare(b.n, 'pt')) })
  // na tela: o título e os nomes na língua de quem está olhando (o jogo guarda tudo em português)
  const titulo = (id, pt) => { const t = porId(id); return t && en() ? t.en : (t ? t.titulo : pt) }
  const nome = (id, pt) => {
    if (!en() || !pt) return pt
    const t = porId(id)
    const it = t && t.itens.find(([n]) => n === pt)
    return (it && it[2]) || pt
  }
  raiz.ApostoTemas = { todos, montar, titulo, nome }
})(typeof window !== 'undefined' ? window : globalThis)
