const { join } = require('path')
const folderPath = require('webtorrent-fixtures').folder.contentPath
const parseTorrent = require('parse-torrent')
const sha1 = require('simple-sha1')
const test = require('tape')

const createTorrent = require('../')

test('verify info-hash without no source set (default)', t => {
  t.plan(12)

  createTorrent(folderPath, {
    pieceLength: 262144, // matching mktorrent
    announce: 'http://private.tracker.org/',
    private: true
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'folder')

    t.equal(parsedTorrent.info.source, undefined, 'info.source not defined')

    t.ok(parsedTorrent.private, 'private=true')

    t.deepEqual(parsedTorrent.announce, ['http://private.tracker.org/'], 'single private announce url')

    t.deepEquals(parsedTorrent.files[0].path, join('folder', 'file.txt'), 'check one and only file')
    t.deepEquals(parsedTorrent.files[0].length, 15, 'file length')

    t.equal(parsedTorrent.length, 15, 'total length = file length')
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 262144)

    t.deepEquals(parsedTorrent.pieces, ['799c11e348d39f1704022b8354502e2f81f3c037'])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'b4dfce1f956f720c928535ded617d07696a819ef', 'mktorrent hash with no source')
  })
})

test('verify info-hash an additional source attribute set on the info dict (a way to allow private cross seeding of the same content)', t => {
  t.plan(12)

  createTorrent(folderPath, {
    pieceLength: 262144, // matching mktorrent
    announce: 'http://private.tracker.org/',
    private: true,
    info: { source: 'SOURCE' } // Set custom 'info source' attribute, this should result in a different info-hash
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'folder')

    t.ok(parsedTorrent.private, 'private=true')

    // Source is now being read as a Buffer,
    // if 'parse-torrent' is updated this test will still pass
    t.equal(parsedTorrent.info.source.toString(), 'SOURCE', 'info.source=\'SOURCE\'')

    t.deepEqual(parsedTorrent.announce, ['http://private.tracker.org/'], 'single private announce url')

    t.deepEquals(parsedTorrent.files[0].path, join('folder', 'file.txt'), 'check one and only file')
    t.deepEquals(parsedTorrent.files[0].length, 15, 'file length')

    t.equal(parsedTorrent.length, 15, 'total length = file length')
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 262144)

    t.deepEquals(parsedTorrent.pieces, ['799c11e348d39f1704022b8354502e2f81f3c037'])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'a9499b56289356a3d5b8636387deb83709b8fa42', 'mktorrent run with -s SOURCE')
  })
})
