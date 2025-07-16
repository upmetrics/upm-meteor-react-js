"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _react = require("react");
var _Tracker = _interopRequireDefault(require("../Tracker"));
var _Data = _interopRequireDefault(require("../Data"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
var _default = function _default(trackerFn) {
  var deps = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var [response, setResponse] = (0, _react.useState)(trackerFn());
  var meteorDataDep = new _Tracker.default.Dependency();
  var computation = null;
  var dataChangedCallback = () => {
    meteorDataDep.changed();
  };
  var stopComputation = () => {
    computation && computation.stop();
    computation = null;
  };
  _Data.default.onChange(dataChangedCallback);
  (0, _react.useEffect)(() => {
    stopComputation();
    _Tracker.default.nonreactive(() => _Tracker.default.autorun(currentComputation => {
      meteorDataDep.depend();
      computation = currentComputation;
      setResponse(trackerFn());
    }));
    return () => {
      stopComputation();
      _Data.default.offChange(dataChangedCallback);
    };
  }, deps);
  return response;
};
exports.default = _default;