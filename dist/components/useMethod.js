"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _Random = _interopRequireDefault(require("../lib/Random"));
var _Meteor = _interopRequireDefault(require("../Meteor"));
var _lodash = require("lodash");
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
  console.info("useMethod: ".concat(msg));
}
var _default = function _default(name) {
  var args = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
  var dependencies = arguments.length > 2 ? arguments[2] : undefined;
  var deps = dependencies || [_Meteor.default.userId(), ...depsFromValuesOf(args)];
  var [state, setState] = (0, _react.useState)({
    result: null,
    loading: true,
    err: null
  });
  var ref = (0, _react.useRef)(null);
  var allArgsSet = !Object.values(args).some(x => x === undefined);
  var p, d;
  if (ref.current === null) {
    ref.current = {
      id: _Random.default.id()
    };
  }
  if (_Meteor.default.isVerbose()) {
    p = JSON.stringify(args);
    d = JSON.stringify(deps);
    info("Init ".concat(name, "(").concat(p, ")").concat(d, ", refId=").concat(ref.current.id));
  }
  (0, _react.useEffect)(() => {
    var mounted = true;
    if (!allArgsSet) {
      if (_Meteor.default.isVerbose()) {
        info("Args not all set ".concat(name, "(").concat(p, ")").concat(d));
      }
      setState({
        result: null,
        loading: false,
        err: null
      });
    } else {
      if (_Meteor.default.isVerbose()) {
        info("Calling ".concat(name, "(").concat(p, ")").concat(d, ", err=null, loading=true, refId=").concat(ref.current.id));
      }
      setState({
        err: null,
        result: null,
        loading: true
      });
      _Meteor.default.call(name, args, (err, result) => {
        if (err) {
          console.log(err);
        }
        if (mounted) {
          if (_Meteor.default.isVerbose()) {
            info("Returned ".concat(name, "(").concat(p, ")").concat(d, ", err=").concat(err, ", loading=false, refId=").concat(ref.current.id));
          }
          setState({
            err,
            result,
            loading: false
          });
        }
      });
    }
    return () => {
      mounted = false;
    };
  }, deps);
  return state;
};
exports.default = _default;