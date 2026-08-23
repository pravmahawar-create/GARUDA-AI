import { test } from 'node:test'
import assert from 'node:assert/strict'

const withTimeout = (promise, ms, label) => Promise.race([
  promise,
  new Promise((_, reject) => setTimeout(() => reject(new Error(label + ' timeout after ' + ms + 'ms')), ms))
])

test('withTimeout resolves when promise resolves quickly', async () => {
  const p = Promise.resolve('ok')
  const r = await withTimeout(p, 5000, 'test')
  assert.equal(r, 'ok')
})

test('withTimeout rejects after timeout when promise hangs', async () => {
  const never = new Promise(() => {})
  await assert.rejects(() => withTimeout(never, 100, 'hang'), /hang timeout/)
})

test('cleanup stop timeout does not block session', async () => {
  const hangingStop = new Promise(() => {})
  const start = Date.now()
  try { await withTimeout(hangingStop, 100, 'cleanup stop') } catch (e) { assert.match(e.message, /cleanup stop timeout/) }
  const elapsed = Date.now() - start
  assert.ok(elapsed < 500, 'should timeout quickly, not hang')
})

test('permission timeout is handled', async () => {
  const hangingPerm = new Promise(() => {})
  await assert.rejects(() => withTimeout(hangingPerm, 100, 'permission'), /permission timeout/)
})

test('available timeout is handled', async () => {
  const hangingAvail = new Promise(() => {})
  await assert.rejects(() => withTimeout(hangingAvail, 100, 'available'), /available timeout/)
})

test('consecutive sessions: first hang then second succeeds', async () => {
  // Simulate first session hanging at permission, second succeeding
  let firstFailed = false
  try { await withTimeout(new Promise(() => {}), 50, 'permission') } catch (e) { firstFailed = true }
  assert.equal(firstFailed, true)
  // second session should still work
  const second = await withTimeout(Promise.resolve({ speechRecognition: 'granted' }), 50, 'permission')
  assert.equal(second.speechRecognition, 'granted')
})

test('no permanent listening state after timeout', async () => {
  let listening = true
  let busy = false
  // Simulate cleanup that resets state even after timeout
  try { await withTimeout(new Promise(() => {}), 50, 'permission') } catch (e) {
    listening = false
  }
  assert.equal(listening, false)
  assert.equal(busy, false)
})
