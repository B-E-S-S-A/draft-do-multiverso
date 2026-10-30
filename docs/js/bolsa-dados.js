// Bolsa do Multiverso: quem pode virar ação (com código estilo B3) e as manchetes do Clarim Diário.
// {n} vira o nome do personagem. d = quanto o preço muda no fechamento.
(function () {
  const ACOES = {
    'spider-man': 'ARAN3', 'iron-man': 'STRK4', 'captain-america': 'AMER3', thor: 'THOR4', hulk: 'HULK3', 'black-widow': 'VIUV3',
    hawkeye: 'GAVI3', 'black-panther': 'WKND3', 'doctor-strange': 'ESTR3', 'captain-marvel': 'MRVL3', 'scarlet-witch': 'WAND3',
    vision: 'VISO3', loki: 'LOKI3', thanos: 'THNS4', wolverine: 'WOLV3', deadpool: 'DPOL3', groot: 'GROO3', rocket: 'RCKT3',
    'star-lord': 'QUIL3', gamora: 'GAMO3', venom: 'VENM3', 'green-goblin': 'DUEN3', magneto: 'MAGN3', storm: 'TEMP3',
    'jean-grey': 'JEAN3', 'professor-x': 'XAVI3', 'doctor-doom': 'DOOM4', 'ant-man': 'FORM3', daredevil: 'DEMO3', punisher: 'JUST3',
    'miles-morales': 'MILE3', 'shang-chi': 'SHNG3', 'ms-marvel': 'KMAL3', 'moon-knight': 'LUAS3', 'she-hulk': 'SHLK3', kang: 'KANG3',
    ultron: 'ULTR3', hela: 'HELA3', 'silver-surfer': 'SURF3', galactus: 'GLCT4', howard: 'PATO3', mysterio: 'MYST3',
  }

  // notícias comuns: servem pra qualquer personagem
  const BOAS = [
    [8, 'Bilheteria de {n} passa de 1 bilhão'], [7, 'Filme solo de {n} confirmado na Comic-Con'],
    [6, '{n} salva o planeta (de novo) e vira capa de todas as revistas'], [6, 'Trailer de {n} bate recorde de visualizações'],
    [6, '{n} entra pros Vingadores'], [5, 'Série de {n} é a mais vista do streaming'],
    [4, 'Boneco de {n} esgota no Natal'], [4, '{n} aparece numa cena pós-créditos'], [3, 'Enquete do Clarim: {n} é o herói da semana'],
    [3, '{n} ganha uniforme novo e a internet aprova'], [3, '{n} ajuda vovó a atravessar a rua; vídeo viraliza'],
    [2, 'Fã-clube de {n} lota a praça'], [2, 'Quadrinho antigo de {n} é vendido por uma fortuna'], [4, '{n} faz participação surpresa no filme de outro herói'],
  ]
  const RUINS = [
    [-7, '{n} destrói metade de Nova York; a prefeitura manda a conta'], [-6, 'Filme de {n} é adiado pela quinta vez'],
    [-6, '{n} vira vilão numa saga nova e os fãs choram'], [-5, 'Série de {n} é cancelada depois de uma temporada'],
    [-6, 'Reboot de {n} com elenco novo; fãs revoltados'], [-3, 'J. Jonah Jameson: "{n} é uma ameaça!"'],
    [-3, '{n} é flagrado brigando com outro herói'], [-2, 'Uniforme novo de {n} vira meme'], [-4, '{n} esquece de aparecer na batalha final'],
    [-3, 'Crítica detona o último quadrinho de {n}'], [-2, '{n} é visto comendo shawarma sem pagar'],
    [-4, 'Um Skrull se passou por {n} e aprontou na cidade'], [-5, '{n} revela a identidade secreta numa live sem querer'],
  ]
  // a Marvel sempre traz de volta: quem morre costuma voltar umas rodadas depois
  const MORTE = [-8, '{n} MORRE nos quadrinhos (de novo)']
  const VOLTA = [8, '{n} volta dos mortos! Ninguém ficou surpreso']

  // notícias de personagens específicos (entram no sorteio junto com as comuns)
  const PROPRIAS = {
    thor: [[5, 'Thor recupera o martelo'], [-4, 'Thor perde o martelo de novo']],
    hulk: [[-5, 'Hulk esmaga o carro do próprio patrocinador'], [4, 'Banner controla o Hulk numa entrevista ao vivo']],
    loki: [[-6, 'Loki trai todo mundo. Ninguém ficou surpreso'], [6, 'Loki salva o dia e ninguém acredita']],
    'spider-man': [[-3, 'Clarim: "Homem-Aranha é uma ameaça!" (de novo)'], [5, 'Homem-Aranha segura um bonde com as teias']],
    'iron-man': [[6, 'Stark lança armadura nova'], [-5, 'Stark esquece a armadura no táxi']],
    thanos: [[6, 'Thanos acha mais uma joia'], [-6, 'Thanos se aposenta pra plantar no campo']],
    deadpool: [[5, 'Deadpool quebra a quarta parede e os recordes'], [-4, 'Deadpool fala mal do próprio filme']],
    groot: [[3, 'Groot diz "Eu sou Groot"; analistas comemoram'], [-3, 'Groot pega cupim']],
    howard: [[8, 'Howard, o Pato, ganha filme próprio (é sério)'], [-2, 'Howard, o Pato, é confundido com um pato comum']],
    'doctor-doom': [[6, 'Latvéria vira potência mundial'], [-5, 'Destino exige ser chamado de DOUTOR na entrevista e sai irritado']],
    wolverine: [[5, 'Wolverine entra em mais uma equipe'], [-3, 'Wolverine some por três edições']],
    'captain-america': [[4, 'Capitão América levanta o martelo do Thor'], [-6, 'Capitão revela que é da HIDRA (de novo)']],
    galactus: [[-6, 'Galactus come o planeta errado'], [5, 'Galactus faz dieta e poupa a Terra']],
    venom: [[4, 'Venom vira herói por uma semana'], [-4, 'Venom morde um repórter']],
    'black-panther': [[5, 'Wakanda abre as fronteiras e o vibranium dispara'], [-3, 'Wakanda fecha as fronteiras de novo']],
    'scarlet-witch': [[7, 'Wanda reescreve a realidade (pra melhor)'], [-7, 'Wanda: "Chega de mutantes"']],
    'ant-man': [[4, 'Homem-Formiga salva o dia de tamanho mini'], [-3, 'Homem-Formiga fica preso no Reino Quântico']],
    rocket: [[3, 'Rocket constrói arma com uma torradeira'], [-3, 'Rocket rouba a perna de alguém (de novo)']],
    'professor-x': [[4, 'Xavier abre escola nova'], [-4, 'Xavier lê a mente do diretor da bolsa']],
    magneto: [[5, 'Magneto vira herói (por enquanto)'], [-5, 'Magneto levanta uma ponte inteira']],
    kang: [[-4, 'Kang aparece em 12 versões e ninguém entende nada'], [5, 'Kang conquista uma linha do tempo']],
    ultron: [[-5, 'Ultron baixa em todos os celulares'], [3, 'Ultron promete "paz no nosso tempo"']],
  }

  // notícias que mexem na bolsa toda
  const GERAIS = [
    [-2, 'Incursão no multiverso: a bolsa toda cai'], [2, 'Fim de semana de estreia: a bolsa toda sobe'],
    [-3, 'Galactus foi visto perto da Terra: pânico geral'], [3, 'Os Vingadores salvaram o dia: euforia na bolsa'],
  ]
  // o estalo: metade das ações perde metade do preço (no máximo uma vez por partida)
  const ESTALO = 'THANOS ESTALOU OS DEDOS: metade das ações vira pó'

  window.BolsaDados = { ACOES, BOAS, RUINS, MORTE, VOLTA, PROPRIAS, GERAIS, ESTALO }
})()
