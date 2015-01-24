var createTorrent = require('../../')
var fs = require('fs')
var parseTorrent = require('parse-torrent')
var sha1 = require('simple-sha1')
var test = require('tape')

function makeFileShim (buf, name) {
  var file = new Blob([ buf ])
  file.name = name
  return file
}

var leaves = makeFileShim(fs.readFileSync(__dirname + '/../content/Leaves of Grass by Walt Whitman.epub'), 'Leaves of Grass by Walt Whitman.epub')

// HACK: Using utf8 explicitly here workaround a node 0.10.29 bug with base64.
// Apparrently if you call fs.createReadStream(file, { encoding: 'base64' }) on a
// very short file (1 or 2 chars), then no data is ever emitted.

var numbers1 = makeFileShim(fs.readFileSync(__dirname + '/../content/numbers/1.txt', 'utf8'), '1.txt')
var numbers2 = makeFileShim(fs.readFileSync(__dirname + '/../content/numbers/2.txt', 'utf8'), '2.txt')
var numbers3 = makeFileShim(fs.readFileSync(__dirname + '/../content/numbers/3.txt', 'utf8'), '3.txt')

test('create single file torrent', function (t) {
  t.plan(12)

  var startTime = Date.now()
  createTorrent(leaves, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'Leaves of Grass by Walt Whitman.epub')

    t.notOk(parsedTorrent.private)

    var createdTime = parsedTorrent.created / 1000
    t.ok(createdTime >= startTime, 'created time is after start time')
    t.ok(createdTime <= Date.now(), 'created time is before now')

    t.deepEquals(parsedTorrent.announceList, [
      ['udp://tracker.publicbt.com:80'],
      ['udp://tracker.openbittorrent.com:80'],
      ['udp://open.demonii.com:1337'],
      ['udp://tracker.webtorrent.io:80'],
      ['wss://tracker.webtorrent.io']
    ])

    t.equals(parsedTorrent.files[0].path, 'Leaves of Grass by Walt Whitman.epub')
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

    window.parsedTorrent = parsedTorrent
    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  })
})

test('create multi file torrent', function (t) {
  t.plan(17)

  var startTime = Date.now()
  createTorrent([ numbers1, numbers2, numbers3 ], {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false,      // also force `private: false` to match transmission
    name: 'numbers'

  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'numbers')

    t.notOk(parsedTorrent.private)

    var createdTime = parsedTorrent.created / 1000
    t.ok(createdTime >= startTime, 'created time is after start time')
    t.ok(createdTime <= Date.now(), 'created time is before now')

    t.deepEquals(parsedTorrent.announceList, [
      ['udp://tracker.publicbt.com:80'],
      ['udp://tracker.openbittorrent.com:80'],
      ['udp://open.demonii.com:1337'],
      ['udp://tracker.webtorrent.io:80'],
      ['wss://tracker.webtorrent.io']
    ])

    t.deepEquals(parsedTorrent.files[0].path, 'numbers/1.txt')
    t.deepEquals(parsedTorrent.files[0].length, 1)

    t.deepEquals(parsedTorrent.files[1].path, 'numbers/2.txt')
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(parsedTorrent.files[2].path, 'numbers/3.txt')
    t.deepEquals(parsedTorrent.files[2].length, 3)

    t.equal(parsedTorrent.length, 6)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '1f74648e50a6a6708ec54ab327a163d5536b7ced'
    ])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), '80562f38656b385ea78959010e51a2cc9db41ea0')
  })
})
