// Laboratório: quem pode sair. Os 154 de HQ, os do MCU que só existem lá e mais o pessoal dos filmes e séries
// (esses aparecem com o cartaz da obra, como o MCU no Draft). [chave, nome em português, nome em inglês (vazio = igual), obra]
(function (raiz) {
  const D = raiz.DRAFT_DATA
  const EXTRAS = [
    ['pepper-potts', 'Pepper Potts', '', 'im1'], ['happy-hogan', 'Happy Hogan', '', 'im1'], ['iron-monger', 'Monge de Ferro', 'Iron Monger', 'im1'],
    ['betty-ross', 'Betty Ross', '', 'hulk08'], ['general-ross', 'General Ross', '', 'hulk08'],
    ['whiplash', 'Chicote Negro', 'Whiplash', 'im2'], ['justin-hammer', 'Justin Hammer', '', 'im2'],
    ['peggy-carter', 'Peggy Carter', '', 'cap1'], ['howard-stark', 'Howard Stark', '', 'cap1'], ['dum-dum', 'Dum Dum Dugan', '', 'cap1'],
    ['coulson', 'Phil Coulson', '', 'av1'], ['maria-hill', 'Maria Hill', '', 'av1'],
    ['sharon-carter', 'Sharon Carter', '', 'cap2'], ['alexander-pierce', 'Alexander Pierce', '', 'cap2'], ['batroc', 'Batroc', '', 'cap2'], ['crossbones', 'Ossos Cruzados', 'Crossbones', 'cap2'],
    ['korath', 'Korath', '', 'gotg1'], ['kraglin', 'Kraglin', '', 'gotg1'], ['cosmo', 'Cosmo', '', 'gotg1'], ['collector', 'Colecionador', 'The Collector', 'gotg1'],
    ['hank-pym', 'Hank Pym', '', 'antman'], ['luis', 'Luis', '', 'antman'], ['yellowjacket', 'Jaqueta Amarela', 'Yellowjacket', 'antman'],
    ['everett-ross', 'Everett Ross', '', 'cap3'],
    ['mordo', 'Mordo', '', 'strange1'], ['kaecilius', 'Kaecilius', '', 'strange1'], ['christine-palmer', 'Christine Palmer', '', 'strange1'],
    ['ayesha', 'Ayesha', '', 'gotg2'], ['taserface', 'Taserface', '', 'gotg2'],
    ['aunt-may', 'Tia May', 'Aunt May', 'spidey1'], ['ned-leeds', 'Ned Leeds', '', 'spidey1'], ['mj', 'MJ', '', 'spidey1'], ['flash-thompson', 'Flash Thompson', '', 'spidey1'], ['shocker', 'Shocker', '', 'spidey1'],
    ['jjj', 'J. Jonah Jameson', '', 'spidey2'],
    ['korg', 'Korg', '', 'thor3'], ['heimdall', 'Heimdall', '', 'thor3'], ['skurge', 'Skurge', '', 'thor3'], ['miek', 'Miek', '', 'thor3'],
    ['nakia', 'Nakia', '', 'bp1'], ['mbaku', 'M’Baku', '', 'bp1'], ['tchaka', 'T’Chaka', '', 'bp1'], ['ramonda', 'Ramonda', '', 'bp1'], ['klaue', 'Ulysses Klaue', '', 'bp1'],
    ['ebony-maw', 'Fauce de Ébano', 'Ebony Maw', 'av3'], ['proxima', 'Próxima Meia-Noite', 'Proxima Midnight', 'av3'], ['corvus', 'Corvus Glaive', '', 'av3'], ['cull', 'Cull Obsidian', '', 'av3'],
    ['goliath', 'Golias', 'Goliath', 'antman2'],
    ['talos', 'Talos', '', 'cm1'], ['goose', 'Goose', '', 'cm1'], ['yon-rogg', 'Yon-Rogg', '', 'cm1'], ['mar-vell', 'Mar-Vell', '', 'cm1'],
    ['melina', 'Melina', '', 'bw'], ['dreykov', 'Dreykov', '', 'bw'],
    ['xialing', 'Xialing', '', 'shangchi'], ['razor-fist', 'Razor Fist', '', 'shangchi'], ['morris', 'Morris', '', 'shangchi'],
    ['kingo', 'Kingo', '', 'eternals'], ['phastos', 'Phastos', '', 'eternals'], ['druig', 'Druig', '', 'eternals'], ['makkari', 'Makkari', '', 'eternals'], ['gilgamesh', 'Gilgamesh', '', 'eternals'], ['ajak', 'Ajak', '', 'eternals'], ['sprite', 'Sprite', '', 'eternals'],
    ['gargantos', 'Gargantos', '', 'strange2'], ['rintrah', 'Rintrah', '', 'strange2'],
    ['attuma', 'Attuma', '', 'bp2'], ['namora', 'Namora', '', 'bp2'],
    ['cassie-lang', 'Cassie Lang', '', 'antman3'], ['lylla', 'Lylla', '', 'gotg3'], ['dar-benn', 'Dar-Benn', '', 'marvels'],
    ['paradox', 'Paradox', '', 'dpw'], ['dogpool', 'Dogpool', '', 'dpw'], ['valentina', 'Valentina de Fontaine', '', 'tbolts'], ['herbie', 'H.E.R.B.I.E.', '', 'ff'], ['mole-man', 'Toupeira', 'Mole Man', 'ff'],
    ['jimmy-woo', 'Jimmy Woo', '', 'wv'], ['darcy', 'Darcy Lewis', '', 'wv'], ['joaquin-torres', 'Joaquin Torres', '', 'fws'],
    ['mobius', 'Mobius', '', 'loki'], ['he-who-remains', 'Aquele Que Permanece', 'He Who Remains', 'loki'], ['miss-minutes', 'Senhorita Minutos', 'Miss Minutes', 'loki'],
    ['arthur-harrow', 'Arthur Harrow', '', 'mk'], ['scarlet-scarab', 'Escaravelho Escarlate', 'Scarlet Scarab', 'mk'], ['titania', 'Titania', '', 'shehulk'], ['kazi', 'Kazi', '', 'hawkeye'],
    ['foggy', 'Foggy Nelson', '', 'ddba'], ['karen-page', 'Karen Page', '', 'ddba'], ['the-hood', 'Capuz', 'The Hood', 'ironheart'], ['trish', 'Trish Walker', '', 'jj'], ['misty-knight', 'Misty Knight', '', 'lc'], ['cottonmouth', 'Cottonmouth', '', 'lc'],
  ]
  const hq = new Set(D.hq.map((h) => h.key))
  // quem já ganhou capa de HQ ou entrou no Draft dos filmes sai da lista de extras
  const noDraft = new Set([...hq, ...D.mcu.map((m) => m.key)])
  const extras = {}
  EXTRAS.forEach(([key, n, en, w]) => { if (!noDraft.has(key)) extras[key] = { key, n, en: en || n, w } })
  const soMcu = D.mcu.map((m, i) => ({ key: m.key, i })).filter((x) => !hq.has(x.key))
  // a lista de antes dos personagens novos: o desafio do dia que já estava no ar continua igual
  const eraHq = D.hq.slice(0, 154).map((h) => h.key)
  const antigas = [...eraHq, ...D.mcu.slice(0, 104).filter((m) => !eraHq.includes(m.key)).map((m) => m.key), ...EXTRAS.map((x) => x[0])]
  raiz.LabElenco = { chaves: [...hq, ...soMcu.map((x) => x.key), ...Object.keys(extras)], extras, soMcu, antigas }
})(typeof window !== 'undefined' ? window : globalThis)
