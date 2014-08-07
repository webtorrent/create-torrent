# create-torrent [![travis](https://img.shields.io/travis/feross/create-torrent.svg)](https://travis-ci.org/feross/create-torrent) [![npm](https://img.shields.io/npm/v/create-torrent.svg)](https://npmjs.org/package/create-torrent) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

#### Create .torrent files

[![browser support](https://ci.testling.com/feross/create-torrent.png)](https://ci.testling.com/feross/create-torrent)

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
- Array of `File` objects

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
- udp://tracker.webtorrent.io:80

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
