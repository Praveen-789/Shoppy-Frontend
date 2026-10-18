import assert from 'node:assert/strict'
import { readFile, writeFile, unlink } from 'node:fs/promises'

import ts from 'typescript'
import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'

const files = []
async function compile(source, name) {
  const file = new URL(`../.orders-test-${process.pid}-${name}.mjs`, import.meta.url)
  const output = ts.transpileModule(await readFile(new URL(source, import.meta.url), 'utf8'), {
    compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX },
  })
  await writeFile(file, output.outputText)
  files.push(file)
  return import(file.href)
}
try {
  const { canCancelOrder, canCancelItem, payableAmount, nextFulfilmentStatus, paymentLabel, statusLabel } = await compile('../src/orderTypes.ts', 'types')
  const order = { status: 'placed', paymentStatus: 'pending', vendorOrders: [
    { status: 'placed', paymentStatus: 'pending' }, { status: 'placed', paymentStatus: 'pending' },
  ] }
  assert.equal(canCancelOrder(order), true)
  assert.equal(canCancelOrder({ ...order, status: 'cancelled' }), false)
  assert.equal(canCancelOrder({ ...order, paymentStatus: 'collected' }), false)
  assert.equal(canCancelOrder({ ...order, vendorOrders: [order.vendorOrders[0], { status: 'confirmed', paymentStatus: 'pending' }] }), false)
  assert.equal(nextFulfilmentStatus('cancelled'), undefined)
  assert.equal(nextFulfilmentStatus('delivered'), undefined)
  assert.equal(nextFulfilmentStatus('placed'), 'confirmed')
  assert.equal(nextFulfilmentStatus('out_for_delivery'), 'delivered')
  assert.equal(paymentLabel('not_required'), 'No payment due')
  assert.equal(paymentLabel('pending'), 'Payment pending')
  assert.equal(statusLabel('cancelled'), 'Cancelled')
  const { default: Confirmation } = await compile('../src/components/OrderCancellation.tsx', 'confirmation')
  const markup = renderToStaticMarkup(React.createElement(Confirmation, { orderId: 'test', onSaved() {}, onClose() {} }))
  assert.match(markup, /all remaining items from every seller/)
  assert.match(markup, /No payment will be due/)
  assert.match(markup, /Keep order/)
  assert.match(markup, /Yes, cancel entire order/)
  const item = { product: 'mug', vendor: 'a', name: 'Mug', quantity: 3, unitPricePaise: 10000 }
  const partial = { ...order, status: 'processing', vendorOrders: [
    { vendor: 'a', status: 'placed', paymentStatus: 'pending' },
    { vendor: 'b', status: 'confirmed', paymentStatus: 'pending' },
  ] }
  assert.equal(canCancelItem(partial, item), true)
  assert.equal(canCancelItem(partial, { ...item, vendor: 'b' }), false)
  assert.equal(canCancelItem(partial, { ...item, status: 'cancelled' }), false)
  assert.equal(canCancelItem({ ...partial, status: 'cancelled' }, item), false)
  assert.equal(canCancelOrder(partial), false)
  assert.equal(canCancelOrder({ ...order, vendorOrders: [order.vendorOrders[0], { status: 'cancelled', paymentStatus: 'not_required' }] }), true)
  assert.equal(payableAmount({ status: 'placed', totalPaise: 10000, payablePaise: 4000 }), 4000)
  assert.equal(payableAmount({ status: 'placed', subtotalPaise: 10000 }), 10000)
  assert.equal(payableAmount({ status: 'cancelled', subtotalPaise: 10000 }), 0)
  assert.equal(payableAmount({ status: 'placed', subtotalPaise: 10000, payablePaise: 0 }), 0)
  const itemMarkup = renderToStaticMarkup(React.createElement(Confirmation, { orderId: 'test', item, onSaved() {}, onClose() {} }))
  assert.match(itemMarkup, /all 3 purchased units of Mug/)
  assert.match(itemMarkup, /Other active products remain/)
  assert.match(itemMarkup, /Keep product/)
  assert.match(itemMarkup, /Yes, cancel product/)
  assert.doesNotMatch(itemMarkup, /No payment will be due/)
  console.log('PASS: cancellation eligibility, terminal vendor states, payment labels and confirmation content')
} finally {
  await Promise.all(files.map(file => unlink(file)))
}

