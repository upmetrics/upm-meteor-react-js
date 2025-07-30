/**
 * DDP.JS 2.1.0
 */

import EventEmitter from 'wolfy87-eventemitter';
import Queue from './queue';
import Socket from './socket';
import { uniqueId } from './utils';

// Helper function to get auth token
function getAuthToken() {
  // Try to get from localStorage for cross-compatibility
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('Meteor.loginToken');
  }
  return null;
}

const DDP_VERSION = '1';
const PUBLIC_EVENTS = [
  // Subscription messages
  'ready',
  'nosub',
  'added',
  'changed',
  'removed',
  // Method messages
  'result',
  'updated',
  // Error messages
  'error',
];
const DEFAULT_RECONNECT_INTERVAL = 10000;

export default class DDP extends EventEmitter {
  emit() {
    setTimeout(super.emit.bind(this, ...arguments), 0);
  }

  constructor(options) {
    super();

    this.status = 'disconnected';
    this.sessionId = null; // Track session ID
    this.authEstablished = false; // Track if authentication has been attempted

    // Default `autoConnect` and `autoReconnect` to true
    this.autoConnect = options.autoConnect !== false;
    this.autoReconnect = options.autoReconnect !== false;
    this.reconnectInterval = options.reconnectInterval || DEFAULT_RECONNECT_INTERVAL;

    this.messageQueue = new Queue((message) => {
      if (this.status === 'connected') {
        this.socket.send(message);
        return true;
      }
      return false;
    });

    this.socket = new Socket(options.SocketConstructor, options.endpoint);

    this.socket.on('open', () => {
      // When the socket opens, send the `connect` message
      // to establish the DDP connection
      const connectMessage = {
        msg: 'connect',
        version: DDP_VERSION,
        support: [DDP_VERSION],
      };

      // Add resume token if available for server-side authentication
      const token = getAuthToken();
      if (token) {
        connectMessage.session = token;
      }

      this.socket.send(connectMessage);
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

    this.socket.on('message:in', (message) => {
      if (message.msg === 'connected') {
        this.status = 'connected';
        this.sessionId = message.session; // Store session ID
        
        // Immediately attempt to establish authentication if we have a token
        const token = getAuthToken();
        if (token && !this.authEstablished) {
          this.authEstablished = true;
          // Send a login method call to establish authentication
          const loginId = this.method('login', [{ resume: token }]);
          // Don't emit connected until after authentication attempt
          setTimeout(() => {
            this.messageQueue.process();
            this.emit('connected');
          }, 50);
        } else {
          this.messageQueue.process();
          this.emit('connected');
        }
      } else if (message.msg === 'ping') {
        // Reply with a `pong` message to prevent the server from
        // closing the connection
        this.socket.send({ msg: 'pong', id: message.id });
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
    const id = uniqueId();
    this.messageQueue.push({
      msg: 'method',
      id,
      method: name,
      params,
    });
    return id;
  }

  sub(name, params) {
    const id = uniqueId();
    this.messageQueue.push({
      msg: 'sub',
      id,
      name,
      params,
    });
    return id;
  }

  unsub(id) {
    this.messageQueue.push({
      msg: 'unsub',
      id,
    });
    return id;
  }
}
