# Copilot Instructions for upm-meteor-react-js

## Project Overview
- This package connects React apps to Meteor servers, supporting accounts, reactivity, and MongoDB collections.
- Core entry: `src/Meteor.js` (exports Meteor API, hooks, and utilities).
- Data flow: DDP protocol via `src/lib/ddp.js` (WebSocket), with local cache in Minimongo (`src/Data.js`).
- Collections: Use `Meteor.Mongo.Collection` (see `src/Collection.js`). Bulk operations (`updateMany`, `bulkUpdate`) have automatic fallback if server methods are missing.
- Hooks: `useTracker`, `usePublication`, `useMethod` in `src/components/` for React integration.

## Key Patterns & Conventions
- **Bulk Operations**: Prefer `updateMany` or `bulkUpdate` for multi-document updates. If server methods are missing, falls back to individual `update` calls (see `README.md`, `NO-SERVER-CHANGES-GUIDE.md`).
- **Method Calls**: Use `Meteor.call` or collection methods. The system tries multiple method name patterns for compatibility (see `Collection.js:testAvailableMethods`).
- **Subscriptions**: Use `Meteor.subscribe` or `usePublication` for reactive data.
- **Testing**: Tests in `test/` use Jest and mock DDP/WebSocket. See `test/setup.js` for environment setup.
- **Debugging**: Enable verbose logging with `Meteor.enableVerbose()`. Use `Collection.testAvailableMethods()` to probe server method support.
- **No Server Changes**: Designed to work with existing Meteor backends (see `NO-SERVER-CHANGES-GUIDE.md`).

## Developer Workflows
- **Build**: `npm run prepare` (see `README.md`).
- **Transpile**: `npx babel src --out-dir dist`
- **TypeScript types**: `npx copyfiles src/index.d.ts dist --up 1`
- **Test**: `npm test` (Jest)

## Integration Points
- Expects a Meteor DDP server (WebSocket endpoint, e.g., `/websocket`).
- Uses `@meteorrn/minimongo` for local data cache.
- React hooks and HOCs for data binding.

## Examples
- See `examples/` for usage patterns, including fallback and bulk update strategies.
- See `NO-SERVER-CHANGES-GUIDE.md` for migration and troubleshooting.

## File References
- `src/Meteor.js`: Main API
- `src/Collection.js`: Collection logic, bulk/fallback
- `src/lib/ddp.js`: DDP/WebSocket transport
- `src/components/`: React hooks
- `test/`: Jest tests, mocks
- `README.md`, `NO-SERVER-CHANGES-GUIDE.md`: Usage, migration, troubleshooting

---
For new features, follow the fallback and method pattern conventions to maximize compatibility. Prefer hooks for new React code. See `README.md` and `NO-SERVER-CHANGES-GUIDE.md` for up-to-date usage and migration details.
