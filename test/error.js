const test = require('tape')
const createTorrent = require('../')

test('error handling', t => {
  t.plan(5)

  t.throws(() => createTorrent(null, () => {}))
  t.throws(() => createTorrent(undefined, () => {}))
  t.throws(() => createTorrent([null], () => {}))
  t.throws(() => createTorrent([undefined], () => {}))
  t.throws(() => createTorrent([null, undefined], () => {}))
})
