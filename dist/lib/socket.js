"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;
var _wolfy87Eventemitter = _interopRequireDefault(require("wolfy87-eventemitter"));
var _ejson = _interopRequireDefault(require("ejson"));
require("./mongo-id");
function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }
//  Register mongo object ids */

class Socket extends _wolfy87Eventemitter.default {
  constructor(SocketConstructor, endpoint) {
    super();
    this.SocketConstructor = SocketConstructor;
    this.endpoint = endpoint;
    this.rawSocket = null;
  }
  send(object) {
    if (!this.closing) {
      var message = _ejson.default.stringify(object);
      this.rawSocket.send(message);
      // Emit a copy of the object, as the listener might mutate it.
      this.emit('message:out', _ejson.default.parse(message));
    }
  }
  open() {
    /*
     *   Makes `open` a no-op if there's already a `rawSocket`. This avoids
     *   memory / socket leaks if `open` is called twice (e.g. by a user
     *   calling `ddp.connect` twice) without properly disposing of the
     *   socket connection. `rawSocket` gets automatically set to `null` only
     *   when it goes into a closed or error state. This way `rawSocket` is
     *   disposed of correctly: the socket connection is closed, and the
     *   object can be garbage collected.
     */
    if (this.rawSocket) {
      return;
    }
    this.closing = false;
    this.rawSocket = new this.SocketConstructor(this.endpoint);

    /*
     *   Calls to `onopen` and `onclose` directly trigger the `open` and
     *   `close` events on the `Socket` instance.
     */
    this.rawSocket.onopen = () => this.emit('open');
    this.rawSocket.onclose = () => {
      this.rawSocket = null;
      this.emit('close');
      this.closing = false;
    };
    /*
     *   Calls to `onmessage` trigger a `message:in` event on the `Socket`
     *   instance only once the message (first parameter to `onmessage`) has
     *   been successfully parsed into a javascript object.
     */
    this.rawSocket.onmessage = message => {
      var object;
      try {
        object = _ejson.default.parse(message.data);
      } catch (ignore) {
        // Simply ignore the malformed message and return
        return;
      }
      // Outside the try-catch block as it must only catch JSON parsing
      // errors, not errors that may occur inside a "message:in" event
      // handler
      this.emit('message:in', object);
    };
  }
  close() {
    /*
     *   Avoid throwing an error if `rawSocket === null`
     */
    if (this.rawSocket) {
      this.closing = true;
      this.rawSocket.close();
    }
  }
}
exports.default = Socket;