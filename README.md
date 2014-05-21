# create-torrent [![travis](https://img.shields.io/travis/feross/create-torrent.svg)](https://travis-ci.org/feross/create-torrent) [![npm](https://img.shields.io/npm/v/create-torrent.svg)](https://npmjs.org/package/create-torrent) [![gittip](https://img.shields.io/gittip/feross.svg)](https://www.gittip.com/feross/)

#### Create .torrent files

![creation](https://raw.githubusercontent.com/feross/create-torrent/master/img.jpg)

This module is used by [WebTorrent](http://webtorrent.io).

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

### api

#### `createTorrent(path, [opts], function callback (err, torrent) {})`

Create a new `.torrent` file.

`path` is the path to the file or folder to use.

`opts` is optional and allows you to set special settings for the .torrent.

``` js
{
  comment: '',        // free-form textual comments of the author (string)
  createdBy: '',      // name and version of the program used to create the .torrent (string)
  private: false,     // is this a private .torrent? (boolean or integer)
  pieceLength: 32768  // force a custom piece length (number of bytes)
  announceList: [[]]  // custom trackers to use (array of arrays of strings) (see [bep12](http://www.bittorrent.org/beps/bep_0012.html))
}
```

`callback` is called with an error and a Buffer of the torrent data. It is up to you to
save it to a file if that's what you want to do.

### license

MIT. Copyright (c) [Feross Aboukhadijeh](http://feross.org).
