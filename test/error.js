import test from 'tape'
import createTorrent from '../index.js'

test('error handling', t => {
  t.plan(5)

  t.throws(() => createTorrent(null, () => {}))
  t.throws(() => createTorrent(undefined, () => {}))
  t.throws(() => createTorrent([null], () => {}))
  t.throws(() => createTorrent([undefined], () => {}))
  t.throws(() => createTorrent([null, undefined], () => {}))
})
