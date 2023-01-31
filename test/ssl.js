import parseTorrent from 'parse-torrent'
import test from 'tape'
import createTorrent from '../index.js'

test('create ssl cert torrent', t => {
  t.plan(2)

  const sslCert = new Uint8Array(Buffer.from('content cert X.509'))

  createTorrent(Buffer.from('abc'), {
    name: 'abc.txt',
    sslCert
  }, async (err, torrent) => {
    t.error(err)
    const parsedTorrent = await parseTorrent(torrent)
    t.deepEqual(parsedTorrent.info['ssl-cert'], sslCert)
  })
})
