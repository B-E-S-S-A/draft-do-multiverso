// Simula muitos leilões aleatórios e confere as regras. Uso: node tests/engine.test.mjs
import { readFileSync } from 'node:fs'
import vm from 'node:vm'
import assert from 'node:assert/strict'

const fake = (src, n) => Array.from({ length: n }, (_, i) => ({ key: src === 'mcu' && i < 20 ? 'k' + i : src + i, n: 'P' + i, f: 1 + (i % 5), s: 'HVA'[i % 3], i, w: 'w0' }))
const ctx = { window: { DRAFT_DATA: { hq: fake('hq', 60), mcu: fake('mcu', 40), works: { w0: { t: 'Obra', y: 2020, k: 'filme', i: 0 } } } } }
vm.createContext(ctx)
vm.runInContext(readFileSync(new URL('../site/js/engine.js', import.meta.url), 'utf8'), ctx)
const E = ctx.window.Engine

let games = 0
for (const mode of ['hq', 'mcu', 'both']) {
  for (const size of [4, 8, 12, 20]) {
    for (const money of [size / 2, 20, 57]) {
      for (let run = 0; run < 150; run++) {
        const g = E.newGame({ mode, money, size })
        assert.equal(g.lots.length, size)
        const keys = g.lots.map((r) => E.lotOf(r).key)
        assert.equal(new Set(keys).size, size, 'personagem repetido no draft')
        if (mode === 'both') assert.equal(g.lots.filter((r) => r.startsWith('mcu')).length, size / 2)
        while (!E.done(g)) {
          if (E.forcedTo(g) >= 0) { E.sellRest(g); break }
          const op = E.opener(g)
          assert.equal(op, g.cur % 2, 'a vez de abrir alterna')
          assert.equal(E.nextBid(g, 1 - op, 1), null, 'só quem tem a vez abre')
          assert.equal(E.sell(g), null, 'sem lance não vende')
          const first = E.nextBid(g, op, [1, 2, 5, 'max'][Math.floor(Math.random() * 4)])
          assert.ok(first !== null)
          E.bid(g, op, first)
          for (let k = 0; k < 6; k++) {
            const p = Math.random() < 0.5 ? 0 : 1
            if (Math.random() < 0.3) {
              const lo = E.minBid(g, p), hi = E.maxBid(g, p)
              const v = lo + Math.floor(Math.random() * (hi - lo + 1))
              if (E.validBid(g, p, v)) E.bid(g, p, v)
              continue
            }
            const v = E.nextBid(g, p, [1, 2, 5, 'max'][Math.floor(Math.random() * 4)])
            if (v !== null) {
              assert.ok(v > g.bid && v <= g.money[p])
              E.bid(g, p, v)
            }
          }
          assert.ok(E.sell(g))
          E.advance(g)
          for (const p of [0, 1]) {
            assert.ok(g.money[p] >= 0, 'dinheiro negativo')
            assert.ok(g.teams[p].length <= g.team)
          }
        }
        for (const p of [0, 1]) {
          assert.equal(g.teams[p].length, size / 2, 'time incompleto')
          assert.ok(g.money[p] >= 0)
          const t = E.teamStats(g, p)
          assert.equal(t.spent + t.left, money)
        }
        games++
      }
    }
  }
}
console.log(`ok · ${games} leilões simulados`)
