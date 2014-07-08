#!/usr/bin/env node
var createTorrent = require('../')
var fs = require('fs')
var minimist = require('minimist')

var argv = minimist(process.argv.slice(2), {
  alias: {
    o: 'outfile',
    h: 'help'
  }
})

var infile = argv._[0]
var outfile = argv.outfile

if (!infile || argv.help) {
  console.log('usage: create-torrent <directory OR file> {-o outfile.torrent}')
  console.log('')
  console.log('Create a torrent file from a directory or file.')
  console.log('')
  console.log('If an output file isn\'t specified with `-o`, the torrent file will be ')
  console.log('written to stdout.')
  console.log('')
  process.exit(0)
}

createTorrent(infile, function (err, torrent) {
  if (err) {
    console.error(err.stack)
    process.exit(1)
  } else if (outfile) {
    fs.writeFile(outfile, torrent, function (err) {
      if (err) {
        console.error(err.stack)
        process.exit(1)
      }
    })
  } else {
    process.stdout.write(torrent)
  }
})
