const parseTorrent = require('parse-torrent')
const test = require('tape')
const createTorrent = require('../')

test('create ssl cert torrent', t => {
  t.plan(2)

  const sslCert = Buffer.from('content cert X.509')

  createTorrent(Buffer.from('abc'), {
    name: 'abc.txt',
    sslCert
  }, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)
    t.deepEqual(parsedTorrent.info['ssl-cert'], sslCert)
  })
})
