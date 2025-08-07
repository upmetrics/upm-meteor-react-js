// Minimal FilesCollection implementation for Meteor-like usage in React
// Accepts a `collection` option (should be a Meteor.Mongo.Collection instance)

class Upload {
  constructor(fileDoc, collection, onAfterUpload) {
    this._events = {};
    this.fileDoc = fileDoc;
    this.collection = collection;
    this.onAfterUpload = onAfterUpload;
    // Simulate async upload
    setTimeout(() => {
      this._emit('start');
      // Simulate upload (success or error)
      setTimeout(() => {
        let error = null;
        let fileObj = { ...fileDoc, _id: Math.random().toString(36).slice(2) };
        try {
          collection.insert(fileObj);
        } catch (e) {
          error = e;
        }
        if (!error && typeof onAfterUpload === 'function') {
          try {
            onAfterUpload(fileObj);
          } catch (e) {
            /* ignore */
          }
        }
        this._emit('end', error, fileObj);
        if (fileDoc.onError && error) fileDoc.onError(error);
      }, 100);
    }, 10);
  }
  on(event, handler) {
    this._events[event] = this._events[event] || [];
    this._events[event].push(handler);
    return this;
  }
  _emit(event, ...args) {
    (this._events[event] || []).forEach((fn) => fn(...args));
  }
}

import Mongo from './Mongo';

class FilesCollection {
  constructor(options = {}) {
    if (!options.collection && !options.collectionName) {
      throw new Error('FilesCollection requires a `collection` or `collectionName` option');
    }
    if (options.collection) {
      this.collection = options.collection;
    } else {
      // Create a new Meteor.Mongo.Collection if only collectionName is given
      this.collection = new Mongo.Collection(options.collectionName);
    }
    this.onAfterUpload = options.onAfterUpload;
  }

  insert(fileDoc, dynamic) {
    // If fileDoc has file/meta/onError, treat as upload
    if (fileDoc && fileDoc.file) {
      return new Upload(fileDoc, this.collection, this.onAfterUpload);
    }
    // Fallback: insert as document
    return this.collection.insert(fileDoc);
  }

  find(selector, options) {
    return this.collection.find(selector, options);
  }

  remove(selector) {
    return this.collection.remove(selector);
  }
}

export default FilesCollection;
