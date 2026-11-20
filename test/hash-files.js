import fs from 'fs'
import os from 'os'
import parseTorrent from 'parse-torrent'
import path from 'path'
import test from 'tape'
import createTorrent from '../index.js'
import hashFiles from '../hash-files.js'

const opts = { creationDate: 1, announceList: [], private: false }

function content (length, seed) {
  const buf = Buffer.alloc(length)
  for (let i = 0; i < length; i++) buf[i] = (i * 31 + seed) & 0xff
  return buf
}

// Write `files` ({ name: length }) to a new temporary directory
function makeDir (t, files) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'create-torrent-'))
  t.teardown(() => fs.rmSync(dir, { recursive: true, force: true }))
  Object.keys(files).forEach((name, i) => {
    fs.mkdirSync(path.dirname(path.join(dir, name)), { recursive: true })
    fs.writeFileSync(path.join(dir, name), content(files[name], i))
  })
  return dir
}

function create (input, opts) {
  return new Promise((resolve, reject) => {
    createTorrent(input, opts, (err, torrent) => err ? reject(err) : resolve(torrent))
  })
}

// Same files, as readable streams, to go through the stream based hashing
async function createFromStreams (dir, torrent) {
  const parsed = await parseTorrent(torrent)
  const input = parsed.files.map(file => {
    const stream = fs.createReadStream(path.join(path.dirname(dir), file.path))
    stream.name = file.path.split(path.sep).join('/')
    return stream
  })
  return create(input.length === 1 ? input[0] : input, Object.assign({ name: parsed.name, pieceLength: parsed.pieceLength }, opts))
}

const cases = [
  { name: 'pieces spanning several files', pieceLength: 16384, files: { 'a.bin': 20000, 'b.bin': 5000, 'c.bin': 30000, 'sub/d.bin': 70000 } },
  { name: 'empty files', pieceLength: 16384, files: { 'a.bin': 0, 'b.bin': 40000, 'c.bin': 0, 'd.bin': 16384, 'e.bin': 0 } },
  { name: 'piece longer than all files', pieceLength: 262144, files: { 'a.bin': 1000, 'b.bin': 2000 } },
  { name: 'several batches of small pieces', pieceLength: 16384, files: { 'a.bin': 6 * 1024 * 1024 + 123, 'b.bin': 3 * 1024 * 1024 + 7 } },
  { name: 'pieces larger than a batch', pieceLength: 8 * 1024 * 1024, files: { 'a.bin': 5 * 1024 * 1024, 'b.bin': 7 * 1024 * 1024 + 5 } }
]

cases.forEach(c => {
  test(`fs hashing matches stream hashing: ${c.name}`, async t => {
    const dir = makeDir(t, c.files)
    const torrent = await create(dir, Object.assign({ pieceLength: c.pieceLength }, opts))
    const expected = await createFromStreams(dir, torrent)
    t.ok(Buffer.from(torrent).equals(Buffer.from(expected)), 'same .torrent bytes')
  })
})

test('fs hashing matches stream hashing: single file', async t => {
  const dir = makeDir(t, { 'single.bin': 100000 })
  const file = path.join(dir, 'single.bin')
  const torrent = await create(file, Object.assign({ pieceLength: 16384 }, opts))
  const expected = await create(fs.readFileSync(file), Object.assign({ name: 'single.bin', pieceLength: 16384 }, opts))
  t.ok(Buffer.from(torrent).equals(Buffer.from(expected)), 'same .torrent bytes')
})

test('fs hashing of empty files only', async t => {
  const dir = makeDir(t, { 'a.bin': 0, 'b.bin': 0 })
  const torrent = await create(dir, opts)
  const parsed = await parseTorrent(torrent)
  t.equal(parsed.length, 0)
  t.deepEqual(parsed.pieces, [])
  t.deepEqual(parsed.files.map(file => file.length), [0, 0])
})

test('fs hashing reports progress for every piece', async t => {
  const dir = makeDir(t, { 'a.bin': 50000, 'b.bin': 30000 })
  const calls = []
  const torrent = await create(dir, Object.assign({
    pieceLength: 16384,
    onProgress: (hashed, total) => calls.push([hashed, total])
  }, opts))
  const parsed = await parseTorrent(torrent)
  t.equal(calls.length, parsed.pieces.length)
  t.deepEqual(calls[0], [16384, 80000])
  t.deepEqual(calls[calls.length - 1], [80000, 80000])
})

test('fs hashing does not leak the file path into the torrent', async t => {
  const dir = makeDir(t, { 'a.bin': 100, 'b.bin': 200 })
  const parsed = await parseTorrent(await create(dir, opts))
  t.deepEqual(Object.keys(parsed.info.files[0]).sort(), ['length', 'path'])
})

test('fs hashing fails when a file is shorter than expected', async t => {
  const dir = makeDir(t, { 'a.bin': 100 })
  const filePath = path.join(dir, 'a.bin')
  try {
    await hashFiles([{ filePath, length: 200 }], 16384)
    t.fail('should have failed')
  } catch (err) {
    t.ok(err.message.includes(filePath), err.message)
  }
})
