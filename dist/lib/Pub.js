"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _lodash = require("lodash");
var _Meteor = _interopRequireDefault(require("../Meteor"));
var _ejson = _interopRequireDefault(require("ejson"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function paramsForSub(params) {
  if (Array.isArray(params)) {
    return params;
  }
  return typeof params === 'undefined' ? [] : [params];
}
function findExistingSubscriptionId(name, params) {
  return (0, _lodash.findKey)(_Meteor.default.getData().subscriptions, {
    name,
    params: _ejson.default.clone(paramsForSub(params))
  });
}
function info(msg) {
  console.info("Pub: ".concat(msg));
}
class Pub {
  constructor() {
    _defineProperty(this, "subs", {});
  }
  _debugRefs(id) {
    if (this.subs[id]) {
      return "subId=".concat(id, ", refs(").concat(this.subs[id].refs.length, ")=").concat(this.subs[id].refs);
    }
    return 'not found';
  }
  subscribe(name, params, refId) {
    var id = findExistingSubscriptionId(name, params);
    if (!id || !this.subs[id]) {
      if (_Meteor.default.isVerbose()) {
        var p = JSON.stringify(params);
        info("New subscription ".concat(name, "(").concat(p, "), refId=").concat(refId));
      }
      var subscription = _Meteor.default.subscribe(name, ...paramsForSub(params));
      id = subscription.subscriptionId;
      this.subs[id] = {
        subscription,
        refs: []
      };
    } else if (id) {
      if (_Meteor.default.isVerbose()) {
        var _p = JSON.stringify(params);
        info("Existing subscription ".concat(name, "(").concat(_p, "), subId=").concat(id, ", refId=").concat(refId));
      }
    }
    this.subs[id].refs = (0, _lodash.uniq)([...this.subs[id].refs, refId]);
    if (_Meteor.default.isVerbose()) {
      info("Subscribe ".concat(this._debugRefs(id)));
    }
    return this.subs[id].subscription;
  }
  stop(subscription, refId) {
    var id = subscription.subscriptionId;
    if (!id || !this.subs[id]) {
      return;
    }
    this.subs[id].refs = this.subs[id].refs.filter(i => i !== refId);
    if (_Meteor.default.isVerbose()) {
      info("Stop subscription ".concat(this._debugRefs(id)));
    }
    if (this.subs[id].refs.length === 0) {
      if (_Meteor.default.isVerbose()) {
        info("Pub: Delete subscription subId=".concat(id));
      }
      delete this.subs[id];
      subscription.stop();
    }
  }
}
var _default = new Pub();
exports.default = _default;