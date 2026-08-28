import { test, before, after } from 'node:test'
import assert from 'node:assert/strict'
import 'fake-indexeddb/auto'
import { db, getCompanies, getActiveCompany, seedDefaults, defaultCompany, getVehicles, saveVehicle, deleteVehicle, findVehicle, convertToItemUnit, bagWeightFor } from '../db.js'

before(async () => {
  try { await db.delete() } catch (e) {}
  await db.open()
})

after(async () => {
  try { await db.close() } catch (e) {}
})

test('VEHICLES: save, list, find and delete', async () => {
  await db.vehicles.clear()
  const v = await saveVehicle({ number: 'MP20AB1234', type: 'Chhota Hathi', capacity: 1500, unit: 'kg' })
  assert.equal(v.number, 'MP20AB1234')
  assert.equal((await getVehicles()).length, 1)
  const found = await findVehicle('mp20ab1234')
  assert.ok(found && found.number === 'MP20AB1234', 'find by number is case-insensitive')
  assert.equal(await findVehicle('XX11ZZ0000'), null)
  await deleteVehicle(v.id)
  assert.equal((await getVehicles()).length, 0)
})

test('CONVERT: 50 ton cement = 1000 bag (1 bag = 50 kg)', () => {
  const cement = { unit: 'bag', category: 'cement', bagWeight: 50 }
  const r = convertToItemUnit(cement, 50, 'ton')
  assert.deepEqual(r, { qty: 1000, unit: 'bag' })
  assert.equal(bagWeightFor(cement), 50)
})

test('CONVERT: 500 kg cement = 10 bag', () => {
  const cement = { unit: 'bag', category: 'cement' }
  const r = convertToItemUnit(cement, 500, 'kg')
  assert.deepEqual(r, { qty: 10, unit: 'bag' })
})

test('CONVERT: no conversion when item unit is not bag', () => {
  const steel = { unit: 'kg', category: 'steel' }
  assert.equal(convertToItemUnit(steel, 50, 'ton'), null)
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
