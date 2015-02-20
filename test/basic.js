var path = require('path')
var fs = require('fs')
var createTorrent = require('../')
var parseTorrent = require('parse-torrent')
var sha1 = require('simple-sha1')
var test = require('tape')

test('create single file torrent', function (t) {
  t.plan(12)

  var leavesPath = __dirname + '/content/Leaves of Grass by Walt Whitman.epub'

  var startTime = Date.now()
  createTorrent(leavesPath, function (err, torrent) {
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

    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  })
})

test('create single file torrent from buffer', function (t) {
  t.plan(1)

  createTorrent(new Buffer('blah'), { name: 'blah.txt' }, function (err, torrent) {
    t.error(err)
    try {
      parseTorrent(torrent)
    } catch (err) {
      t.fail('failed to parse created torrent: ' + err.message)
    }
  })
})

test('create multi file torrent', function (t) {
  t.plan(17)

  var numbersPath = __dirname + '/content/numbers'

  var startTime = Date.now()
  createTorrent(numbersPath, {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission

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
    t.equals(sha1.sync(parsedTorrent.infoBuffer), '80562f38656b385ea78959010e51a2cc9db41ea0')
  })
})

test('create multi file torrent with nested directories', function (t) {
  t.plan(22)

  var numbersPath = __dirname + '/content/lots-of-numbers'

  var startTime = Date.now()
  createTorrent(numbersPath, {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission

  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'lots-of-numbers')

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

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('lots-of-numbers/big numbers/10.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('lots-of-numbers/big numbers/11.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[2].path), path.normalize('lots-of-numbers/big numbers/12.txt'))
    t.deepEquals(parsedTorrent.files[2].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[3].path), path.normalize('lots-of-numbers/small numbers/1.txt'))
    t.deepEquals(parsedTorrent.files[3].length, 1)

    t.deepEquals(path.normalize(parsedTorrent.files[4].path), path.normalize('lots-of-numbers/small numbers/2.txt'))
    t.deepEquals(parsedTorrent.files[4].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[5].path), path.normalize('lots-of-numbers/small numbers/3.txt'))
    t.deepEquals(parsedTorrent.files[5].length, 3)

    t.equal(parsedTorrent.length, 12)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '47972f2befaee58b6f3860cd39bd56cb33a488f0'
    ])

    t.equals(sha1.sync(parsedTorrent.infoBuffer), '427887e9c03e123f9c8458b1947090edf1c75baa')
  })
})

test('create single file torrent from a stream', function (t) {
  t.plan(12)

  var leavesPath = __dirname + '/content/Leaves of Grass by Walt Whitman.epub'
  var stream = fs.createReadStream(leavesPath)

  stream.name = 'Leaves of Grass by Walt Whitman.epub'

  var startTime = Date.now()
  createTorrent(stream, { pieceLength: 16384 }, function (err, torrent) {
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

    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'd2474e86c95b19b8bcfdb92bc12c9d44667cfa36')
  })
})

test('create multi file torrent with streams', function (t) {
  t.plan(17)

  var numbersPath = __dirname + '/content/numbers'

  var files = fs.readdirSync(numbersPath).map(function (file) {
    var stream = fs.createReadStream(numbersPath + '/' + file)
    stream.name = file
    return stream
  })

  var startTime = Date.now()
  createTorrent(files, {
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false,     // also force `private: false` to match transmission

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
    t.equals(sha1.sync(parsedTorrent.infoBuffer), '80562f38656b385ea78959010e51a2cc9db41ea0')
  })
})

test('create multi file torrent with array of paths', function (t) {
  t.plan(21)

  var number10Path = __dirname + '/content/lots-of-numbers/big numbers/10.txt'
  var number11Path = __dirname + '/content/lots-of-numbers/big numbers/11.txt'
  var numbersPath = __dirname + '/content/numbers'

  var input = [ number10Path, number11Path, numbersPath ]

  var startTime = Date.now()
  createTorrent(input, {
    name: 'multi',
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission

  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'multi')

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

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('multi/10.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('multi/11.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[2].path), path.normalize('multi/numbers/1.txt'))
    t.deepEquals(parsedTorrent.files[2].length, 1)

    t.deepEquals(path.normalize(parsedTorrent.files[3].path), path.normalize('multi/numbers/2.txt'))
    t.deepEquals(parsedTorrent.files[3].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[4].path), path.normalize('multi/numbers/3.txt'))
    t.deepEquals(parsedTorrent.files[4].length, 3)

    t.equal(parsedTorrent.length, 10)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '1c4e1ba6da4d771ff82025d7cf76e8c368c6c3dd'
    ])
    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'df25a2959378892f6ddaf4a2d7e75174e09878bb')
  })
})

test('create multi file torrent with array of mixed types', function (t) {
  t.plan(21)

  var number11Path = __dirname + '/content/lots-of-numbers/big numbers/11.txt'
  var number10Path = __dirname + '/content/lots-of-numbers/big numbers/10.txt'
  var numbersPath = __dirname + '/content/numbers'

  var stream = fs.createReadStream(number10Path)
  stream.name = '10.txt'

  // Note: Order should be preserved
  var input = [ number11Path, stream, numbersPath ]

  var startTime = Date.now()
  createTorrent(input, {
    name: 'multi',
    pieceLength: 32768, // force piece length to 32KB so info-hash will
                        // match what transmission generated, since we use
                        // a different algo for picking piece length

    private: false      // also force `private: false` to match transmission

  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'multi')

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

    t.deepEquals(path.normalize(parsedTorrent.files[0].path), path.normalize('multi/11.txt'))
    t.deepEquals(parsedTorrent.files[0].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[1].path), path.normalize('multi/10.txt'))
    t.deepEquals(parsedTorrent.files[1].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[2].path), path.normalize('multi/numbers/1.txt'))
    t.deepEquals(parsedTorrent.files[2].length, 1)

    t.deepEquals(path.normalize(parsedTorrent.files[3].path), path.normalize('multi/numbers/2.txt'))
    t.deepEquals(parsedTorrent.files[3].length, 2)

    t.deepEquals(path.normalize(parsedTorrent.files[4].path), path.normalize('multi/numbers/3.txt'))
    t.deepEquals(parsedTorrent.files[4].length, 3)

    t.equal(parsedTorrent.length, 10)
    t.equal(parsedTorrent.info.pieces.length, 20)
    t.equal(parsedTorrent.pieceLength, 32768)

    t.deepEquals(parsedTorrent.pieces, [
      '9ad893bb9aeca601a0fab4ba85bd4a4c18b630e3'
    ])
    t.equals(sha1.sync(parsedTorrent.infoBuffer), 'bad3f8ea0d1d8a55c18a039dd464f1078f83dba2')
  })
})

test('create nested torrent with array of buffers', function (t) {
  t.plan(15)

  var buf1 = new Buffer('bl')
  buf1.name = 'dir1/buf1.txt'

  var buf2 = new Buffer('ah')
  buf2.name = 'dir2/buf2.txt'

  var startTime = Date.now()
  createTorrent([ buf1, buf2 ], {
    name: 'multi'
  }, function (err, torrent) {
    t.error(err)

    var parsedTorrent = parseTorrent(torrent)

    t.equals(parsedTorrent.name, 'multi')

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
    t.equals(sha1.sync(parsedTorrent.infoBuffer), '8fa3c08e640db9576156b21f31353402456a0208')
  })
})

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
