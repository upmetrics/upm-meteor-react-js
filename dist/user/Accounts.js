"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Data = _interopRequireDefault(require("../Data"));
var _Call = _interopRequireDefault(require("../Call"));
var _User = _interopRequireDefault(require("./User"));
var _utils = require("../lib/utils");
var _Meteor = _interopRequireDefault(require("../Meteor.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
function info(msg) {
  console.info("Acc: ".concat(msg));
}
class AccountsPassword {
  constructor() {
    _defineProperty(this, "_hashPassword", _utils.hashPassword);
    _defineProperty(this, "createUser", function (options) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : () => {};
      // Replace password with the hashed password.
      options.password = (0, _utils.hashPassword)(options.password);
      _User.default._startLoggingIn();
      (0, _Call.default)('createUser', options, (err, result) => {
        _Meteor.default.isVerbose() && info('Accounts.createUser::: err:', err, 'result:', result);
        _User.default._endLoggingIn();
        _User.default._handleLoginCallback(err, result);
        callback(err);
      });
    });
    _defineProperty(this, "changePassword", function (oldPassword, newPassword) {
      var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : () => {};
      // TODO check Meteor.user() to prevent if not logged

      if (typeof newPassword !== 'string' || !newPassword) {
        return callback('Password may not be empty');
      }
      (0, _Call.default)('changePassword', oldPassword ? (0, _utils.hashPassword)(oldPassword) : null, (0, _utils.hashPassword)(newPassword), (err, res) => {
        callback(err);
      });
    });
    _defineProperty(this, "forgotPassword", function (options) {
      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : () => {};
      if (!options.email) {
        return callback('Must pass options.email');
      }
      (0, _Call.default)('forgotPassword', options, err => {
        callback(err);
      });
    });
    _defineProperty(this, "resetPassword", function (token, newPassword) {
      var callback = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : () => {};
      if (!newPassword) {
        return callback('Must pass a new password');
      }
      (0, _Call.default)('resetPassword', token, (0, _utils.hashPassword)(newPassword), (err, result) => {
        _Meteor.default.isVerbose() && info('Accounts.resetPassword::: err:', err, 'result:', result);
        if (!err) {
          _User.default._loginWithToken(result.token);
        }
        callback(err);
      });
    });
    _defineProperty(this, "verifyEmail", function (token, cb) {
      if (!token) {
        if (typeof cb === 'function') return cb('Must pass a token');
        return;
      }
      (0, _Call.default)('verifyEmail', token, (err, result) => {
        _Meteor.default.isVerbose() && info('Accounts.verifyEmail::: err:', err, 'result:', result);
        if (!err && result && result.token) {
          _User.default._loginWithToken(result.token);
        }
        if (typeof cb === 'function') {
          cb(err);
        }
      });
    });
    _defineProperty(this, "onLogin", cb => {
      if (_Data.default._tokenIdSaved) {
        return cb();
      }
      _Data.default.on('onLogin', cb);
    });
    _defineProperty(this, "onLoginFailure", cb => {
      _Data.default.on('onLoginFailure', cb);
    });
  }
}
var _default = new AccountsPassword();
exports.default = _default;