"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _ejson = _interopRequireDefault(require("ejson"));
var _Data = _interopRequireDefault(require("./Data"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var stringify = function stringify(value) {
  if (value === undefined) {
    return 'undefined';
  }
  return _ejson.default.stringify(value);
};
var parse = function parse(serialized) {
  if (serialized === undefined || serialized === 'undefined') {
    return undefined;
  }
  return _ejson.default.parse(serialized);
};
class ReactiveDict {
  constructor(dictName) {
    this.keys = {};
    if (typeof dictName === 'object') {
      for (var i of Object.keys(dictName)) {
        this.keys[i] = stringify(dictName[i]);
      }
    }
  }
  set(keyOrObject, value) {
    if (typeof keyOrObject === 'object' && value === undefined) {
      this._setObject(keyOrObject);
      return;
    }
    // the input isn't an object, so it must be a key
    // and we resume with the rest of the function
    var key = keyOrObject;
    value = stringify(value);
    var oldSerializedValue = 'undefined';
    if (Object.keys(this.keys).indexOf(key) !== -1) {
      oldSerializedValue = this.keys[key];
    }
    if (value === oldSerializedValue) return;
    this.keys[key] = value;
    _Data.default.notify('change');
  }
  setDefault(key, value) {
    // for now, explicitly check for undefined, since there is no
    // ReactiveDict.clear().  Later we might have a ReactiveDict.clear(), in which case
    // we should check if it has the key.
    if (this.keys[key] === undefined) {
      this.set(key, value);
    }
  }
  get(key) {
    return parse(this.keys[key]);
  }
  equals(key, value) {
    // We don't allow objects (or arrays that might include objects) for
    // .equals, because JSON.stringify doesn't canonicalize object key
    // order. (We can make equals have the right return value by parsing the
    // current value and using EJSON.equals, but we won't have a canonical
    // element of keyValueDeps[key] to store the dependency.) You can still use
    // "EJSON.equals(reactiveDict.get(key), value)".
    //
    // XXX we could allow arrays as long as we recursively check that there
    // are no objects
    if (typeof value !== 'string' && typeof value !== 'number' && typeof value !== 'boolean' && typeof value !== 'undefined' && !(value instanceof Date) && !(ObjectID && value instanceof ObjectID) && value !== null) throw new Error('ReactiveDict.equals: value must be scalar');
    var oldValue = undefined;
    if (Object.keys(this.keys).indexOf(key) !== -1) {
      oldValue = parse(this.keys[key]);
    }
    return _ejson.default.equals(oldValue, value);
  }
  _setObject(object) {
    var keys = Object.keys(object);
    for (var i in keys) {
      this.set(i, keys[i]);
    }
  }
}
exports.default = ReactiveDict;