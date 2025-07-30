import Data from './Data';
import Meteor from './Meteor';

function debugMethod(name, params) {
  const args = JSON.stringify(params).replace(/^\[|\]$/g, '');
  return `"${name}"(${args})`;
}

function info(msg) {
  console.info(`Call: ${msg}`);
}

export default function (eventName) {
  const args = Array.prototype.slice.call(arguments, 1);
  let callback;
  if (args.length && typeof args[args.length - 1] === 'function') {
    callback = args.pop();
  }

  // Enhanced method call to ensure authentication context
  const originalCallback = callback;
  const enhancedCallback = function (error, result) {
    if (error && error.error === '403' && error.reason === 'Access denied.') {
      // If we get access denied, try to re-establish authentication
      console.warn('Access denied - attempting to re-establish session');
      const token = Data._tokenIdSaved;
      if (token) {
        // Try to re-login with the stored token
        Meteor.call('login', { resume: token }, (loginError, loginResult) => {
          if (!loginError && loginResult) {
            // Re-attempt the original call after successful re-login
            const retryId = Data.ddp.method(eventName, args);
            Data.calls.push({ id: retryId, callback: originalCallback });
          } else if (originalCallback) {
            originalCallback(error, result);
          }
        });
        return;
      }
    }
    if (originalCallback) {
      originalCallback(error, result);
    }
  };

  const id = Data.ddp.method(eventName, args);
  if (Meteor.isVerbose()) {
    info(`Call: Method ${debugMethod(eventName, args)}, id=${id}`);
  }
  Data.calls.push({ id, callback: enhancedCallback });
}
