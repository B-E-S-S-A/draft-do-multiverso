// Testes da invasão do Doutor Destino: um jogo por dia na última semana, tudo na estreia, e depois volta ao normal.
import assert from 'assert'
globalThis.window = globalThis
globalThis.Lingua = { t: (pt) => pt }
let hoje = '2026-12-01'
globalThis.DestinoMotor = { diaDe: () => hoje }
await import('../site/js/invasao.js')
const I = globalThis.Invasao
const JOGOS = ['draft', 'impostor', 'aposto', 'grade', 'arquivo', 'lab', 'missao']

assert.strictEqual(I.fase(), 'nada')
assert.deepStrictEqual(I.tomados(), [])
assert(!I.tomado('home'))
assert.deepStrictEqual(new Set(I.ORDEM.map((x) => x[1])), new Set(JOGOS), 'todos os jogos entram na fila')

hoje = '2026-12-09'; assert.strictEqual(I.fase(), 'nada', 'na véspera ainda não')
hoje = '2026-12-10'; assert.strictEqual(I.fase(), 'invadindo'); assert.deepStrictEqual(I.tomados(), ['missao']); assert(I.tomado('missao') && !I.tomado('grade') && !I.tomado('home'))
hoje = '2026-12-12'; assert.strictEqual(I.tomados().length, 3, 'um por dia, e o que tomou continua tomado')
assert.strictEqual(I.status(), 'Destino já tomou 3 de 7 jogos.')
hoje = '2026-12-16'; assert.strictEqual(I.tomados().length, 7); assert(!I.tomado('home'), 'a banca só cai na estreia')
hoje = '2026-12-17'; assert.strictEqual(I.fase(), 'total'); assert(I.tomado('home') && I.tomado('destino') && I.tomado('grade'))
assert(I.letreiro('home', ['a', 'b'])[0].includes('Latvéria'))
assert.strictEqual(I.status(), '')
hoje = '2026-12-20'; assert.strictEqual(I.fase(), 'total')
hoje = '2026-12-21'; assert.strictEqual(I.fase(), 'nada', 'depois do fim de semana volta ao normal'); assert(!I.tomado('grade'))
assert.deepStrictEqual(I.letreiro('grade', ['a', 'b']), ['a', 'b'])

// quem fala o quê
assert.strictEqual(I.falasDe('grade-erro').length, 3)
assert.strictEqual(I.falasDe('grade-fim')[0]({ nome: 'Ana' }), 'Ana venceu. Destino permitiu.')
assert.strictEqual(I.falasDe('abriu-grade'), I.GERAL)
console.log('ok · calendário da invasão')
