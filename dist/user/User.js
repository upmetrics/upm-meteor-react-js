"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Data = _interopRequireDefault(require("../Data"));
var _utils = require("../lib/utils");
var _Mongo = _interopRequireDefault(require("../Mongo"));
var _Meteor = _interopRequireDefault(require("../Meteor.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }
function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }
var TOKEN_KEY = 'Meteor.loginToken';
var Users = new _Mongo.default.Collection('users');
function info(msg) {
  console.info("User: ".concat(msg));
}
var User = {
  users: Users,
  user() {
    if (!User._userIdSaved) {
      return null;
    }
    return Users.findOne(User._userIdSaved);
  },
  userId() {
    if (!User._userIdSaved) {
      return null;
    }
    var user = Users.findOne(User._userIdSaved);
    return user && user._id;
  },
  _isLoggingIn: true,
  loggingIn() {
    return User._isLoggingIn;
  },
  logout(callback) {
    _Meteor.default.call('logout', err => {
      User.handleLogout();
      _Meteor.default.connect();
      typeof callback === 'function' && callback(err);
    });
  },
  handleLogout() {
    localStorage.removeItem(TOKEN_KEY);
    _Data.default._tokenIdSaved = null;
    User._userIdSaved = null;
  },
  loginWithPassword(selector, password, callback) {
    if (typeof selector === 'string') {
      if (selector.indexOf('@') === -1) {
        selector = {
          username: selector
        };
      } else {
        selector = {
          email: selector
        };
      }
    }
    User._startLoggingIn();
    _Meteor.default.call('login', {
      user: selector,
      password: (0, _utils.hashPassword)(password)
    }, (err, result) => {
      User._endLoggingIn();
      User._handleLoginCallback(err, result);
      typeof callback === 'function' && callback(err);
    });
  },
  logoutOtherClients() {
    var callback = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : () => {};
    _Meteor.default.call('getNewToken', (err, res) => {
      if (err) {
        return callback(err);
      }
      User._handleLoginCallback(err, res);
      _Meteor.default.call('removeOtherTokens', err => {
        callback(err);
      });
    });
  },
  _login(user, callback) {
    User._startLoggingIn();
    _Meteor.default.call('login', user, (err, result) => {
      User._endLoggingIn();
      User._handleLoginCallback(err, result);
      typeof callback === 'function' && callback(err);
    });
  },
  _startLoggingIn() {
    User._isLoggingIn = true;
    _Data.default.notify('loggingIn');
  },
  _endLoggingIn() {
    User._isLoggingIn = false;
    _Data.default.notify('loggingIn');
  },
  _handleLoginCallback(err, result) {
    if (!err) {
      _Meteor.default.isVerbose() && info('User._handleLoginCallback::: token:', result.token, 'id:', result.id);
      localStorage.setItem(TOKEN_KEY, result.token);
      _Data.default._tokenIdSaved = result.token;
      User._userIdSaved = result.id;
      _Data.default.notify('onLogin');
    } else {
      _Meteor.default.isVerbose() && info('User._handleLoginCallback::: error:', err);
      _Data.default.notify('onLoginFailure');
      User.handleLogout();
    }
    _Data.default.notify('change');
  },
  _loginWithToken(value) {
    _Data.default._tokenIdSaved = value;
    if (value !== null) {
      _Meteor.default.isVerbose() && info('User._loginWithToken::: token:', value);
      User._startLoggingIn();
      _Meteor.default.call('login', {
        resume: value
      }, (err, result) => {
        User._endLoggingIn();
        User._handleLoginCallback(err, result);
      });
    } else {
      _Meteor.default.isVerbose() && info('User._loginWithToken::: token is null');
      User._endLoggingIn();
    }
  },
  getAuthToken() {
    return _Data.default._tokenIdSaved;
  },
  _loadInitialUser() {
    return _asyncToGenerator(function* () {
      var value = null;
      try {
        value = yield localStorage.getItem(TOKEN_KEY);
      } catch (error) {
        console.warn('LocalStorage error: ' + error.message);
      } finally {
        User._loginWithToken(value);
      }
    })();
  }
};
var _default = User;
exports.default = _default;