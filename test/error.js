var createTorrent = require('../')
var test = require('tape')

test('error handling', function (t) {
  t.plan(5)

  t.throws(function () {
    createTorrent(null, function () {})
  })

  t.throws(function () {
    createTorrent(undefined, function () {})
  })

  t.throws(function () {
    createTorrent([null], function () {})
  })

  t.throws(function () {
    createTorrent([undefined], function () {})
  })

  t.throws(function () {
    createTorrent([null, undefined], function () {})
  })
})
