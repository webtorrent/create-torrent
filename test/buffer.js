import createTorrent from '../index.js'
import parseTorrent from 'parse-torrent'
import path from 'path'
import { hash } from 'uint8-util'
import test from 'tape'

test('create nested torrent with array of buffers', t => {
  t.plan(14)

  const buf1 = Buffer.from('bl')
  buf1.name = 'dir1/buf1.txt'

  const buf2 = Buffer.from('ah')
  buf2.name = 'dir2/buf2.txt'

  const startTime = Date.now()
  createTorrent([buf1, buf2], {
    name: 'multi'
  }, async (err, torrent) => {
    t.error(err)

    const parsedTorrent = await parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'multi')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('multi/dir1/buf1.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('multi/dir2/buf2.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.equal(parsedTorrent.length, 4)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 16384)

    t.deepEquals(parsedTorrent.pieces, [
      '5bf1fd927dfb8679496a2e6cf00cbe50c1c87145'
    ])
    hash(parsedTorrent.infoBuffer, 'hex').then(hash => {
      t.equals(hash, '8fa3c08e640db9576156b21f31353402456a0208')
    })
  })
})
