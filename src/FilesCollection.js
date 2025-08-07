
import call from './Call';
import Mongo from './Mongo';

// Helper: read file as ArrayBuffer
function readFileAsync(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

class Upload {
  constructor(fileDoc, collectionName, onAfterUpload) {
    this._events = {};
    this.fileDoc = fileDoc;
    this.collectionName = collectionName;
    this.onAfterUpload = onAfterUpload;
    this._startUpload();
  }

  async _startUpload() {
    this._emit('start');
    let error = null;
    let fileObj = null;
    try {
      const { file, meta } = this.fileDoc;
      const buffer = await readFileAsync(file);
      // Meteor-Files expects chunked upload, but for small files we can send as one chunk
      // You may want to split into chunks for large files
      const fileInfo = {
        name: file.name,
        size: file.size,
        type: file.type,
        meta: meta || {},
      };
      // 1. Start upload (creates file doc on server)
      await new Promise((resolve, reject) => {
        call(`${this.collectionName}.insert`, fileInfo, (err, res) => {
          if (err) return reject(err);
          fileObj = res;
          resolve();
        });
      });
      // 2. Send file data (as one chunk)
      await new Promise((resolve, reject) => {
        call(`${this.collectionName}.write`, fileObj._id, buffer, 0, file.size, (err, res) => {
          if (err) return reject(err);
          resolve();
        });
      });
      // 3. Finish upload
      await new Promise((resolve, reject) => {
        call(`${this.collectionName}.end`, fileObj._id, (err, res) => {
          if (err) return reject(err);
          resolve();
        });
      });
      if (typeof this.onAfterUpload === 'function') {
        try {
          this.onAfterUpload(fileObj);
        } catch (e) {/* ignore */}
      }
    } catch (e) {
      error = e;
    }
    this._emit('end', error, fileObj);
    if (this.fileDoc.onError && error) this.fileDoc.onError(error);
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

class FilesCollection {
  constructor(options = {}) {
    if (!options.collection && !options.collectionName) {
      throw new Error('FilesCollection requires a `collection` or `collectionName` option');
    }
    if (options.collection) {
      this.collection = options.collection;
      this.collectionName = options.collection._name;
    } else {
      this.collection = new Mongo.Collection(options.collectionName);
      this.collectionName = options.collectionName;
    }
    this.onAfterUpload = options.onAfterUpload;
  }

  insert(fileDoc, dynamic) {
    // If fileDoc has file, treat as upload
    if (fileDoc && fileDoc.file) {
      return new Upload(fileDoc, this.collectionName, this.onAfterUpload);
    }
    // Fallback: insert as document (not file)
    return this.collection.insert(fileDoc);
  }

  find(selector, options) {
    return this.collection.find(selector, options);
  }

  remove(selector) {
    // Remove via Meteor method
    if (typeof selector === 'string') {
      call(`${this.collectionName}.remove`, selector);
    } else if (selector && selector._id) {
      call(`${this.collectionName}.remove`, selector._id);
    } else {
      // fallback: remove locally
      return this.collection.remove(selector);
    }
  }

  // Download helper (returns a URL to download from Meteor-Files server)
  getDownloadUrl(fileObj) {
    // Assumes Meteor server is at same origin; adjust as needed
    return `/cdn/storage/${this.collectionName}/files/${fileObj._id}/original/${fileObj.name}`;
  }
}

export default FilesCollection;
