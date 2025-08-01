# Meteor React Native Docs

Table of Contents

- [Meteor](#meteor)
- [Tracker](#tracker)
- [Mongo](#mongo)
- [Accounts](#accounts)

<h2 id="meteor">Meteor</h2>

`import Meteor from 'meteor-react-js';`

### `Meteor.connect(url, options)`

Connect to the Meteor Server

**url**: The URL of your Meteor Server websocket. This should typically start with `ws://` (insecure, like `http://`) or
`wss://` (secure, like `https://`), and have the path `/websocket`, e.g.: `wss://myapp.meteor.com/websocket`

**options**:

- autoConnect **boolean** [true] whether to establish the connection to the server upon instantiation. When false, one
  can manually establish the connection with the Meteor.ddp.connect method.
- autoReconnect **boolean** [true] whether to try to reconnect to the server when the socket connection closes, unless
  the closing was initiated by a call to the disconnect method.
- reconnectInterval **number** [10000] the interval in ms between reconnection attempts.

### `Meteor.disconnect()`

Disconnect from the Meteor server

### `Meteor.call(name, [arg1, arg2...], [asyncCallback])`

Perform a call to a method

### `Meteor.subscribe(name, [arg1, arg2, arg3])`

Subscribe to a collection

### `Meteor.user()`

Returns the logged in user

### `Meteor.users`

Access the meteor users collection

### `Meteor.userId()`

Returns the userId of the logged in user

### `Meteor.status()`

Gets the current connection status. Returns an object with the following properties:

**connected**: Boolean

**status**: "connected" || "disconnected"

### `Meteor.loggingIn()`

Returns true if attempting to login

### `Meteor.loginWithPassword`

### `Meteor.logout`

### `Meteor.logoutOtherClients`

<h2 id="tracker">Tracker</h2>

#### `Meteor.withTracker(trackerFunc)(Component)`

Creates a new Tracker

**Arguments:**

- trackerFunc - Function which will be re-run reactively when it's dependencies are updated. Must return an object that
  is passed as properties to `Component`
- Component - React Component which will receive properties from trackerFunc

#### `Meteor.useTracker(trackerFunc)` => `React Hook`

Creates a new Tracker React Hook. Can only be used inside a function component. See React Docs for more info.

**Arguments:**

- trackerFunc - Function which will be re-run reactively when it's dependencies are updated.

<h2 id="mongo">Mongo</h2>

#### `new Meteor.Mongo.Collection(collectionName, options)` => `Collection`

Creates and returns a _Collection_

**Arguments**

- collectionName - Name of the remote collection, or pass `null` for a client-side collection

#### _`Collection`_

**_Collection_ Methods:**

- .insert(document) - Inserts document into collection
- .update(query, modifications) - Updates document in collection
- .remove(query) - Removes document from collection
- .find(query) => _`Cursor`_ - Returns a Cursor
- .findOne(query) => Document - Retrieves first matching Document

#### _`Cursor`_

**_Cursor_ Methods:**

- .obsrve() - Mirrors Meteor's observe behavior. Accepts object with the properties `added`, `changed`, and `removed`.
- .fetch() => `[Document]` - Retrieves an array of matching documents

<h2 id="accounts">Accounts</h2>

#### `Meteor.Accounts.createUser(user, callback)`

Creates a user

**Arguments**

- user - The user object
- callback - Called with a single error object or null on success

#### `Meteor.Accounts.changePassword(oldPassword, newPassword)`

Changes a user's password

**Arguments**

- oldPassword - The user's current password
- newPassword - The user's new password

#### `Meteor.Accounts.onLogin(callback)`

Registers a callback to be called when user is logged in

**Arguments**

- callback

#### `Meteor.Accounts.onLoginFailure(callback)`

Registers a callback to be called when login fails

**Arguments**

- callback

#### `Meteor.Accounts._hashPassword(plaintext)` => `{algorithm:"sha-256", digest:"..."}`

Hashes a password using the sha-256 algorithm. Returns an object formatted for use in accounts calls. You can access the
raw hashed string using the digest property.

**Arguments**

- plaintext - The plaintext string you want to hash

Other:

- [Meteor.Accounts.forgotPassword](http://docs.meteor.com/#/full/accounts_changepassword)
- [Meteor.Accounts.resetPassword](http://docs.meteor.com/#/full/accounts_resetpassword)
