import fixtures from 'webtorrent-fixtures'
import fs from 'fs'
import parseTorrent from 'parse-torrent'
import path from 'path'
import { hash } from 'uint8-util'
import test from 'tape'
import createTorrent from '../index.js'

test('create single file torrent from a stream', t => {
  t.plan(11)

  const stream = fs.createReadStream(fixtures.leaves.contentPath)
  stream.name = 'Leaves of Grass by Walt Whitman.epub'

  const startTime = Date.now()
  createTorrent(stream, { pieceLength: 16384 }, async (err, torrent) => {
    t.error(err)

    const parsedTorrent = await parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'Leaves of Grass by Walt Whitman.epub')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.equals(path.normalize(parsedTorrent.files[0].path), path.normalize('Leaves of Grass by Walt Whitman.epub'))
    t.equals(parsedTorrent.files[0].length, 362017)

    t.equal(parsedTorrent.length, 362017)
    t.equal(parsedTorrent.pieceLength, 16384)

    t.deepEquals(parsedTorrent.pieces, [
      '1f9c3f59beec079715ec53324bde8569e4a0b4eb',
      'ec42307d4ce5557b5d3964c5ef55d354cf4a6ecc',
      '7bf1bcaf79d11fa5e0be06593c8faafc0c2ba2cf',
      '76d71c5b01526b23007f9e9929beafc5151e6511',
      '0931a1b44c21bf1e68b9138f90495e690dbc55f5',
      '72e4c2944cbacf26e6b3ae8a7229d88aafa05f61',
      'eaae6abf3f07cb6db9677cc6aded4dd3985e4586',
      '27567fa7639f065f71b18954304aca6366729e0b',
      '4773d77ae80caa96a524804dfe4b9bd3deaef999',
      'c9dd51027467519d5eb2561ae2cc01467de5f643',
      '0a60bcba24797692efa8770d23df0a830d91cb35',
      'b3407a88baa0590dc8c9aa6a120f274367dcd867',
      'e88e8338c572a06e3c801b29f519df532b3e76f6',
      '70cf6aee53107f3d39378483f69cf80fa568b1ea',
      'c53b506159e988d8bc16922d125d77d803d652c3',
      'ca3070c16eed9172ab506d20e522ea3f1ab674b3',
      'f923d76fe8f44ff32e372c3b376564c6fb5f0dbe',
      '52164f03629fd1322636babb2c014b7dae582da4',
      '1363965261e6ce12b43701f0a8c9ed1520a70eba',
      '004400a267765f6d3dd5c7beb5bd3c75f3df2a54',
      '560a61801147fa4ec7cf568e703acb04e5610a4d',
      '56dcc242d03293e9446cf5e457d8eb3d9588fd90',
      'c698de9b0dad92980906c026d8c1408fa08fe4ec'
    ])
    hash(parsedTorrent.infoBuffer, 'hex').then(hash => {
      t.equals(hash, 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
    })
  })
})

test('create multi file torrent with streams', t => {
  t.plan(16)

  const files = fs.readdirSync(fixtures.numbers.contentPath).map(file => {
    const stream = fs.createReadStream(`${fixtures.numbers.contentPath}/${file}`)
    stream.name = file
    return stream
  })

  const startTime = Date.now()
  createTorrent(files, {
    // force piece length to 32KB so info-hash will
    // match what transmission generated, since we use
    // a different algo for picking piece length
    pieceLength: 32768,

    private: false, // also force `private: false` to match transmission

    name: 'numbers'

  }, async (err, torrent) => {
    t.error(err)

    const parsedTorrent = await parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'numbers')

    t.notOk(parsedTorrent.private)

    t.ok(parsedTorrent.created.getTime() >= startTime, 'created time is after start time')

    t.ok(Array.isArray(parsedTorrent.announce))

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('numbers/1.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 1)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('numbers/2.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[2].path), path.normalize('numbers/3.txt'))
    t.deepEquals(parsedTorrent.files[2].length, 3)

    t.equal(parsedTorrent.length, 6)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '1f74648e50a6a6708ec54ab327a163d5536b7ced'
    ])
    hash(parsedTorrent.infoBuffer, 'hex').then(hash => {
      t.equals(hash, '80562f38656b385ea78959010e51a2cc9db41ea0')
    })
  })
})

test('implicit name and pieceLength for stream', t => {
  t.plan(6)

  const stream = fs.createReadStream(fixtures.leaves.contentPath)

  createTorrent(stream, async (err, torrent) => {
    t.error(err)
    const parsedTorrent = await parseTorrent(torrent)

    t.ok(parsedTorrent.name.includes('Unnamed Torrent'))
    t.equal(parsedTorrent.pieceLength, 16384)

    t.equal(parsedTorrent.files.length, 1)
    t.ok(parsedTorrent.files[0].name.includes('Unnamed Torrent'))
    t.ok(parsedTorrent.files[0].path.includes('Unnamed Torrent'))
  })
})
