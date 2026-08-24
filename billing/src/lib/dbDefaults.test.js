import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db, getCompanies, getActiveCompany, seedDefaults, defaultCompany } from '../db.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

test('FRESH STATE: default company has blank identity', async () => {
  await db.companies.clear(); await db.settings.clear(); await db.items.clear()
  const comps = await getCompanies()
  assert.equal(comps.length, 1)
  assert.equal(comps[0].name, '', 'fresh company name must be blank')
  assert.equal(comps[0].category, '', 'fresh company category must be blank')
  assert.equal(comps[0].gstin, '', 'fresh company GSTIN must be blank')
  assert.ok(!comps[0].name.toLowerCase().includes('a.k'), 'no internal trading identity in fresh state')
})

test('FRESH STATE: defaultCompany() has no hardcoded identity', () => {
  const c = defaultCompany()
  assert.equal(c.name, '')
  assert.equal(c.category, '')
  assert.ok(!JSON.stringify(c).toLowerCase().includes('a.k.'))
})

test('FRESH STATE: seedDefaults does not create stock items', async () => {
  await db.items.clear()
  await seedDefaults()
  assert.equal(await db.items.count(), 0, 'fresh install must start with empty stock')
  const active = await getActiveCompany()
  assert.ok(active, 'active company must be set')
})

test('FRESH STATE: getActiveCompany returns the blank default company', async () => {
  await db.companies.clear(); await db.settings.clear()
  const active = await getActiveCompany()
  assert.ok(active)
  assert.equal(active.name, '')
})
