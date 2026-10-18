import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import ts from 'typescript'

const files = []
const originalFetch = globalThis.fetch
async function compile(source, name) {
  const file = new URL(`../.vendor-test-${process.pid}-${name}.mjs`, import.meta.url)
  const output = ts.transpileModule(await readFile(new URL(source, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
  })
  await writeFile(file, output.outputText)
  files.push(file)
  return import(file.href)
}

try {
  const { attributeInputs, buildAttributes } = await compile('../src/productAttributes.ts', 'attributes')
  const category = { attributes: [
    { key: 'brand', label: 'Brand', type: 'string', required: true, options: [] },
    { key: 'ramGb', label: 'RAM', type: 'number', required: true, options: [] },
    { key: 'smart', label: 'Smart', type: 'boolean', required: false, options: [] },
    { key: 'sizes', label: 'Sizes', type: 'stringArray', required: true, options: ['S', 'M'] },
    { key: 'tags', label: 'Tags', type: 'stringArray', required: false, options: [] },
  ] }
  const saved = { brand: 'Example', ramGb: 8, smart: false, sizes: ['M'] }
  const inputs = attributeInputs(saved)
  assert.deepEqual(inputs, { brand: 'Example', ramGb: '8', smart: 'false', sizes: ['M'] })
  inputs.sizes.push('S')
  assert.deepEqual(saved.sizes, ['M']) // Editing a field never mutates the saved product.
  const valid = { ...attributeInputs(saved), tags: 'cotton, summer' }
  assert.deepEqual(buildAttributes(category, valid), {
    attributes: { ...saved, tags: ['cotton', 'summer'] }, errors: {},
  })
  assert.equal(buildAttributes(category, { ...valid, ramGb: '0' }).attributes.ramGb, 0)
  assert.equal(buildAttributes(category, { ...valid, smart: '' }).attributes.smart, undefined)
  assert.ok(buildAttributes(category, { ...valid, ramGb: '' }).errors.ramGb)
  assert.ok(buildAttributes(category, { ...valid, ramGb: 'banana' }).errors.ramGb)
  assert.ok(buildAttributes(category, { ...valid, ramGb: 'Infinity' }).errors.ramGb)
  assert.ok(buildAttributes(category, { ...valid, sizes: [] }).errors.sizes)
  assert.ok(buildAttributes(category, { ...valid, sizes: ['XL'] }).errors.sizes)
  assert.ok(buildAttributes(category, { ...valid, tags: 'cotton, cotton' }).errors.tags)
  assert.ok(buildAttributes(category, { ...valid, tags: 'cotton,,summer' }).errors.tags)
  const television = { attributes: [{ key: 'resolution', label: 'Resolution', type: 'string', required: true, options: ['HD', '4K'] }] }
  assert.ok(buildAttributes(television, { resolution: '8K' }).errors.resolution)
  assert.deepEqual(buildAttributes(television, { resolution: '4K', ramGb: '8' }).attributes, { resolution: '4K' })

  const { listCategories } = await compile('../src/categoryApi.ts', 'category-api')
  const { saveVendorProduct } = await compile('../src/vendorApi.ts', 'vendor-api')
  let requested
  globalThis.fetch = async (path, options) => {
    requested = { path, options }
    return Response.json(path === '/api/categories' ? { categories: [] } : { product: saved })
  }
  const controller = new AbortController()
  assert.deepEqual(await listCategories(controller.signal), { categories: [] })
  assert.equal(requested.path, '/api/categories')
  assert.equal(requested.options.signal, controller.signal)
  await saveVendorProduct(undefined, { category: 'mobiles', attributes: saved })
  assert.equal(requested.options.method, 'POST')
  assert.equal(requested.options.credentials, 'include')
  assert.deepEqual(JSON.parse(requested.options.body).attributes, saved)
  await saveVendorProduct('product-id', { category: 'mobiles', attributes: saved })
  assert.equal(requested.path, '/api/vendor/products/product-id')
  assert.equal(requested.options.method, 'PUT')
  globalThis.fetch = async () => Response.json({ message: 'RAM is required.' }, { status: 400 })
  await assert.rejects(saveVendorProduct(undefined, {}), /RAM is required/)
  await assert.rejects(listCategories(controller.signal), /RAM is required/)
  console.log('PASS: edit values, numeric/boolean types, required fields, choices, array validation, category separation, API payloads, cancellation signals and server errors')
} finally {
  globalThis.fetch = originalFetch
  await Promise.all(files.map(file => unlink(file)))
}
