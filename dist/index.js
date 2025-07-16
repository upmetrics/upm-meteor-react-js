"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _Meteor = require("./Meteor.js");
var _User = _interopRequireDefault(require("./user/User.js"));
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
Object.assign(_Meteor.Meteor, _User.default);
var _default = _Meteor.Meteor;
exports.default = _default;