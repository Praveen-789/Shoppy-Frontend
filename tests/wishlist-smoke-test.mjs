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
  const { module: { useWishlistStore } } = await compile('src/stores/wishlistStore.ts', 'cart')
  const a = 'aaaaaaaaaaaaaaaaaaaaaaaa'
  const b = 'bbbbbbbbbbbbbbbbbbbbbbbb'
  const product = { _id: 'cccccccccccccccccccccccc', name: 'Test mug', price: 99.5, image: '', stock: 2, vendor: { _id: b, name: 'Vendor' } }
  const originalFetch = globalThis.fetch
  const state = () => useWishlistStore.getState()
  const reply = (userId, items = [], ok = true) => ({ ok, json: async () => ({ userId, items, message: 'Stock limit' }) })
  try {
    globalThis.fetch = async () => reply(a)
    state().setSession(a)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.deepEqual(state().wishlists[a], [])
    globalThis.fetch = async (url, options) => {
      assert.equal(url, '/api/wishlist/items')
      assert.deepEqual(JSON.parse(options.body), { productId: product._id })
      return reply(a, [{ ...product, wishlistItemId: 'row', available: true }])
    }
    assert.equal(await state().addItem(a, product), true)
    globalThis.fetch = async () => reply(a, [], false)
    assert.equal(await state().addItem(a, product), false)
    assert.equal(state().wishlists[a][0]._id, product._id)
    assert.equal(state().error, 'Stock limit')
    let finishRead;
    globalThis.fetch = () => new Promise(resolve => { finishRead = resolve });
    const reading = state().loadWishlist(a);
    globalThis.fetch = async () => reply(a, []);
    assert.equal(await state().removeItem(a, 'row'), true);
    finishRead(reply(a, [product]));
    await reading;
    assert.deepEqual(state().wishlists[a], []);
    let finish
    globalThis.fetch = () => new Promise(resolve => { finish = resolve })
    const pending = state().removeItem(a, 'row')
    assert.equal(await state().addItem(a, product), false)
    state().setSession(null)
    finish(reply(a, [{ ...product, available: true }]))
    await pending
    assert.deepEqual(state().wishlists, {})
    globalThis.fetch = async () => reply(b)
    state().setSession(b)
    await new Promise(resolve => setTimeout(resolve, 0))
    assert.equal(state().wishlists[a], undefined)
    assert.deepEqual(state().wishlists[b], [])
    assert.equal(await state().addItem(a, product), false)
    globalThis.fetch = async () => reply(a, [{ ...product, available: true }])
    assert.equal(await state().loadWishlist(b), false)
    assert.deepEqual(state().wishlists[b], [])
    assert.equal(storage.size, 0)
    console.log('PASS: server-backed wishlist, failed writes, session isolation, stale responses, concurrent actions and no local persistence')
  } finally { globalThis.fetch = originalFetch }
} finally {
  await Promise.all(generated.map(filename => unlink(filename)))
  delete globalThis.localStorage
}


