"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _reactDom = _interopRequireDefault(require("react-dom"));
var _minimongo = _interopRequireDefault(require("@meteorrn/minimongo"));
var _Tracker = _interopRequireDefault(require("./Tracker"));
var _setImmediateShim = _interopRequireDefault(require("set-immediate-shim"));
var _browser = _interopRequireDefault(require("process/browser"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
_browser.default.nextTick = _setImmediateShim.default;
var db = new _minimongo.default();
db.debug = false;
db.batchedUpdates = _reactDom.default.unstable_batchedUpdates;
function runAfterOtherComputations(fn) {
  _Tracker.default.afterFlush(() => fn());
}
var _default = {
  _endpoint: null,
  _options: {},
  ddp: null,
  subscriptions: {},
  db: db,
  calls: [],
  getUrl() {
    return this._endpoint.substring(0, this._endpoint.indexOf('/websocket'));
  },
  waitDdpReady(cb) {
    if (this.ddp) {
      cb();
    } else {
      runAfterOtherComputations(() => this.waitDdpReady(cb));
    }
  },
  _cbs: [],
  onChange(cb) {
    this.db.on('change', cb);
    this.ddp.on('connected', cb);
    this.ddp.on('disconnected', cb);
    this.on('loggingIn', cb);
    this.on('change', cb);
  },
  offChange(cb) {
    this.db.off('change', cb);
    this.ddp.off('connected', cb);
    this.ddp.off('disconnected', cb);
    this.off('loggingIn', cb);
    this.off('change', cb);
  },
  on(eventName, cb) {
    this._cbs.push({
      eventName: eventName,
      callback: cb
    });
  },
  off(eventName, cb) {
    this._cbs.splice(this._cbs.findIndex(_cb => _cb.callback === cb && _cb.eventName === eventName), 1);
  },
  notify(eventName) {
    this._cbs.map(cb => {
      if (cb.eventName === eventName && typeof cb.callback == 'function') {
        cb.callback();
      }
    });
  },
  waitDdpConnected(cb) {
    if (this.ddp && this.ddp.status === 'connected') {
      cb();
    } else if (this.ddp) {
      this.ddp.once('connected', cb);
    } else {
      setTimeout(() => this.waitDdpConnected(cb), 10);
    }
  }
};
exports.default = _default;