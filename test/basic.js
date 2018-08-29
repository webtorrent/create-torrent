const parseTorrent = require('parse-torrent')
const path = require('path')
const test = require('tape')
const createTorrent = require('../')

test('implicit torrent name and file name', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')

  createTorrent(buf1, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.ok(parsedTorrent.name.includes('Unnamed Torrent'))

    t.equal(parsedTorrent.files.length, 1)
    t.ok(parsedTorrent.files[0].name.includes('Unnamed Torrent'))
    t.ok(parsedTorrent.files[0].path.includes('Unnamed Torrent'))
  })
})

test('implicit file name from torrent name', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')

  createTorrent(buf1, { name: 'My Cool File' }, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit torrent name from file name', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File'

  createTorrent(buf1, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit file names from torrent name', t => {
  t.plan(7)

  const buf1 = Buffer.from('buf1')
  const buf2 = Buffer.from('buf2')

  createTorrent([buf1, buf2], { name: 'My Cool File' }, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 2)

    t.ok(parsedTorrent.files[0].name.includes('Unknown File'))
    t.ok(parsedTorrent.files[0].path.includes('Unknown File'))

    t.ok(parsedTorrent.files[1].name.includes('Unknown File'))
    t.ok(parsedTorrent.files[1].path.includes('Unknown File'))
  })
})

test('set file name with `name` property', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File'

  createTorrent(buf1, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('set file names with `name` property', t => {
  t.plan(7)

  const buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool File 1'

  const buf2 = Buffer.from('buf2')
  buf2.name = 'My Cool File 2'

  createTorrent([buf1, buf2], { name: 'My Cool Torrent' }, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Torrent')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Torrent', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Torrent', 'My Cool File 2'))
  })
})

test('set file name with `fullPath` property', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')
  buf1.fullPath = 'My Cool File'

  createTorrent(buf1, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('set file names with `fullPath` property', t => {
  t.plan(7)

  const buf1 = Buffer.from('buf1')
  buf1.fullPath = 'My Cool File 1'

  const buf2 = Buffer.from('buf2')
  buf2.fullPath = 'My Cool File 2'

  createTorrent([buf1, buf2], { name: 'My Cool Torrent' }, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Torrent')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Torrent', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Torrent', 'My Cool File 2'))
  })
})

test('implicit torrent name from file name with slashes in it', t => {
  t.plan(5)

  const buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool Folder/My Cool File'

  createTorrent(buf1, (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool File')

    t.equal(parsedTorrent.files.length, 1)
    t.equal(parsedTorrent.files[0].name, 'My Cool File')
    t.equal(parsedTorrent.files[0].path, 'My Cool File')
  })
})

test('implicit torrent name from file names with slashes in them', t => {
  t.plan(7)

  const buf1 = Buffer.from('buf1')
  buf1.name = 'My Cool Folder/My Cool File 1'

  const buf2 = Buffer.from('buf2')
  buf2.name = 'My Cool Folder/My Cool File 2'

  createTorrent([buf1, buf2], (err, torrent) => {
    t.error(err)
    const parsedTorrent = parseTorrent(torrent)

    t.equal(parsedTorrent.name, 'My Cool Folder')

    t.equal(parsedTorrent.files.length, 2)

    t.equal(parsedTorrent.files[0].name, 'My Cool File 1')
    t.equal(parsedTorrent.files[0].path, path.join('My Cool Folder', 'My Cool File 1'))

    t.equal(parsedTorrent.files[1].name, 'My Cool File 2')
    t.equal(parsedTorrent.files[1].path, path.join('My Cool Folder', 'My Cool File 2'))
  })
})
