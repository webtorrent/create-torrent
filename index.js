var BlockStream = require('block-stream')
var bncode = require('bncode')
var calcPieceLength = require('piece-length')
var corePath = require('path')
var crypto = require('crypto')
var fs = require('fs')
var inherits = require('inherits')
var once = require('once')
var parallel = require('run-parallel')
var stream = require('stream')

inherits(MultiFileStream, stream.Readable)

function MultiFileStream (paths, opts) {
  stream.Readable.call(this, opts)

  this._paths = paths
  this._currentPath = -1

  if (paths.length === 0) {
    this._stream = null
    this.push(null)
  } else {
    this._nextStream()
  }
}

MultiFileStream.prototype._read = function () {}

MultiFileStream.prototype._nextStream = function () {
  this._currentPath += 1

  if (this._currentPath === this._paths.length) {
    this._stream = null
    this.push(null)
    return
  }

  this._stream = fs.createReadStream(this._paths[this._currentPath])

  var self = this
  this._stream.on('readable', function () {
    while (chunk = self._stream.read()) {
      self.push(chunk)
    }
  })
  this._stream.on('end', function () {
    self._stream.removeAllListeners()
    self._nextStream()
  })
  this._stream.on('error', function (err) {
    self.emit('error', err)
  })
}

var DEFAULT_ANNOUNCE_LIST = [
  ['udp://tracker.publicbt.com:80/announce'],
  ['udp://tracker.openbittorrent.com:80/announce']
]

function each (arr, fn, cb) {
  var tasks = arr.map(function (item) {
    return fn.bind(undefined, item)
  })
  parallel(tasks, cb)
}

function getFileInfo (path, cb) {
  cb = once(cb)
  fs.stat(path, function (err, stat) {
    if (err) return cb(err)
    var info = {
      length: stat.size,
      path: path
    }
    cb(null, info)
  })
}

function traversePath (fn, path, cb) {
  fs.readdir(path, function (err, entries) {
    if (err && err.code === 'ENOTDIR') {
      // this is a file
      fn(path, cb)
    } else if (err) {
      // there was an error
      cb(err)
    } else {
      // this is a folder
      each(entries, function (entry, cb) {
        traversePath(fn, corePath.join(path, entry), cb)
      }, cb)
    }
  })
}

function getPieceList (files, pieceLength, cb) {
  cb = once(cb)
  var pieces = []

  var paths = files.map(function (file) { return file.path })

  ;(new MultiFileStream(paths))
    .pipe(new BlockStream(pieceLength, { nopad: true }))
    .on('data', function (chunk) {
      pieces.push(crypto.createHash('sha1').update(chunk).digest())
    })
    .on('end', function () {
      cb(null, pieces)
    })
    .on('error', function (err) {
      cb(err)
    })
}

/**
 * Create a torrent.
 * @param  {string} path
 * @param  {Object} opts
 * @param  {string=} opts.comment
 * @param  {string=} opts.createdBy
 * @param  {boolean|number=} opts.private
 * @param  {number=} opts.pieceLength
 * @param  {Array.<Array.<string>>=} opts.announceList
 * @param  {function} cb
 * @return {Buffer} buffer of .torrent file data
 */
module.exports = function (path, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }

  var announceList = (opts.announceList !== undefined)
    ? opts.announceList
    : DEFAULT_ANNOUNCE_LIST

  var torrent = {
    info: {
      name: corePath.basename(path)
    },
    announce: announceList[0][0],
    'announce-list': announceList,
    'creation date': Date.now(),
    encoding: 'UTF-8'
  }

  var dirName = corePath.normalize(path) + corePath.sep

  if (opts.comment !== undefined) {
    torrent.info.comment = comment
  }

  if (opts.createdBy !== undefined) {
    torrent.info['created by'] = opts.createdBy
  }

  if (opts.private !== undefined) {
    torrent.info.private = Number(opts.private)
  }

  traversePath(getFileInfo, path, function (err, files) {
    if (err) return cb(err)

    var singleFile = !Array.isArray(files)

    if (singleFile) {
      files = [ files ]
    }

    var length = files.reduce(sumLength, 0)

    if (singleFile) {
      torrent.info.length = length
    }

    var pieceLength = opts.pieceLength || calcPieceLength(length)

    torrent.info['piece length'] = pieceLength

    getPieceList(files, pieceLength, function (err, pieces) {
      torrent.info.pieces = Buffer.concat(pieces)

      if (!singleFile) {
        files.forEach(function (file) {
          file.path = file.path.replace(dirName, '').split(corePath.sep)
        })
        torrent.info.files = files
      }

      cb(null, bncode.encode(torrent))
    })
  })
}

function sumLength (sum, file) {
  return sum + file.length
}
