module.exports = createTorrent

var bencode = require('bencode')
var BlockStream = require('block-stream')
var calcPieceLength = require('piece-length')
var corePath = require('path')
var FileReadStream = require('filestream/read')
var flatten = require('flatten')
var fs = require('fs')
var MultiStream = require('multistream')
var once = require('once')
var parallel = require('run-parallel')
var sha1 = require('git-sha1')
var stream = require('stream')

/**
 * Create a torrent.
 * @param  {string|File|FileList|Blob|Buffer|Array.<File|Blob|Buffer>} input
 * @param  {Object} opts
 * @param  {string=} opts.name
 * @param  {Date=} opts.creationDate
 * @param  {string=} opts.comment
 * @param  {string=} opts.createdBy
 * @param  {boolean|number=} opts.private
 * @param  {number=} opts.pieceLength
 * @param  {Array.<Array.<string>>=} opts.announceList
 * @param  {Array.<string>=} opts.urlList
 * @param  {function} cb
 * @return {Buffer} buffer of .torrent file data
 */
function createTorrent (input, opts, cb) {
  if (typeof opts === 'function') {
    cb = opts
    opts = {}
  }
  var files

  // TODO: support an array of paths

  if (typeof FileList === 'function' && input instanceof FileList)
    input = Array.prototype.slice.call(input)

  if (isBlob(input) || Buffer.isBuffer(input))
    input = [ input ]

  if (Array.isArray(input) && input.length > 0) {
    opts.name = opts.name || input[0].name
    files = input.map(function (item) {
      if (!item) return
      var file = {
        length: item.size || item.length,
        path: [ item.name || 'no-name' ]
      }
      if (isBlob(item)) file.getStream = getBlobStream(item)
      else if (Buffer.isBuffer(item)) file.getStream = getBufferStream(item)
      else throw new Error('Array must contain only File objects')
      return file
    })
    onFiles(files, opts, cb)
  } else if (typeof input === 'string') {
    opts.name = opts.name || corePath.basename(input)

    traversePath(getFileInfo, input, function (err, files) {
      if (err) return cb(err)

      if (Array.isArray(files)) {
        files = flatten(files)
      } else {
        files = [ files ]
      }

      var dirName = corePath.normalize(input) + corePath.sep
      files.forEach(function (file) {
        file.getStream = getFSStream(file.path)
        file.path = file.path.replace(dirName, '').split(corePath.sep)
      })

      onFiles(files, opts, cb)
    })
  } else {
    throw new Error('invalid input type')
  }
}

function getBlobStream(data) {
  return function() {
    return new FileReadStream(data)
  }
}

function getBufferStream(data) {
  return function() {
    var s = new stream.PassThrough()
    s.end(data)
    return s
  }
}

function getFSStream(data) {
  return function() {
    return fs.createReadStream(data)
  }
}

createTorrent.announceList = [
  [ 'udp://tracker.publicbt.com:80' ],
  [ 'udp://tracker.openbittorrent.com:80' ],
  [ 'udp://tracker.webtorrent.io:80' ],
  [ 'wss://tracker.webtorrent.io' ] // For WebRTC peers (see: WebTorrent.io)
]

function each (arr, fn, cb) {
  var tasks = arr.map(function (item) {
    return function (cb) {
      fn(item, cb)
    }
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
  var pieces = '' // hex string

  var streams = files.map(function (file) {
    return file.getStream
  })

  new MultiStream(streams)
    .pipe(new BlockStream(pieceLength, { nopad: true }))
    .on('data', function (chunk) {
      pieces += sha1(chunk)
    })
    .on('end', function () {
      cb(null, new Buffer(pieces, 'hex'))
    })
    .on('error', cb)
}

function onFiles (files, opts, cb) {
  var announceList = opts.announceList !== undefined
    ? opts.announceList
    : createTorrent.announceList // default

  var torrent = {
    info: {
      name: opts.name
    },
    announce: announceList[0][0],
    'announce-list': announceList,
    'creation date': Number(opts.creationDate) || Date.now(),
    encoding: 'UTF-8'
  }

  if (opts.comment !== undefined) {
    torrent.info.comment = opts.comment
  }

  if (opts.createdBy !== undefined) {
    torrent.info['created by'] = opts.createdBy
  }

  if (opts.private !== undefined) {
    torrent.info.private = Number(opts.private)
  }

  if (opts.urlList !== undefined) {
    torrent['url-list'] = opts.urlList
  }

  var singleFile = files.length === 1

  var length = files.reduce(sumLength, 0)
  var pieceLength = opts.pieceLength || calcPieceLength(length)
  torrent.info['piece length'] = pieceLength

  if (singleFile) {
    torrent.info.length = length
  }

  getPieceList(files, pieceLength, function (err, pieces) {
    if (err) return cb(err)
    torrent.info.pieces = pieces

    files.forEach(function (file) {
      delete file.getStream
    })

    if (!singleFile) {
      torrent.info.files = files
    }

    cb(null, bencode.encode(torrent))
  })
}

/**
 * Accumulator to sum file lengths
 * @param  {number} sum
 * @param  {Object} file
 * @return {number}
 */
function sumLength (sum, file) {
  return sum + file.length
}

/**
 * Check if `obj` is a W3C Blob object (which is the superclass of W3C File)
 * @param  {*} obj
 * @return {boolean}
 */
function isBlob (obj) {
  return typeof Blob !== 'undefined' && obj instanceof Blob
}
