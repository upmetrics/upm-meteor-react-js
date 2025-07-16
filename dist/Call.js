"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _Data = _interopRequireDefault(require("./Data"));
var _Meteor = _interopRequireDefault(require("./Meteor"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function debugMethod(name, params) {
  var args = JSON.stringify(params).replace(/^\[|\]$/g, '');
  return "\"".concat(name, "\"(").concat(args, ")");
}
function info(msg) {
  console.info("Call: ".concat(msg));
}
function _default(eventName) {
  var args = Array.prototype.slice.call(arguments, 1);
  var callback;
  if (args.length && typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }
  var id = _Data.default.ddp.method(eventName, args);
  if (_Meteor.default.isVerbose()) {
    info("Call: Method ".concat(debugMethod(eventName, args), ", id=").concat(id));
  }
  _Data.default.calls.push({
    id,
    callback
  });
}