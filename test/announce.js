const fixtures = require('webtorrent-fixtures')
const parseTorrent = require('parse-torrent')
const test = require('tape')
const createTorrent = require('../')

test('announce is added to torrent', t => {
  t.plan(4)

  createTorrent(fixtures.leaves.contentPath, {
    announce: 'wss://example1.com',
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.announce.length, 1)

    t.ok(parsedTorrent.announce.includes('wss://example1.com'))
  })
})

test('invalid announceList as string', t => {
  t.plan(3)

  createTorrent(fixtures.leaves.contentPath, {
    announceList: 'wss://example1.com'
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.announce.length, 0)
  })
})

test('announceList is a list of lists of strings', t => {
  t.plan(6)

  createTorrent(fixtures.leaves.contentPath, {
    announceList: [['wss://example1.com', 'wss://example2.com'], ['wss://example3.com']]
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.announce.length, 3)

    t.ok(parsedTorrent.announce.includes('wss://example1.com'))

    t.ok(parsedTorrent.announce.includes('wss://example2.com'))

    t.ok(parsedTorrent.announce.includes('wss://example3.com'))
  })
})

test('verify that announce and announceList can be used together', t => {
  t.plan(5)

  createTorrent(fixtures.leaves.contentPath, {
    announce: 'wss://example1.com',
    announceList: [['wss://example2.com']]
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.announce.length, 2)

    t.ok(parsedTorrent.announce.includes('wss://example1.com'))

    t.ok(parsedTorrent.announce.includes('wss://example2.com'))
  })
})

test('invalid trackers are discarded', t => {
  t.plan(5)

  createTorrent(fixtures.leaves.contentPath, {
    announce: 'wss://example1.com',
    announceList: [['wss://example2.com'], [1234, ['wss://thisisinsidealist.com']]]
  }, (err, torrent) => {
    t.error(err)

    const parsedTorrent = parseTorrent(torrent)

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(parsedTorrent.announce.length, 2)

    t.ok(parsedTorrent.announce.includes('wss://example1.com'))

    t.ok(parsedTorrent.announce.includes('wss://example2.com'))
  })
})
