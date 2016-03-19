var createTorrent = require('../')
var parseTorrent = require('parse-torrent')
var test = require('tape')

test('create ssl cert torrent', function (t) {
  t.plan(2)

  var sslCert = new Buffer('content cert X.509')

  createTorrent(new Buffer('abc'), {
    name: 'abc.txt',
    sslCert: sslCert
  }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)
    t.deepEqual(parsedTorrent.info['ssl-cert'], sslCert)
  })
})
