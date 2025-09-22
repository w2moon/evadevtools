# EvaJS Devtools

Browser extension to debug games and apps written with [EvaJS](https://github.com/eva-engine/eva.js).

## Features

- Show the scene graph
- View and edit properties
- Double-click in the outliner to console.log a node
- Outline the active node in the viewport.
- The active node is available in the developer console as `$pixi`
- Right-click (or alt click) in the viewport to activate a node

## Usage

### EvaJS

In _your code_ find where the `Game` instance is created, it looks like this:

```js
import { Game } from "@eva/eva.js";

const game = new Game(...)
```

Expose that `game` to the **EvaJS Devtools** by adding the line:

```js
globalThis.__EVA_GAME__ = game;
```

or depending on your TypeScript and ESLint configuration:

```ts
(globalThis as any).__EVA_GAME__ = game; // eslint-disable-line
```

### Phaser

In _your code_ find where the `Phaser.Game` instance is created, it looks like this:

```js
import Phaser from "phaser";

const game = Phaser.Game(...)
```

Expose that `game` to the **EvaJS Devtools** by adding the line:

```js
globalThis.__PHASER_GAME__ = game;
```

## Custom setup?

If you don't use a `Game` or `Phaser.Game`?
you can specify the root-node manually with:

```js
globalThis.__EVA_SCENE__ = yourScene;
```

And to enable highlighting and selecting the nodes in the viewport add:

```js
globalThis.__EVA_RENDERER__ = yourRender;
```
