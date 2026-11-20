import fs from 'fs'
import { createHash } from 'crypto'

const BATCH_SIZE = 4 * 1024 * 1024

/**
 * Hash the pieces of files read straight from the filesystem (node only).
 *
 * Pieces are read in batches of about 4 MiB with positional reads into reusable
 * buffers, then hashed with node's crypto while the next batch is already being
 * read. A piece can span several files, and the last piece is shorter than
 * `pieceLength`.
 *
 * @param  {Array.<{filePath: string, length: number}>} files
 * @param  {number} pieceLength
 * @param  {function=} onProgress called with (hashedLength, totalLength)
 * @return {Promise.<Uint8Array>} concatenated SHA-1 hashes of the pieces
 */
export default async function hashFiles (files, pieceLength, onProgress) {
  const totalLength = files.reduce((sum, file) => sum + file.length, 0)
  const numPieces = Math.ceil(totalLength / pieceLength)
  const pieces = Buffer.alloc(numPieces * 20)
  const batchLength = Math.min(pieceLength * Math.max(1, Math.floor(BATCH_SIZE / pieceLength)), totalLength)
  const buffers = [Buffer.allocUnsafe(batchLength), Buffer.allocUnsafe(batchLength)]
  const reader = new FilesReader(files)

  let readLength = 0
  let batchIndex = 0
  const readBatch = () => {
    const length = Math.min(batchLength, totalLength - readLength)
    readLength += length
    return reader.read(buffers[batchIndex++ % 2], length)
  }

  let next = totalLength > 0 ? readBatch() : null
  let pieceIndex = 0
  let hashedLength = 0
  try {
    while (next) {
      const batch = await next
      // read the next batch while this one is hashed
      next = readLength < totalLength ? readBatch() : null
      for (let offset = 0; offset < batch.length; offset += pieceLength) {
        const piece = batch.subarray(offset, offset + pieceLength)
        createHash('sha1').update(piece).digest().copy(pieces, pieceIndex++ * 20)
        hashedLength += piece.length
        if (onProgress) onProgress(hashedLength, totalLength)
      }
    }
  } finally {
    // wait for a pending read before closing its file
    if (next) await next.catch(() => {})
    await reader.close()
  }
  return pieces
}

/**
 * Read a list of files as one contiguous sequence of bytes, keeping at most
 * one file open at a time.
 */
class FilesReader {
  constructor (files) {
    this.files = files
    this.index = 0
    this.position = 0
    this.handle = null
  }

  /**
   * Read the next `length` bytes into `buffer`.
   * @param  {Buffer} buffer
   * @param  {number} length
   * @return {Promise.<Buffer>}
   */
  async read (buffer, length) {
    let offset = 0
    while (offset < length) {
      const file = this.files[this.index]
      if (this.position === file.length) {
        await this.close()
        this.index += 1
        this.position = 0
        continue
      }
      if (!this.handle) this.handle = await fs.promises.open(file.filePath, 'r')
      const toRead = Math.min(length - offset, file.length - this.position)
      const { bytesRead } = await this.handle.read(buffer, offset, toRead, this.position)
      if (bytesRead === 0) {
        throw new Error(`file changed while creating torrent: ${file.filePath}`)
      }
      offset += bytesRead
      this.position += bytesRead
    }
    return buffer.subarray(0, length)
  }

  async close () {
    if (!this.handle) return
    const handle = this.handle
    this.handle = null
    await handle.close()
  }
}
