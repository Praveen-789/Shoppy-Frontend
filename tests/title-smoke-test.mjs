import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { pathToFileURL } from 'node:url'
import path from 'node:path'
import ts from 'typescript'

// Checks the tab-title helper and that every page sets its own title, so a new page cannot
// quietly fall back to the static title in index.html.
const root = process.cwd()
const filename = path.join(root, `.test-${randomUUID()}-title.mjs`)
try {
  const source = await readFile(path.join(root, 'src/useDocumentTitle.ts'), 'utf8')
  const result = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } })
  await writeFile(filename, result.outputText)
  const { formatDocumentTitle, SITE_NAME } = await import(pathToFileURL(filename).href)

  assert.equal(formatDocumentTitle('Your cart'), 'Your cart | Shoppy')
  assert.equal(formatDocumentTitle('  Sign in  '), 'Sign in | Shoppy', 'surrounding spaces are trimmed')
  assert.equal(formatDocumentTitle(''), SITE_NAME, 'an empty title falls back to the site name')
  assert.equal(formatDocumentTitle('   '), SITE_NAME)

  const pages = ['Login', 'Products', 'ProductDetails', 'Cart', 'Wishlist', 'Checkout', 'Orders', 'VendorDashboard', 'VendorOrders', 'VendorSales']
  for (const page of pages) {
    const component = await readFile(path.join(root, `src/components/${page}.tsx`), 'utf8')
    assert.ok(component.includes('useDocumentTitle('), `${page} should call useDocumentTitle`)
  }
  const app = await readFile(path.join(root, 'src/App.tsx'), 'utf8')
  assert.ok(app.includes("useDocumentTitle('Page not found')"), 'the not-found route sets a title too')
  const index = await readFile(path.join(root, 'index.html'), 'utf8')
  assert.ok(index.includes(`<title>${SITE_NAME}</title>`), 'index.html keeps the plain site name as the fallback')
  console.log('Document title tests passed')
} finally {
  await unlink(filename).catch(() => {})
}
