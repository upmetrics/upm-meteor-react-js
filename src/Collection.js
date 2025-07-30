import Tracker from './Tracker';
import EJSON from 'ejson';
import { extend, forEach, has } from 'lodash';

import Data from './Data';
import Random from './lib/Random';
import call from './Call';
import { isPlainObject } from './lib/utils.js';

const observers = {};

export const runObservers = (type, collection, newDocument, oldDocument) => {
  if (observers[collection]) {
    observers[collection].forEach(({ cursor, callbacks }) => {
      if (callbacks[type]) {
        if (type === 'removed') {
          callbacks['removed'](newDocument);
        } else if (
          Data.db[collection].findOne({
            $and: [{ _id: newDocument._id }, cursor._selector],
          })
        ) {
          try {
            callbacks[type](newDocument, oldDocument);
          } catch (e) {
            console.error('Error in observe callback', e);
          }
        }
      }
    });
  }
};

const _registerObserver = (collection, cursor, callbacks) => {
  observers[collection] = observers[collection] || [];
  observers[collection].push({ cursor, callbacks });
};

class Cursor {
  constructor(collection, docs, selector) {
    this._docs = docs || [];
    this._collection = collection;
    this._selector = selector;
  }

  count() {
    return this._docs.length;
  }

  fetch() {
    return this._transformedDocs();
  }

  forEach(callback) {
    this._transformedDocs().forEach(callback);
  }

  map(callback) {
    return this._transformedDocs().map(callback);
  }

  _transformedDocs() {
    return this._collection._transform ? this._docs.map(this._collection._transform) : this._docs;
  }

  observe(callbacks) {
    _registerObserver(this._collection._collection.name, this, callbacks);
  }
}

export const localCollections = [];

export class Collection {
  constructor(name, options = {}) {
    if (name === null) {
      this.localCollection = true;
      name = Random.id();
      localCollections.push(name);
    }

    if (!Data.db[name]) {
      Data.db.addCollection(name);
    }

    this._collection = Data.db[name];
    this._name = name;
    this._transform = wrapTransform(options.transform);
  }

  find(selector, options) {
    let result;
    let docs;

    if (typeof selector === 'string') {
      if (options) {
        docs = this._collection.findOne({ _id: selector }, options);
      } else {
        docs = this._collection.get(selector);
      }

      if (docs) {
        docs = [docs];
      }
    } else {
      docs = this._collection.find(selector, options);
    }

    result = new Cursor(this, docs, selector);

    return result;
  }

  findOne(selector, options) {
    let result = this.find(selector, options);

    if (result) {
      result = result.fetch()[0];
    }

    return result;
  }

  insert(item, callback = () => {}) {
    let id;

    if ('_id' in item) {
      if (!item._id || typeof item._id !== 'string') {
        return callback('Meteor requires document _id fields to be non-empty strings');
      }
      id = item._id;
    } else {
      id = item._id = Random.id();
    }

    if (this._collection.get(id)) {
      return callback({
        error: 409,
        reason: `Duplicate key _id with value ${id}`,
      });
    }

    this._collection.upsert(item);

    if (!this.localCollection) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/insert`, item, (err) => {
          if (err) {
            this._collection.del(id);
            return callback(err);
          }

          callback(null, id);
        });
      });
    }

    return id;
  }

  update(id, modifier, options = {}, callback = () => {}) {
    if (typeof options === 'function') {
      callback = options;
    }

    if (!this._collection.get(id)) {
      return callback({
        error: 409,
        reason: `Item not found in collection ${this._name} with id ${id}`,
      });
    }

    // change mini mongo for optimize UI changes
    this._collection.upsert({ _id: id, ...modifier.$set });

    if (!this.localCollection) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/update`, { _id: id }, modifier, (err) => {
          if (err) {
            return callback(err);
          }

          callback(null, id);
        });
      });
    }
  }

  bulkUpdate(updates, options = {}, callback = () => {}) {
    if (typeof options === 'function') {
      callback = options;
    }

    // updates should be an array of { selector, modifier } objects
    if (!Array.isArray(updates)) {
      return callback({
        error: 400,
        reason: 'bulkUpdate expects an array of update operations',
      });
    }

    // Optimistically update local collection for UI responsiveness
    updates.forEach(({ selector, modifier }) => {
      if (selector._id && modifier.$set) {
        // Only update locally if we have an _id and $set operation
        const existingDoc = this._collection.get(selector._id);
        if (existingDoc) {
          this._collection.upsert({ _id: selector._id, ...modifier.$set });
        }
      }
    });

    if (!this.localCollection) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/bulkUpdate`, updates, (err, result) => {
          if (err) {
            // Rollback optimistic updates on error
            updates.forEach(({ selector, modifier }) => {
              if (selector._id) {
                // You might want to implement rollback logic here
                // For now, we'll let the subscription system handle the correction
              }
            });
            return callback(err);
          }

          callback(null, result);
        });
      });
    } else {
      // For local collections, process updates immediately
      const results = updates.map(({ selector, modifier }) => {
        if (selector._id) {
          const doc = this._collection.get(selector._id);
          if (doc && modifier.$set) {
            this._collection.upsert({ ...doc, ...modifier.$set });
            return { _id: selector._id, success: true };
          }
        }
        return { selector, success: false, reason: 'Document not found or invalid modifier' };
      });
      callback(null, results);
    }
  }

  updateMany(selector, modifier, options = {}, callback = () => {}) {
    if (typeof options === 'function') {
      callback = options;
    }

    // For updateMany, we'll use the server-side method directly
    // This doesn't require local documents to exist
    if (!this.localCollection) {
      Data.waitDdpConnected(() => {
        call(`/${this._name}/updateMany`, selector, modifier, (err, result) => {
          if (err) {
            return callback(err);
          }

          callback(null, result);
        });
      });
    } else {
      // For local collections, find matching documents and update them
      const docs = this._collection.find(selector);
      const updated = [];

      docs.forEach((doc) => {
        if (modifier.$set) {
          this._collection.upsert({ ...doc, ...modifier.$set });
          updated.push(doc._id);
        }
      });

      callback(null, { modifiedCount: updated.length, matchedCount: docs.length });
    }
  }

  remove(id, callback = () => {}) {
    const element = this.findOne(id);

    if (element) {
      this._collection.del(element._id);

      if (!this.localCollection) {
        Data.waitDdpConnected(() => {
          call(`/${this._name}/remove`, { _id: id }, (err, res) => {
            if (err) {
              this._collection.upsert(element);
              return callback(err);
            }
            callback(null, res);
          });
        });
      }
    } else {
      callback(`No document with _id : ${id}`);
    }
  }

  helpers(helpers) {
    let _transform;

    if (this._transform && !this._helpers) {
      _transform = this._transform;
    }

    if (!this._helpers) {
      this._helpers = function Document(doc) {
        return extend(this, doc);
      };
      this._transform = (doc) => {
        if (_transform) {
          doc = _transform(doc);
        }
        return new this._helpers(doc);
      };
    }

    forEach(helpers, (helper, key) => {
      this._helpers.prototype[key] = helper;
    });
  }
}

// From Meteor core

// Wrap a transform function to return objects that have the _id field
// of the untransformed document. This ensures that subsystems such as
// the observe-sequence package that call `observe` can keep track of
// the documents identities.
//
// - Require that it returns objects
// - If the return value has an _id field, verify that it matches the
//   original _id field
// - If the return value doesn't have an _id field, add it back.
function wrapTransform(transform) {
  if (!transform) {
    return null;
  }

  // No need to doubly-wrap transforms.
  if (transform.__wrappedTransform__) {
    return transform;
  }

  const wrapped = function (doc) {
    if (!has(doc, '_id')) {
      // XXX do we ever have a transform on the oplog's collection? because that
      // collection has no _id.
      throw new Error('can only transform documents with _id');
    }

    const id = doc._id;
    // XXX consider making tracker a weak dependency and checking Package.tracker here
    const transformed = Tracker.nonreactive(function () {
      return transform(doc);
    });

    if (!isPlainObject(transformed)) {
      throw new Error('transform must return object');
    }

    if (has(transformed, '_id')) {
      if (!EJSON.equals(transformed._id, id)) {
        throw new Error("transformed document can't have different _id");
      }
    } else {
      transformed._id = id;
    }
    return transformed;
  };
  wrapped.__wrappedTransform__ = true;
  return wrapped;
}
