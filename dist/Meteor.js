"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = exports.Meteor = void 0;
var _Tracker = _interopRequireDefault(require("./Tracker"));
var _ejson = _interopRequireDefault(require("ejson"));
var _ddp = _interopRequireDefault(require("./lib/ddp.js"));
var _Random = _interopRequireDefault(require("./lib/Random"));
var _Data = _interopRequireDefault(require("./Data"));
var _Mongo = _interopRequireDefault(require("./Mongo"));
var _Collection = require("./Collection");
var _Call = _interopRequireDefault(require("./Call"));
var _withTracker = _interopRequireDefault(require("./components/withTracker"));
var _useTracker = _interopRequireDefault(require("./components/useTracker"));
var _usePublication = _interopRequireDefault(require("./components/usePublication"));
var _useMethod = _interopRequireDefault(require("./components/useMethod"));
var _Accounts = _interopRequireDefault(require("./user/Accounts.js"));
var _ReactiveDict = _interopRequireDefault(require("./ReactiveDict"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
function ownKeys(object, enumerableOnly) { var keys = Object.keys(object); if (Object.getOwnPropertySymbols) { var symbols = Object.getOwnPropertySymbols(object); enumerableOnly && (symbols = symbols.filter(function (sym) { return Object.getOwnPropertyDescriptor(object, sym).enumerable; })), keys.push.apply(keys, symbols); } return keys; }
function _objectSpread(target) { for (var i = 1; i < arguments.length; i++) { var source = null != arguments[i] ? arguments[i] : {}; i % 2 ? ownKeys(Object(source), !0).forEach(function (key) { _defineProperty(target, key, source[key]); }) : Object.getOwnPropertyDescriptors ? Object.defineProperties(target, Object.getOwnPropertyDescriptors(source)) : ownKeys(Object(source)).forEach(function (key) { Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key)); }); } return target; }
function _defineProperty(obj, key, value) { key = _toPropertyKey(key); if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }
function _toPropertyKey(arg) { var key = _toPrimitive(arg, "string"); return typeof key === "symbol" ? key : String(key); }
function _toPrimitive(input, hint) { if (typeof input !== "object" || input === null) return input; var prim = input[Symbol.toPrimitive]; if (prim !== undefined) { var res = prim.call(input, hint || "default"); if (typeof res !== "object") return res; throw new TypeError("@@toPrimitive must return a primitive value."); } return (hint === "string" ? String : Number)(input); }
var isVerbose = false;
function debugSub(name, params) {
  var args = JSON.stringify(params).replace(/^\[|\]$/g, '');
  return "\"".concat(name, "\"(").concat(args, ")");
}
function info(msg) {
  for (var _len = arguments.length, rest = new Array(_len > 1 ? _len - 1 : 0), _key = 1; _key < _len; _key++) {
    rest[_key - 1] = arguments[_key];
  }
  console.info("DDP: ".concat(msg), ...rest);
}
function warn(msg) {
  for (var _len2 = arguments.length, rest = new Array(_len2 > 1 ? _len2 - 1 : 0), _key2 = 1; _key2 < _len2; _key2++) {
    rest[_key2 - 1] = arguments[_key2];
  }
  console.warn("DDP: ".concat(msg), ...rest);
}
var Meteor = {
  isVerbose() {
    return isVerbose;
  },
  enableVerbose() {
    isVerbose = true;
  },
  Random: _Random.default,
  Mongo: _Mongo.default,
  Tracker: _Tracker.default,
  EJSON: _ejson.default,
  ReactiveDict: _ReactiveDict.default,
  Accounts: _Accounts.default,
  Collection: _Collection.Collection,
  withTracker: _withTracker.default,
  useTracker: _useTracker.default,
  usePublication: _usePublication.default,
  useMethod: _useMethod.default,
  getData() {
    return _Data.default;
  },
  status() {
    return {
      connected: _Data.default.ddp ? _Data.default.ddp.status === 'connected' : false,
      status: _Data.default.ddp ? _Data.default.ddp.status : 'disconnected'
      // retryCount: 0
      // retryTime:
      // reason:
    };
  },

  call: _Call.default,
  disconnect() {
    if (_Data.default.ddp) {
      _Data.default.ddp.disconnect();
    }
  },
  _subscriptionsRestart() {
    for (var i of Object.keys(_Data.default.subscriptions)) {
      var sub = _Data.default.subscriptions[i];
      _Data.default.ddp.unsub(sub.subIdRemember);
      sub.subIdRemember = _Data.default.ddp.sub(sub.name, sub.params);
    }
  },
  waitDdpConnected: _Data.default.waitDdpConnected.bind(_Data.default),
  reconnect() {
    _Data.default.ddp && _Data.default.ddp.connect();
  },
  packageInterface: () => {
    return {
      localStorage
    };
  },
  connect(endpoint, options) {
    if (!endpoint) {
      endpoint = _Data.default._endpoint;
    }
    if (!options) {
      options = _Data.default._options;
    }
    if ((!endpoint.startsWith('ws') || !endpoint.endsWith('/websocket')) && !options.suppressUrlErrors) {
      throw new Error( // eslint-disable-next-line max-len
      "Your url \"".concat(endpoint, "\" may be in the wrong format. It should start with \"ws://\" or \"wss://\" and end with \"/websocket\", e.g. \"wss://myapp.meteor.com/websocket\". To disable this warning, connect with option \"suppressUrlErrors\" as true, e.g. Meteor.connect(\"").concat(endpoint, "\", {suppressUrlErrors:true});"));
    }
    _Data.default._endpoint = endpoint;
    _Data.default._options = options;
    this.ddp = _Data.default.ddp = new _ddp.default(_objectSpread({
      endpoint,
      SocketConstructor: WebSocket
    }, options));
    _Data.default.ddp.on('connected', () => {
      // Clear the collections of any stale data in case this is a reconnect
      if (_Data.default.db && _Data.default.db.collections) {
        for (var collection of Object.keys(_Data.default.db.collections)) {
          if (!_Collection.localCollections.includes(collection)) {
            // Dont clear data from local collections
            _Data.default.db[collection].remove({});
          }
        }
      }
      _Data.default.notify('change');
      if (isVerbose) {
        info("Connected to DDP server ".concat(endpoint));
      }
      this._loadInitialUser().then(() => {
        this._subscriptionsRestart();
      });
    });
    var lastDisconnect = null;
    _Data.default.ddp.on('disconnected', () => {
      _Data.default.notify('change');
      if (isVerbose) {
        info('Disconnected from DDP server.');
      }
      if (!_Data.default.ddp.autoReconnect) {
        return;
      }
      if (!lastDisconnect || new Date() - lastDisconnect > 3000) {
        _Data.default.ddp.connect();
      }
      lastDisconnect = new Date();
    });
    _Data.default.ddp.on('added', message => {
      if (!_Data.default.db[message.collection]) {
        _Data.default.db.addCollection(message.collection);
      }
      var document = _objectSpread({
        _id: message.id
      }, message.fields);
      _Data.default.db[message.collection].upsert(document);
      if (isVerbose) {
        info("Added to \"".concat(message.collection, "\", _id=").concat(message.id));
      }
      (0, _Collection.runObservers)('added', message.collection, document);
    });
    _Data.default.ddp.on('ready', message => {
      if (isVerbose) {
        info("Ready subs=".concat(message.subs));
      }
      var idsMap = new Map();
      for (var i of Object.keys(_Data.default.subscriptions)) {
        var sub = _Data.default.subscriptions[i];
        idsMap.set(sub.subIdRemember, sub.id);
      }
      for (var _i of Object.keys(message.subs)) {
        var subId = idsMap.get(message.subs[_i]);
        if (subId) {
          if (isVerbose) {
            info("Subscription ready subId=".concat(subId));
          }
          var _sub = _Data.default.subscriptions[subId];
          _sub.ready = true;
          _sub.readyDeps.changed();
          _sub.readyCallback && _sub.readyCallback();
        }
      }
    });
    _Data.default.ddp.on('changed', message => {
      var unset = {};
      if (isVerbose) {
        info("Changed to \"".concat(message.collection, "\", _id=").concat(message.id));
      }
      if (message.cleared) {
        message.cleared.forEach(field => {
          unset[field] = null;
        });
      }
      if (_Data.default.db[message.collection]) {
        var document = _objectSpread(_objectSpread({
          _id: message.id
        }, message.fields), unset);
        var oldDocument = _Data.default.db[message.collection].findOne({
          _id: message.id
        });
        _Data.default.db[message.collection].upsert(document);
        (0, _Collection.runObservers)('changed', message.collection, document, oldDocument);
      }
    });
    _Data.default.ddp.on('removed', message => {
      if (isVerbose) {
        info("Removed from \"".concat(message.collection, "\", _id=").concat(message.id));
      }
      if (_Data.default.db[message.collection]) {
        var oldDocument = _Data.default.db[message.collection].findOne({
          _id: message.id
        });
        _Data.default.db[message.collection].del(message.id);
        (0, _Collection.runObservers)('removed', message.collection, oldDocument);
      }
    });
    _Data.default.ddp.on('result', message => {
      var c = _Data.default.calls.find(x => x.id === message.id);
      if (isVerbose) {
        info("Method result for id=".concat(message.id));
      }
      if (typeof c.callback === 'function') {
        c.callback(message.error, message.result);
      }
      _Data.default.calls.splice(_Data.default.calls.findIndex(x => x.id === message.id), 1);
    });
    _Data.default.ddp.on('nosub', message => {
      for (var i of Object.keys(_Data.default.subscriptions)) {
        var sub = _Data.default.subscriptions[i];
        if (sub.subIdRemember === message.id) {
          if (message.error) {
            sub.error = message.error;
            sub.ready = true;
            sub.readyDeps.changed();
            sub.readyCallback && sub.readyCallback();
            if (isVerbose) {
              warn('Subscription returned error for', sub.name);
            }
          } else {
            if (isVerbose) {
              info('Stop subscription for', sub.name);
            }
          }
        }
      }
    });
  },
  subscribe(name) {
    var params = Array.prototype.slice.call(arguments, 1);
    var callbacks = {};
    if (params.length) {
      var lastParam = params[params.length - 1];
      if (typeof lastParam === 'function') {
        callbacks.onReady = params.pop();
      } else if (lastParam && (typeof lastParam.onReady === 'function' || typeof lastParam.onError === 'function' || typeof lastParam.onStop === 'function')) {
        callbacks = params.pop();
      }
    }

    // Is there an existing sub with the same name and param, run in an
    // invalidated Computation? This will happen if we are rerunning an
    // existing computation.
    //
    // For example, consider a rerun of:
    //
    //     Tracker.autorun(function () {
    //       Meteor.subscribe("foo", Session.get("foo"));
    //       Meteor.subscribe("bar", Session.get("bar"));
    //     });
    //
    // If "foo" has changed but "bar" has not, we will match the "bar"
    // subscribe to an existing inactive subscription in order to not
    // unsub and resub the subscription unnecessarily.
    //
    // We only look for one such sub; if there are N apparently-identical subs
    // being invalidated, we will require N matching subscribe calls to keep
    // them all active.

    var existing = false;
    for (var i of Object.keys(_Data.default.subscriptions)) {
      var sub = _Data.default.subscriptions[i];
      if (sub.inactive && sub.name === name && _ejson.default.equals(sub.params, params)) {
        existing = sub;
      }
    }
    var id;
    if (existing) {
      id = existing.id;
      existing.inactive = false;
      if (callbacks.onReady) {
        // If the sub is not already ready, replace any ready callback with the
        // one provided now. (It's not really clear what users would expect for
        // an onReady callback inside an autorun; the semantics we provide is
        // that at the time the sub first becomes ready, we call the last
        // onReady callback provided, if any.)
        if (!existing.ready) {
          existing.readyCallback = callbacks.onReady;
        }
      }
      if (callbacks.onStop) {
        existing.stopCallback = callbacks.onStop;
      }
    } else {
      // New sub! Generate an id, save it locally, and send message.

      id = _Random.default.id();
      var subIdRemember = _Data.default.ddp.sub(name, params);
      if (isVerbose) {
        info("Subscribe to ".concat(debugSub(name, params), " subId=").concat(id, ", sub=").concat(subIdRemember));
      }
      _Data.default.subscriptions[id] = {
        id,
        subIdRemember,
        name,
        params: _ejson.default.clone(params),
        inactive: false,
        ready: false,
        readyDeps: new _Tracker.default.Dependency(),
        readyCallback: callbacks.onReady,
        stopCallback: callbacks.onStop,
        error: null,
        stop() {
          _Data.default.ddp.unsub(this.subIdRemember);
          delete _Data.default.subscriptions[this.id];
          this.ready && this.readyDeps.changed();
          if (isVerbose) {
            info("Stopping ".concat(debugSub(name, params), "  subId=").concat(this.id, ", sub=").concat(this.subIdRemember));
          }
          if (callbacks.onStop) {
            callbacks.onStop();
          }
        }
      };
    }

    // return a handle to the application.
    var handle = {
      stop() {
        if (_Data.default.subscriptions[id]) {
          _Data.default.subscriptions[id].stop();
        }
      },
      ready() {
        if (!_Data.default.subscriptions[id]) {
          return false;
        }
        var record = _Data.default.subscriptions[id];
        record.readyDeps.depend();
        return record.ready;
      },
      error() {
        var _Data$subscriptions$i;
        if (!_Data.default.subscriptions[id]) {
          return null;
        }
        return (_Data$subscriptions$i = _Data.default.subscriptions[id].error) !== null && _Data$subscriptions$i !== void 0 ? _Data$subscriptions$i : null;
      },
      subscriptionId: id
    };

    /* if (Tracker.active) {
      // We're in a reactive computation, so we'd like to unsubscribe when the
      // computation is invalidated... but not if the rerun just re-subscribes
      // to the same subscription!  When a rerun happens, we use onInvalidate
      // as a change to mark the subscription "inactive" so that it can
      // be reused from the rerun.  If it isn't reused, it's killed from
      // an afterFlush.
      Tracker.onInvalidate(function () {
        if (isVerbose) {
          info(`Tracker.onInvalidate subId=${id}`);
        }
        if (Data.subscriptions[id] && Data.subscriptions[id].ready) {
          Data.subscriptions[id].inactive = true;
        }
         Tracker.afterFlush(function () {
          if (isVerbose) {
            info(`Tracker.afterFlush subId=${id}`);
          }
          if (Data.subscriptions[id] && Data.subscriptions[id].inactive) {
            handle.stop();
          }
        });
      });
    } */
    return handle;
  }
};
exports.Meteor = Meteor;
var _default = Meteor;
exports.default = _default;