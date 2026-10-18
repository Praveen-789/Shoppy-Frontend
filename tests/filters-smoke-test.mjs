import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import ts from 'typescript'

const temporary = new URL(`../.filters-test-${process.pid}.mjs`, import.meta.url)
try {
  const source = await readFile(new URL('../src/productFilters.ts', import.meta.url), 'utf8')
  await writeFile(temporary, ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText)
  const { emptyProductFilters, productSearchParams, priceRangeError, activeFilterCount } = await import(temporary.href)
  const query = { ...emptyProductFilters(), search: 'Nova & blue', category: 'mobiles', page: 1 }
  assert.deepEqual([...productSearchParams(query)], [['page', '1'], ['limit', '12'], ['search', 'Nova & blue'], ['category', 'mobiles']])
  const selected = { ...query, minPrice: '0', maxPrice: '20000', attributes: { brand: ['Nova', 'Orbit'], smartTv: ['false'], ramGb: ['0', '8'] } }
  const params = productSearchParams(selected)
  assert.deepEqual(params.getAll('attr.brand'), ['Nova', 'Orbit'])
  assert.equal(params.get('attr.smartTv'), 'false')
  assert.deepEqual(params.getAll('attr.ramGb'), ['0', '8'])
  assert.equal(params.get('minPrice'), '0')
  assert.equal(activeFilterCount(selected), 6)
  const nextPage = productSearchParams({ ...selected, page: 2 })
  assert.deepEqual(nextPage.getAll('attr.brand'), ['Nova', 'Orbit'])
  assert.equal(nextPage.get('maxPrice'), '20000')
  assert.equal(nextPage.get('page'), '2')
  const reset = { ...selected, ...emptyProductFilters(), page: 1 }
  assert.equal(activeFilterCount(reset), 0)
  assert.equal(productSearchParams(reset).has('attr.brand'), false)
  assert.equal(reset.search, query.search)
  assert.equal(reset.category, 'mobiles')
  for (const [min, max] of [['', ''], ['0', '0'], ['999.50', '1000'], ['', '10000000']]) assert.equal(priceRangeError(min, max), '')
  for (const [min, max] of [['100', '99'], ['-1', ''], ['1.001', ''], ['1e3', ''], ['', '10000001'], ['abc', '']]) assert.ok(priceRangeError(min, max))
  console.log('Filter checks passed: repeated attributes, false/zero values, price validation, pagination and reset.')
} finally {
  await unlink(temporary).catch(() => {})
}
