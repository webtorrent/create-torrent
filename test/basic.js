var createTorrent = require('../')
var parseTorrent = require('parse-torrent')
var test = require('tape')

test('implicit torrent name and file name', function (t) {
  t.plan(4)

  var buf1 = new Buffer('buf1')

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.ok(parsedTorrent.name.indexOf('Unnamed Torrent') >= 0)

    t.equal(parsedTorrent.files.length, 1)
    t.ok(parsedTorrent.files[0].name.indexOf('Unnamed Torrent') >= 0)
  })
})

test('implicit file name from torrent name', function (t) {
  t.plan(4)

  var buf1 = new Buffer('buf1')

  createTorrent(buf1, { name: 'My Cool File' }, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
  })
})

test('implicit torrent name from file name', function (t) {
  t.plan(4)

  var buf1 = new Buffer('buf1')
  buf1.name = 'My Cool File'

  createTorrent(buf1, function (err, torrent) {
    t.error(err)
    var parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
  })
})
