var bencode = require('bencode')
var BlockStream = require('block-stream')
var calcPieceLength = require('piece-length')
var corePath = require('path')
var crypto = require('crypto')
var flatten = require('lodash.flatten')
var fs = require('fs')
var inherits = require('inherits')
var MultiStream = require('multistream')
var once = require('once')
var parallel = require('run-parallel')
var stream = require('stream')

var DEFAULT_ANNOUNCE_LIST = [
  ['udp://tracker.publicbt.com:80/announce'],
  ['udp://tracker.openbittorrent.com:80/announce']
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
  var pieces = []

  var streams = files.map(function (file) {
    return fs.createReadStream(file.path)
  })

  ;(new MultiStream(streams))
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
module.exports = function createTorrent (path, opts, cb) {
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
    } else {
      files = flatten(files)
    }

    var length = files.reduce(sumLength, 0)
    var pieceLength = opts.pieceLength || calcPieceLength(length)
    torrent.info['piece length'] = pieceLength

    if (singleFile) {
      torrent.info.length = length
    }

    getPieceList(files, pieceLength, function (err, pieces) {
      torrent.info.pieces = Buffer.concat(pieces)

      if (!singleFile) {
        files.forEach(function (file) {
          file.path = file.path.replace(dirName, '').split(corePath.sep)
        })
        torrent.info.files = files
      }

      cb(null, bencode.encode(torrent))
    })
  })
}

function sumLength (sum, file) {
  return sum + file.length
}
