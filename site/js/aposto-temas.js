// Aposto Que Sei: os temas. Cada tema é uma lista fechada de respostas certas, separadas por raridade:
// 1 = todo mundo lembra, 2 = quem acompanha lembra, 3 = só quem sabe muito. No modo Raridade cada nome vale isso em pontos.
// O juiz procura o nome falado aqui; se não está na lista, é erro. Por isso as listas são longas e com os nomes em PT e EN.
(function (raiz) {
  const L = (s) => s.split(';').map((x) => x.trim()).filter(Boolean)
  const T = (id, titulo, um, dois, tres) => ({ id, titulo, itens: [...L(um).map((n) => [n, 1]), ...L(dois).map((n) => [n, 2]), ...L(tres).map((n) => [n, 3])] })

  const TEMAS = [
    T('filmes', 'Filmes do MCU',
      'Homem de Ferro; Os Vingadores; Vingadores: Era de Ultron; Vingadores: Guerra Infinita; Vingadores: Ultimato; Guardiões da Galáxia; Pantera Negra; Capitão América: Guerra Civil; Thor: Ragnarok; Homem-Aranha: Sem Volta Para Casa; Doutor Estranho; Capitã Marvel; Homem-Formiga; Deadpool & Wolverine',
      'Homem de Ferro 2; Homem de Ferro 3; Thor; Thor: O Mundo Sombrio; Capitão América: O Primeiro Vingador; Capitão América 2: O Soldado Invernal; Guardiões da Galáxia Vol. 2; Guardiões da Galáxia Vol. 3; Homem-Aranha: De Volta ao Lar; Homem-Aranha: Longe de Casa; Homem-Formiga e a Vespa; Viúva Negra; Shang-Chi e a Lenda dos Dez Anéis; Doutor Estranho no Multiverso da Loucura; Thor: Amor e Trovão; Pantera Negra: Wakanda Para Sempre; Thunderbolts*; Quarteto Fantástico: Primeiros Passos; Homem-Aranha: Um Novo Dia',
      'O Incrível Hulk; Eternos; Homem-Formiga e a Vespa: Quantumania; As Marvels; Capitão América: Admirável Mundo Novo'),
    T('series', 'Séries e especiais da Marvel Studios no Disney+',
      'WandaVision; Loki; Falcão e o Soldado Invernal; Gavião Arqueiro; Cavaleiro da Lua; Ms. Marvel; Mulher-Hulk: Defensora de Heróis; What If...?',
      'Invasão Secreta; Echo; Agatha Desde Sempre; Demolidor: Renascido; Eu Sou Groot; Lobisomem na Noite; Guardiões da Galáxia: Especial de Festas; X-Men \'97; Coração de Ferro',
      'Seu Amigão da Vizinhança: Homem-Aranha; Marvel Zombies; Olhos de Wakanda'),
    T('aranha-viloes', 'Inimigos do Homem-Aranha',
      'Duende Verde; Doutor Octopus; Venom; Electro; Homem-Areia; Lagarto; Abutre; Mysterio; Rino; Carnificina; Kraven',
      'Escorpião; Camaleão; Shocker; Duende Macabro (Hobgoblin); Morbius; Rei do Crime (Kingpin); Lápide (Tombstone); Mancha (Spot); Homem-Hidro (Hydro-Man); Senhor Negativo; Chacal (Jackal); Morlun; Besouro (Beetle); Puma; Cabeça de Martelo (Hammerhead); Gata Negra (Black Cat)',
      'Boomerang; Cabelo de Prata (Silvermane); Canguru (Kangaroo); Gibão (Gibbon); Urso (Grizzly); Roda Gigante (Big Wheel); Jack O\'Lantern; Tarântula; Mestre do Crime; Toxina (Toxin); Grito (Shriek); Enxame (Swarm); Stegron; Kaine; Demogoblin; Homem-Lobo (Man-Wolf)'),
    T('xmen', 'Já foram dos X-Men',
      'Wolverine; Ciclope; Jean Grey; Tempestade; Fera; Professor X; Vampira; Gambit; Noturno; Colossus; Homem de Gelo',
      'Lince Negra (Kitty Pryde); Psylocke; Jubileu; Anjo / Arcanjo; Emma Frost; Cable; Bishop; Destrutor (Havok); Polaris; Magik; Banshee; Pássaro Trovejante (Thunderbird); Cristal (Dazzler); Forge; X-23; Magneto',
      'Mancha Solar (Sunspot); Lupina (Wolfsbane); Míssil (Cannonball); Estrela Polar (Northstar); Armadura (Armor); Pixie; Rachel Summers; Medula (Marrow); Câmara (Chamber); Casca (Husk); Sábia (Sage); Apache (Warpath); Blink; Longshot; Karma; Miragem (Dani Moonstar); Hope Summers; Mímico (Mimic); Sereia (Siryn)'),
    T('mcu-viloes', 'Vilões dos FILMES do MCU',
      'Thanos; Loki; Ultron; Hela; Killmonger; Kang; Abutre; Mysterio; Duende Verde; Doutor Octopus; Electro; Ego; Ronan',
      'Abominável; Caveira Vermelha; Zemo; Malekith; Obadiah Stane (Monge de Ferro); Chicote Negro (Whiplash / Ivan Vanko); Aldrich Killian; Alexander Pierce; Jaqueta Amarela (Darren Cross); Kaecilius; Dormammu; Fantasma (Ghost); Yon-Rogg; Treinador (Taskmaster); Wenwu (Mandarim dos Dez Anéis); Gorr; Namor; MODOK; Alto Evolucionário; Galactus; Homem-Areia; Lagarto; Hulk Vermelho; Líder (Samuel Sterns); Cassandra Nova; Feiticeira Escarlate (Multiverso da Loucura); Nebulosa (primeiro Guardiões); Fauce de Ébano (Ebony Maw)',
      'Surtur; Arnim Zola; Ayesha; Sonny Burch; Dreykov; Grão-Mestre; Corvus Glaive; Próxima Meia-Noite; Cull Obsidian; Taserface; Laufey; Kurse; Ikaris; Kro; Dar-Benn; Sentinela / Vácuo (Bob); Pyro; Ulysses Klaue; Justin Hammer; Ossos Cruzados (Crossbones); Batroc; Korath; Raza; Razor Fist; Death Dealer; Paradoxo (Sr. Paradox); Surfista Prateada (Shalla-Bal)'),
    T('lugares', 'Lugares da Marvel (planetas, reinos, cidades)',
      'Asgard; Wakanda; Titã; Sakaar; Xandar; Nova York; Sokóvia; Kamar-Taj; Reino Quântico; Lugar Nenhum (Knowhere)',
      'Vormir; Morag; Nidavellir; Jotunheim; Muspelheim; Hala (planeta dos Kree); Latvéria; Genosha; Madripur; Talokan; Sanctum Sanctorum; Mansão X (Escola Xavier); Hell\'s Kitchen; Krakoa; Dimensão Sombria; Zona Negativa; Mundo Bélico (Battleworld); Ta Lo; K\'un-Lun; Attilan; Contraterra; Ego (o planeta vivo); Vanaheim; Torre dos Vingadores (Torre Stark); Westview; Nova Asgard',
      'Terra Selvagem (Savage Land); Ilha Monstro; Zenn-La; Svartalfheim; Limbo; O Vazio (The Void); Tarnax IV (planeta dos Skrull); Base dos Vingadores; Ravencroft; Balsa (The Raft)'),
    T('objetos', 'Armas, objetos e materiais da Marvel',
      'Mjolnir; Escudo do Capitão América; Manopla do Infinito; Rompe-Tormentas (Stormbreaker); Tesseract; Armadura do Homem de Ferro; Capa da Levitação; Olho de Agamotto; Joia do Espaço; Joia da Mente; Joia da Realidade; Joia do Poder; Joia do Tempo; Joia da Alma',
      'Dez Anéis; Necroespada; Cetro do Loki; Éter; Orbe; Reator Arc; Armadura Hulkbuster; Lançador de Teias; Elmo do Magneto; Cérebro; Darkhold; Garras de Adamantium; Arco do Gavião Arqueiro; Traje do Homem-Formiga; Vibranium; Adamantium; Mordida da Viúva (Widow\'s Bite); Bracelete da Ms. Marvel; Walkman do Senhor das Estrelas',
      'Jarnbjorn; Uru; Livro de Vishanti; Lança de Odin (Gungnir); Partículas Pym; Soro do Supersoldado; Simbionte; Coroa Serpente; Cubo Cósmico'),
    T('homem-mulher', 'Heróis e vilões com "Homem" ou "Mulher" no nome',
      'Homem-Aranha; Homem de Ferro; Homem-Formiga; Mulher-Hulk; Homem-Areia; Mulher Invisível',
      'Homem de Gelo; Mulher-Aranha; Homem-Coisa; Homem-Molécula; Homem-Absorvente; Homem-Máquina; Homem-Hidro; Homem-Púrpura; Homem-Gigante; Homem-Aranha 2099; Mulher-Hulk Vermelha',
      'Homem-Lobo; Homem Impossível; Homem-Toupeira; Homem de Ferro 2020'),
    T('guardioes', 'Já foram dos Guardiões da Galáxia (HQ ou filme)',
      'Senhor das Estrelas; Gamora; Drax; Rocket; Groot; Mantis; Nebulosa',
      'Kraglin; Cosmo; Adam Warlock; Yondu; Nova (Richard Rider); Phyla-Vell; Dragão da Lua (Moondragon); Bug',
      'Agente Venom (Flash Thompson); Capitã Marvel; Coisa; Angela; Kitty Pryde; Martinex; Charlie-27; Nikki; Falcão Estelar (Starhawk); Aleta; Vance Astro; Jack Flag; Mainframe'),
    T('estalo', 'Viraram pó no estalo do Thanos (Guerra Infinita)',
      'Homem-Aranha; Pantera Negra; Doutor Estranho; Feiticeira Escarlate; Falcão; Soldado Invernal; Senhor das Estrelas; Groot',
      'Drax; Mantis; Nick Fury; Maria Hill; Vespa (Hope van Dyne); Shuri',
      'Hank Pym; Janet van Dyne; Laura Barton (mulher do Gavião); Filhos do Gavião; Monica Rambeau; Tia May; Ned Leeds; Betty Brant'),
    T('xmen-viloes', 'Inimigos dos X-Men',
      'Magneto; Mística; Dentes-de-Sabre; Fanático (Juggernaut); Apocalipse; Sentinelas',
      'Senhor Sinistro; Massacre (Onslaught); Lady Letal (Deathstrike); Ômega Vermelho; Sapo (Toad); Blob; Pyro; William Stryker; Bolivar Trask; Cassandra Nova; Rei das Sombras; Selene; Mojo; Bastion; Arcade',
      'Mastermind; Avalanche; Destino (Irene Adler); Fera Negra (Dark Beast); Vulcano; Êxodo; Nimrod; Ahab; Calisto; Fênix Negra; Mãe Molde (Master Mold)'),
    T('thor-mundo', 'Personagens do universo do Thor (deuses, gigantes e companhia)',
      'Thor; Loki; Odin; Hela; Valquíria; Heimdall; Jane Foster',
      'Frigga; Sif; Os Três Guerreiros (Volstagg, Fandral, Hogun); Surtur; Malekith; Encantor (Amora); Executor (Skurge); Korg; Miek; Laufey; Gorr; Bill Raio Beta; Darcy Lewis; Erik Selvig; Grão-Mestre',
      'Bor; Ymir; Fenris; Jormungand (Serpente de Midgard); Kurse; Ulik; Balder; Tyr; Karnilla; Destruidor; Angela'),
  ]

  const todos = () => TEMAS
  const montar = (_, tema) => ({ id: tema.id, titulo: tema.titulo, itens: tema.itens.map(([n, v]) => ({ n, v })).sort((a, b) => a.n.localeCompare(b.n, 'pt')) })
  raiz.ApostoTemas = { todos, montar }
})(typeof window !== 'undefined' ? window : globalThis)
