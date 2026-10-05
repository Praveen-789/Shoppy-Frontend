import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import ts from 'typescript'
import React from 'react'
import { renderToString } from 'react-dom/server'
import { MemoryRouter, Routes, Route } from 'react-router-dom'

const root = process.cwd()
const suffix = randomUUID()
const generated = []
const storage = new Map()
globalThis.localStorage = {
  getItem: key => storage.get(key) || null,
  setItem: (key, value) => storage.set(key, value),
  removeItem: key => storage.delete(key),
}
async function compile(sourcePath, name, replacements = []) {
  let source = await readFile(path.join(root, sourcePath), 'utf8')
  for (const [before, after] of replacements) source = source.replaceAll(before, after)
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } })
  const filename = path.join(root, `.test-${suffix}-${name}.mjs`)
  await writeFile(filename, result.outputText)
  generated.push(filename)
  return { filename, module: await import(pathToFileURL(filename).href) }
}
try {
  const { module: { useCartStore } } = await compile('src/stores/cartStore.ts', 'cart')
  const a = 'aaaaaaaaaaaaaaaaaaaaaaaa'
  const b = 'bbbbbbbbbbbbbbbbbbbbbbbb'
  const product = { _id: 'cccccccccccccccccccccccc', name: 'Test mug', price: 99.5, image: '', stock: 2, vendor: { _id: b, name: 'Vendor' } }
  const originalFetch = globalThis.fetch
  const state = () => useCartStore.getState()
  const reply = (userId, items = [], ok = true) => ({ ok, json: async () => ({ userId, items, message: 'Stock limit' }) })
  try {
    globalThis.fetch = async () => reply(a)
    state().setSession(a)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(state().carts[a], [])
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/cart/items')
      assert.deepEqual(JSON.parse(options.body), { productId: product._id })
      return reply(a, [{ ...product, cartItemId: 'row', quantity: 1 }])
    }
    assert.equal(await state().addItem(a, product), true)
    globalThis.fetch = async () => reply(a, [], false)
    assert.equal(await state().addItem(a, product), false)
    assert.equal(state().carts[a][0].quantity, 1)
    assert.equal(state().error, 'Stock limit')
    // Focus starts a read, but the first minus click must still send its PATCH.
    for (const readFinishesFirst of [true, false]) {
      const item = { ...product, cartItemId: 'row', quantity: 2 }
      useCartStore.setState({ carts: { [a]: [item] } })
      let finishRead, finishWrite
      globalThis.fetch = (url, options) => new Promise(resolve => {
        if (options.method === 'GET') finishRead = resolve
        else {
          assert.equal(options.method, 'PATCH')
          assert.equal(url, '/api/cart/items/row')
          assert.deepEqual(JSON.parse(options.body), { quantity: 1 })
          finishWrite = resolve
        }
      })
      const refresh = state().loadCart(a)
      assert.equal(state().busy, false)
      assert.equal(state().refreshing, true)
      const minus = state().setQuantity(a, 'row', 1)
      assert.equal(typeof finishWrite, 'function', 'First click must send the update')
      assert.equal(state().busy, true)
      if (readFinishesFirst) {
        finishRead(reply(a, [item]))
        await refresh
        assert.equal(state().busy, true, 'An old read cannot unlock an active write')
      }
      finishWrite(reply(a, [{ ...item, quantity: 1 }]))
      assert.equal(await minus, true)
      if (!readFinishesFirst) {
        finishRead(reply(a, [item]))
        await refresh
      }
      assert.equal(state().carts[a][0].quantity, 1)
      assert.equal(state().busy, false)
      assert.equal(state().refreshing, false)
    }
    console.log('PASS: first minus click during focus refresh; stale reads cannot overwrite quantity')
    let finish
    globalThis.fetch = () => new Promise(resolve => { finish = resolve })
    const pending = state().setQuantity(a, 'row', 1)
    assert.equal(await state().addItem(a, product), false)
    state().setSession(null)
    finish(reply(a, [{ ...product, quantity: 9 }]))
    await pending
    assert.deepEqual(state().carts, {})
    globalThis.fetch = async () => reply(b)
    state().setSession(b)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(state().carts[a], undefined)
    assert.deepEqual(state().carts[b], [])
    assert.equal(await state().addItem(a, product), false)
    globalThis.fetch = async () => reply(a, [{ ...product, quantity: 9 }])
    assert.equal(await state().loadCart(b), false)
    assert.deepEqual(state().carts[b], [])
    assert.equal(storage.size, 0)
    console.log('PASS: server-backed cart, failed writes, session isolation, stale responses, concurrent actions and no local persistence')
  } finally { globalThis.fetch = originalFetch }
  const context = await compile('src/auth/AuthContext.ts', 'context')
  const hook = await compile('src/auth/useAuth.ts', 'hook', [["'./AuthContext'", `'./${path.basename(context.filename)}'`]])
  const route = await compile('src/auth/ProtectedRoute.tsx', 'route', [["'../auth/useAuth'", `'./${path.basename(hook.filename)}'`]])
  function markup(user, checkingSession, vendorOnly = false) {
    return renderToString(React.createElement(context.module.AuthContext.Provider, { value: { user, checkingSession } },
      React.createElement(MemoryRouter, { initialEntries: ['/cart'] }, React.createElement(Routes, null,
        React.createElement(Route, { element: React.createElement(route.module.default, { vendorOnly }) },
          React.createElement(Route, { path: '/cart', element: React.createElement('p', null, 'protected cart content') }))))))
  }
  assert.match(markup(null, true), /Checking your session/)
  assert.doesNotMatch(markup(null, false), /protected cart content/)
  assert.match(markup({ id: a, role: 'user' }, false), /protected cart content/)
  assert.doesNotMatch(markup({ id: a, role: 'user' }, false, true), /protected cart content/)
  assert.match(markup({ id: b, role: 'vendor' }, false, true), /protected cart content/)
  console.log('PASS: protected routes wait for sessions, require login, and restrict vendor access')
} finally {
  await Promise.all(generated.map(filename => unlink(filename)))
  delete globalThis.localStorage
}


