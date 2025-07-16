"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wolfy87Eventemitter = _interopRequireDefault(require("wolfy87-eventemitter"));
var _queue = _interopRequireDefault(require("./queue"));
var _socket = _interopRequireDefault(require("./socket"));
var _utils = require("./utils");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
/**
 * DDP.JS 2.1.0
 */

var DDP_VERSION = '1';
var PUBLIC_EVENTS = [
// Subscription messages
'ready', 'nosub', 'added', 'changed', 'removed',
// Method messages
'result', 'updated',
// Error messages
'error'];
var DEFAULT_RECONNECT_INTERVAL = 10000;
class DDP extends _wolfy87Eventemitter.default {
  emit() {
    setTimeout(super.emit.bind(this, ...arguments), 0);
  }
  constructor(options) {
    super();
    this.status = 'disconnected';

    // Default `autoConnect` and `autoReconnect` to true
    this.autoConnect = options.autoConnect !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;
    this.messageQueue = new _queue.default(message => {
      if (this.status === 'connected') {
        this.socket.send(message);
        return true;
      }
      return false;
    });
    this.socket = new _socket.default(options.SocketConstructor, options.endpoint);
    this.socket.on('open', () => {
      // When the socket opens, send the `connect` message
      // to establish the DDP connection
      this.socket.send({
        msg: 'connect',
        version: DDP_VERSION,
        support: [DDP_VERSION]
      });
    });
    this.socket.on('close', () => {
      this.status = 'disconnected';
      this.messageQueue.empty();
      this.emit('disconnected');
      if (this.autoReconnect) {
        // Schedule a reconnection
        setTimeout(this.socket.open.bind(this.socket), this.reconnectInterval);
      }
    });
    this.socket.on('message:in', message => {
      if (message.msg === 'connected') {
        this.status = 'connected';
        this.messageQueue.process();
        this.emit('connected');
      } else if (message.msg === 'ping') {
        // Reply with a `pong` message to prevent the server from
        // closing the connection
        this.socket.send({
          msg: 'pong',
          id: message.id
        });
      } else if (PUBLIC_EVENTS.includes(message.msg)) {
        this.emit(message.msg, message);
      }
    });
    if (this.autoConnect) {
      this.connect();
    }
  }
  connect() {
    this.socket.open();
  }
  disconnect() {
    /*
     *   If `disconnect` is called, the caller likely doesn't want the
     *   the instance to try to auto-reconnect. Therefore we set the
     *   `autoReconnect` flag to false.
     */
    this.autoReconnect = false;
    this.socket.close();
  }
  method(name, params) {
    var id = (0, _utils.uniqueId)();
    this.messageQueue.push({
      msg: 'method',
      id,
      method: name,
      params
    });
    return id;
  }
  sub(name, params) {
    var id = (0, _utils.uniqueId)();
    this.messageQueue.push({
      msg: 'sub',
      id,
      name,
      params
    });
    return id;
  }
  unsub(id) {
    this.messageQueue.push({
      msg: 'unsub',
      id
    });
    return id;
  }
}
exports.default = DDP;