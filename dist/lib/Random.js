"use strict";

var UNMISTAKABLE_CHARS = '23456789ABCDEFGHJKLMNPQRSTWXYZabcdefghijkmnopqrstuvwxyz';
module.exports = {
  id() {
    var count = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 17;
    var res = '';
    for (var i = 0; i < count; i++) {
      res += UNMISTAKABLE_CHARS[Math.floor(Math.random() * UNMISTAKABLE_CHARS.length)];
    }
    return res;
  }
};