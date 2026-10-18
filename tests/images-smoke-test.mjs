import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const files = []
const originalFetch = globalThis.fetch
async function compile(source, name, replacements = {}) {
  const file = new URL(`../.images-test-${process.pid}-${name}.mjs`, import.meta.url)
  let output = ts.transpileModule(await readFile(new URL(source, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  }).outputText
  for (const [from, to] of Object.entries(replacements)) output = output.replaceAll(from, to)
  await writeFile(file, output)
  files.push(file)
  return import(file.href)
}

try {
  const { productImages, validateImageSelection } = await compile('../src/productImages.ts', 'images')
  const images = [{ _id: 'a', url: 'https://example.com/a.png' }, { _id: 'b', url: 'https://example.com/b.png' }]
  assert.deepEqual(productImages({ image: 'old.png' }), [{ _id: 'legacy', url: 'old.png' }])
  assert.deepEqual(productImages({ image: 'old.png', images }), images)
  assert.deepEqual(productImages({ image: '' }), [])
  const file = new File(['test'], 'front.png', { type: 'image/png' })
  assert.equal(validateImageSelection(3, [file, file]), '')
  assert.match(validateImageSelection(4, [file, file]), /up to 5/)
  assert.match(validateImageSelection(0, [new File(['test'], 'bad.svg', { type: 'image/svg+xml' })]), /JPEG/)
  assert.match(validateImageSelection(0, [new File([], 'empty.png', { type: 'image/png' })]), /JPEG/)
  assert.match(validateImageSelection(0, [new File([new Uint8Array(5 * 1024 * 1024 + 1)], 'large.png', { type: 'image/png' })]), /5 MB/)

  const { removeVendorImage, setVendorCover } = await compile('../src/vendorApi.ts', 'api')
  const { uploadPendingImages } = await compile('../src/vendorImageUploads.ts', 'upload', {
    './vendorApi': `./.images-test-${process.pid}-api.mjs`,
  })
  const pending = [
    { id: 'first-upload', file, preview: 'blob:first' },
    { id: 'second-upload', file, preview: 'blob:second' },
  ]
  let remaining = [...pending]
  const calls = []
  let saved = { _id: 'product-id', image: '', images: [] }
  let failSecond = true
  globalThis.fetch = async (path, options) => {
    calls.push({ path, options })
    const key = options.headers?.['X-Upload-Key']
    if (key === 'second-upload' && failSecond) return Response.json({ message: 'Image upload failed.' }, { status: 502 })
    if (key) saved = { ...saved, image: saved.image || `${key}.png`, images: [...saved.images, { _id: key, url: `${key}.png` }] }
    return Response.json({ product: saved })
  }
  const progress = []
  const uploaded = image => { remaining = remaining.filter(item => item.id !== image.id) }
  await assert.rejects(uploadPendingImages(saved, pending, uploaded, (index, total) => progress.push([index, total])), /Image upload failed/)
  assert.deepEqual(remaining.map(image => image.id), ['second-upload'])
  assert.equal(saved.images.length, 1)
  assert.deepEqual(progress, [[1, 2], [2, 2]])
  failSecond = false
  await uploadPendingImages(saved, remaining, uploaded, () => {})
  assert.deepEqual(remaining, [])
  assert.equal(saved.images.length, 2)
  assert.deepEqual(calls.map(call => call.options.headers['X-Upload-Key']), ['first-upload', 'second-upload', 'second-upload'])
  assert.equal(calls[0].options.body, file)
  assert.equal(calls[0].options.headers['Content-Type'], 'image/png')
  assert.equal(calls[0].options.credentials, 'include')
  assert.equal(calls[0].path, '/api/vendor/products/product-id/images')
  await removeVendorImage('product-id', 'a')
  assert.equal(calls.at(-1).options.method, 'DELETE')
  assert.equal(calls.at(-1).path, '/api/vendor/products/product-id/images/a')
  await setVendorCover('product-id', 'b')
  assert.equal(calls.at(-1).options.method, 'PATCH')
  assert.equal(calls.at(-1).path, '/api/vendor/products/product-id/images/b/cover')

  const { default: Gallery } = await compile('../src/components/ProductGallery.tsx', 'gallery', {
    '../productImages': `./.images-test-${process.pid}-images.mjs`,
  })
  const markup = renderToStaticMarkup(React.createElement(Gallery, { product: { name: 'Dress', image: images[0].url, images } }))
  assert.match(markup, /Product photos/)
  assert.match(markup, /View photo 2 of Dress/)
  assert.match(markup, /aria-pressed="true"/)
  const legacy = renderToStaticMarkup(React.createElement(Gallery, { product: { name: 'Dress', image: 'legacy.png' } }))
  assert.match(legacy, /legacy.png/)
  assert.doesNotMatch(legacy, /Product photos/)
  const empty = renderToStaticMarkup(React.createElement(Gallery, { product: { name: 'Dress', image: '' } }))
  assert.match(empty, /Image unavailable/)
  console.log('PASS: legacy galleries, file limits/types, partial upload recovery, stable retry keys, photo endpoints, accessible thumbnails and empty-image fallback')
} finally {
  globalThis.fetch = originalFetch
  await Promise.all(files.map(file => unlink(file)))
}
