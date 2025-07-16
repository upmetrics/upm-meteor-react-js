"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;
var _lodash = require("lodash");
var _react = require("react");
var _Random = _interopRequireDefault(require("../lib/Random"));
var _Pub = _interopRequireDefault(require("../lib/Pub"));
var _useTracker = _interopRequireDefault(require("./useTracker"));
var _Meteor = _interopRequireDefault(require("../Meteor"));
var _ejson = _interopRequireDefault(require("ejson"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * @author Piotr Falba
 * @author Wei Zhuo
 * @author Jakub Kania
 * @author Nyby
 */

function depsFromValuesOf(params) {
  if ((0, _lodash.isObject)(params)) {
    return Object.values(params);
  }
  if (Array.isArray(params)) {
    return params;
  }
  return typeof params === 'undefined' ? [] : [params];
}
function info(msg) {
  console.info("usePub: ".concat(msg));
}
function subId(name, deps, refId) {
  return _ejson.default.stringify({
    name,
    deps,
    refId
  });
}
function _default(_ref, dependencies) {
  var {
    name,
    params = {},
    userId,
    fetch = () => null
  } = _ref;
  var allArgsSet = !Object.values(params).some(x => x === undefined);
  var deps = dependencies || [userId !== null && userId !== void 0 ? userId : _Meteor.default.userId(), ...depsFromValuesOf(params)];
  var ref = (0, _react.useRef)(null);
  if (ref.current === null && allArgsSet) {
    ref.current = {
      subs: {},
      id: _Random.default.id()
    };
    if (_Meteor.default.isVerbose()) {
      var p = JSON.stringify(params);
      var d = JSON.stringify(deps);
      info("New ref ".concat(name, "(").concat(p, ")").concat(d, ", refId=").concat(ref.current.id));
    }
  }
  if (_Meteor.default.isVerbose() && !allArgsSet) {
    var _p = JSON.stringify(params);
    var _d = JSON.stringify(deps);
    info("Not all args set ".concat(name, "(").concat(_p, ")").concat(_d));
  }

  // stop publications on unmount
  (0, _react.useEffect)(() => () => {
    var _ref$current, _ref$current2;
    var id = subId(name, deps, (_ref$current = ref.current) === null || _ref$current === void 0 ? void 0 : _ref$current.id);
    if ((_ref$current2 = ref.current) !== null && _ref$current2 !== void 0 && _ref$current2.subs[id]) {
      if (_Meteor.default.isVerbose()) {
        info("Unmounting ".concat(ref.current.id, ", unsub ").concat(id));
      }
      _Pub.default.stop(ref.current.subs[id], ref.current.id);
      delete ref.current.subs[id];
    }
  }, deps);
  var formatError = _ref2 => {
    var {
      error,
      reason
    } = _ref2;
    return error ? {
      error,
      reason
    } : null;
  };
  return (0, _useTracker.default)(() => {
    var _ref$current$subs$id;
    if (!allArgsSet) {
      return [undefined, false, false];
    }
    var id = subId(name, deps, ref.current.id);
    var sub = (_ref$current$subs$id = ref.current.subs[id]) !== null && _ref$current$subs$id !== void 0 ? _ref$current$subs$id : _Pub.default.subscribe(name, params, ref.current.id);
    if (!ref.current.subs[id]) {
      ref.current.subs[id] = sub;
    }
    var result = !sub.error() ? fetch() : undefined;
    if (_Meteor.default.isVerbose()) {
      var _sub$error;
      var _p2 = JSON.stringify(params);
      var _d2 = JSON.stringify(deps);
      var r = sub.ready();
      var e = JSON.stringify(formatError((_sub$error = sub.error()) !== null && _sub$error !== void 0 ? _sub$error : {}));
      info("Ready=".concat(r, " ").concat(name, "(").concat(_p2, ")").concat(_d2, ", error=").concat(e, ", refId=").concat(ref.current.id));
    }
    var loading = !sub.ready();
    // console.log({ name, result, loading, error: sub.error() });
    return [result, loading, sub.error()];
  }, deps);
}