const corePath = require('path')
const fs = require('fs')
const junk = require('junk')
const once = require('once')
const parallel = require('run-parallel')

// TODO: When Node 10 support is dropped, replace this with Array.prototype.flat
function flat (arr1) {
  return arr1.reduce(
    (acc, val) => Array.isArray(val)
      ? acc.concat(flat(val))
      : acc.concat(val),
    []
  )
}

function notHidden (file) {
  return file[0] !== '.'
}

function traversePath (path, fn, cb) {
  fs.stat(path, (err, stats) => {
    if (err) return cb(err)
    if (stats.isDirectory()) {
      fs.readdir(path, (err, entries) => {
        if (err) return cb(err)
        parallel(entries.filter(notHidden).filter(junk.not).map(entry => cb => {
          traversePath(corePath.join(path, entry), fn, cb)
        }), cb)
      })
    } else if (stats.isFile()) {
      fn(path, cb)
    }
    // Ignore other types (not a file or directory)
  })
}

/**
 * Convert a file path to a lazy readable stream.
 * @param  {string} path
 * @return {function}
 */
function getFilePathStream (path) {
  return () => fs.createReadStream(path)
}

function getFiles (path, keepRoot, cb) {
  traversePath(path, getFileInfo, (err, files) => {
    if (err) return cb(err)

    if (Array.isArray(files)) files = flat(files)
    else files = [files]

    path = corePath.normalize(path)
    if (keepRoot) {
      path = path.slice(0, path.lastIndexOf(corePath.sep) + 1)
    }
    if (path[path.length - 1] !== corePath.sep) path += corePath.sep

    files.forEach(file => {
      file.getStream = getFilePathStream(file.path)
      file.path = file.path.replace(path, '').split(corePath.sep)
    })

    cb(null, files)
  })
}

function getFileInfo (path, cb) {
  cb = once(cb)
  fs.stat(path, (err, stat) => {
    if (err) return cb(err)
    const info = {
      length: stat.size,
      path
    }
    cb(null, info)
  })
}

module.exports = getFiles
