# create-torrent [![travis][travis-image]][travis-url] [![npm][npm-image]][npm-url] [![downloads][downloads-image]][downloads-url]

[travis-image]: https://img.shields.io/travis/feross/create-torrent.svg?style=flat
[travis-url]: https://travis-ci.org/feross/create-torrent
[npm-image]: https://img.shields.io/npm/v/create-torrent.svg?style=flat
[npm-url]: https://npmjs.org/package/create-torrent
[downloads-image]: https://img.shields.io/npm/dm/create-torrent.svg?style=flat
[downloads-url]: https://npmjs.org/package/create-torrent

#### Create .torrent files

[![Sauce Test Status](https://saucelabs.com/browser-matrix/create-torrent.svg)](https://saucelabs.com/u/create-torrent)

![creation](https://raw.githubusercontent.com/feross/create-torrent/master/img.jpg)

This module is used by [WebTorrent](http://webtorrent.io)! This module works in node.js and the browser (with [browserify](http://browserify.org/)).

### install

```
npm install create-torrent
```

### usage

The simplest way to use `create-torrent` is like this:

```js
var createTorrent = require('create-torrent')
var fs = require('fs')

createTorrent('/path/to/folder', function (err, torrent) {
  if (!err) {
    // `torrent` is a Buffer with the contents of the new .torrent file
    fs.writeFile('my.torrent', torrent)
  }
})
```

A reasonable piece length (~1024 pieces) will automatically be selected for the .torrent
file, or you can override it if you want a different size (See API docs below).

### api

#### `createTorrent(input, [opts], function callback (err, torrent) {})`

Create a new `.torrent` file.

`input` can be any of the following:

- path to the file or folder on filesystem (string)
- W3C [File](https://developer.mozilla.org/en-US/docs/Web/API/File) object (from an `<input>` or drag and drop)
- W3C [FileList](https://developer.mozilla.org/en-US/docs/Web/API/FileList) object (basically an array of `File` objects)
- Node [Buffer](http://nodejs.org/api/buffer.html) object (works in [the browser](https://www.npmjs.org/package/buffer))
- Node [stream.Readable](http://nodejs.org/api/stream.html) object (must attach a `name` property on it (or set `opt.name`), and set `opt.pieceLength`)

Or, an **array of `string`, `File`, `Buffer`, or `stream.Readable` objects**.

`opts` is optional and allows you to set special settings on the produced .torrent file.

``` js
{
  name: String,            // name of the torrent (default = basename of `path`)
  comment: String,         // free-form textual comments of the author
  createdBy: String,       // name and version of program used to create torrent
  creationDate: Date       // creation time in UNIX epoch format (default = now)
  private: Boolean,        // is this a private .torrent? (default = false)
  pieceLength: Number      // force a custom piece length (number of bytes)
  announceList: [[String]] // custom trackers (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
  urlList: [String]        // web seed urls (see [bep19](http://www.bittorrent.org/beps/bep_0019.html))
}
```

If `announceList` is omitted, the following trackers will be included automatically:

- udp://tracker.publicbt.com:80
- udp://tracker.openbittorrent.com:80
- udp://open.demonii.com:1337
- udp://tracker.webtorrent.io:80
- wss://tracker.webtorrent.io (For WebRTC peers, see: [WebTorrent](http://webtorrent.io))

`callback` is called with an error and a Buffer of the torrent data. It is up to you to
save it to a file if that's what you want to do.

### command line

```
usage: create-torrent <directory OR file> {-o outfile.torrent}

Create a torrent file from a directory or file.

If an output file isn\'t specified with `-o`, the torrent file will be
written to stdout.
```

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
