# Checks and fixtures

Run these commands from the repository root. The application modules stay at the root; this folder contains the test harnesses and fixtures.

Dependency-free engine and server checks:

```sh
node tests/check-engine.cjs
node tests/check-volume-engine.cjs
node tests/check-generation.mjs
node tests/check-connection.mjs
node tests/check-parts.cjs
```

Canvas and DOM checks need the development-only packages `@napi-rs/canvas` and `sharp`:

```sh
npm install --no-save @napi-rs/canvas sharp
node tests/check-app.cjs
node tests/check-creator.cjs
node tests/check-parts-ui.cjs
```

The checks may write SVG and PNG review artifacts alongside the scripts in this folder. `fixtures/test-subjects.json` contains generated subject scenes shared by checks; `check-generation.mjs` refreshes that fixture.
