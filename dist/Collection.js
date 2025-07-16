"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.runObservers = exports.localCollections = exports.Collection = void 0;
var _Tracker = _interopRequireDefault(require("./Tracker"));
var _ejson = _interopRequireDefault(require("ejson"));
var _lodash = require("lodash");
var _Data = _interopRequireDefault(require("./Data"));
var _Random = _interopRequireDefault(require("./lib/Random"));
var _Call = _interopRequireDefault(require("./Call"));
var _utils = require("./lib/utils.js");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var observers = {};
var runObservers = (type, collection, newDocument, oldDocument) => {
  if (observers[collection]) {
    observers[collection].forEach(_ref => {
      var {
        cursor,
        callbacks
      } = _ref;
      if (callbacks[type]) {
        if (type === 'removed') {
          callbacks['removed'](newDocument);
        } else if (_Data.default.db[collection].findOne({
          $and: [{
            _id: newDocument._id
          }, cursor._selector]
        })) {
          try {
            callbacks[type](newDocument, oldDocument);
          } catch (e) {
            console.error('Error in observe callback', e);
          }
        }
      }
    });
  }
};
exports.runObservers = runObservers;
var _registerObserver = (collection, cursor, callbacks) => {
  observers[collection] = observers[collection] || [];
  observers[collection].push({
    cursor,
    callbacks
  });
};
class Cursor {
  constructor(collection, docs, selector) {
    this._docs = docs || [];
    this._collection = collection;
    this._selector = selector;
  }
  count() {
    return this._docs.length;
  }
  fetch() {
    return this._transformedDocs();
  }
  forEach(callback) {
    this._transformedDocs().forEach(callback);
  }
  map(callback) {
    return this._transformedDocs().map(callback);
  }
  _transformedDocs() {
    return this._collection._transform ? this._docs.map(this._collection._transform) : this._docs;
  }
  observe(callbacks) {
    _registerObserver(this._collection._collection.name, this, callbacks);
  }
}
var localCollections = [];
exports.localCollections = localCollections;
class Collection {
  constructor(name) {
    var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
    if (name === null) {
      this.localCollection = true;
      name = _Random.default.id();
      localCollections.push(name);
    }
    if (!_Data.default.db[name]) {
      _Data.default.db.addCollection(name);
    }
    this._collection = _Data.default.db[name];
    this._name = name;
    this._transform = wrapTransform(options.transform);
  }
  find(selector, options) {
    var result;
    var docs;
    if (typeof selector === 'string') {
      if (options) {
        docs = this._collection.findOne({
          _id: selector
        }, options);
      } else {
        docs = this._collection.get(selector);
      }
      if (docs) {
        docs = [docs];
      }
    } else {
      docs = this._collection.find(selector, options);
    }
    result = new Cursor(this, docs, selector);
    return result;
  }
  findOne(selector, options) {
    var result = this.find(selector, options);
    if (result) {
      result = result.fetch()[0];
    }
    return result;
  }
  insert(item) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : () => {};
    var id;
    if ('_id' in item) {
      if (!item._id || typeof item._id !== 'string') {
        return callback('Meteor requires document _id fields to be non-empty strings');
      }
      id = item._id;
    } else {
      id = item._id = _Random.default.id();
    }
    if (this._collection.get(id)) {
      return callback({
        error: 409,
        reason: "Duplicate key _id with value ".concat(id)
      });
    }
    this._collection.upsert(item);
    if (!this.localCollection) {
      _Data.default.waitDdpConnected(() => {
        (0, _Call.default)("/".concat(this._name, "/insert"), item, err => {
          if (err) {
            this._collection.del(id);
            return callback(err);
          }
          callback(null, id);
        });
      });
    }
    return id;
  }
  update(id, modifier) {
    var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
    var callback = arguments.length > 3 && arguments[3] !== undefined ? arguments[3] : () => {};
    if (typeof options === 'function') {
      callback = options;
    }
    if (!this._collection.get(id)) {
      return callback({
        error: 409,
        reason: "Item not found in collection ".concat(this._name, " with id ").concat(id)
      });
    }

    // change mini mongo for optimize UI changes
    this._collection.upsert(_objectSpread({
      _id: id
    }, modifier.$set));
    if (!this.localCollection) {
      _Data.default.waitDdpConnected(() => {
        (0, _Call.default)("/".concat(this._name, "/update"), {
          _id: id
        }, modifier, err => {
          if (err) {
            return callback(err);
          }
          callback(null, id);
        });
      });
    }
  }
  remove(id) {
    var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : () => {};
    var element = this.findOne(id);
    if (element) {
      this._collection.del(element._id);
      if (!this.localCollection) {
        _Data.default.waitDdpConnected(() => {
          (0, _Call.default)("/".concat(this._name, "/remove"), {
            _id: id
          }, (err, res) => {
            if (err) {
              this._collection.upsert(element);
              return callback(err);
            }
            callback(null, res);
          });
        });
      }
    } else {
      callback("No document with _id : ".concat(id));
    }
  }
  helpers(helpers) {
    var _transform;
    if (this._transform && !this._helpers) {
      _transform = this._transform;
    }
    if (!this._helpers) {
      this._helpers = function Document(doc) {
        return (0, _lodash.extend)(this, doc);
      };
      this._transform = doc => {
        if (_transform) {
          doc = _transform(doc);
        }
        return new this._helpers(doc);
      };
    }
    (0, _lodash.forEach)(helpers, (helper, key) => {
      this._helpers.prototype[key] = helper;
    });
  }
}

// From Meteor core

// Wrap a transform function to return objects that have the _id field
// of the untransformed document. This ensures that subsystems such as
// the observe-sequence package that call `observe` can keep track of
// the documents identities.
//
// - Require that it returns objects
// - If the return value has an _id field, verify that it matches the
//   original _id field
// - If the return value doesn't have an _id field, add it back.
exports.Collection = Collection;
function wrapTransform(transform) {
  if (!transform) {
    return null;
  }

  // No need to doubly-wrap transforms.
  if (transform.__wrappedTransform__) {
    return transform;
  }
  var wrapped = function wrapped(doc) {
    if (!(0, _lodash.has)(doc, '_id')) {
      // XXX do we ever have a transform on the oplog's collection? because that
      // collection has no _id.
      throw new Error('can only transform documents with _id');
    }
    var id = doc._id;
    // XXX consider making tracker a weak dependency and checking Package.tracker here
    var transformed = _Tracker.default.nonreactive(function () {
      return transform(doc);
    });
    if (!(0, _utils.isPlainObject)(transformed)) {
      throw new Error('transform must return object');
    }
    if ((0, _lodash.has)(transformed, '_id')) {
      if (!_ejson.default.equals(transformed._id, id)) {
        throw new Error("transformed document can't have different _id");
      }
    } else {
      transformed._id = id;
    }
    return transformed;
  };
  wrapped.__wrappedTransform__ = true;
  return wrapped;
}