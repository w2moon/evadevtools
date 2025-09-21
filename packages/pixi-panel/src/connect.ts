import type { Readable } from "svelte/store";
import { derived, writable } from "svelte/store";
import type { BridgeFn } from "./types";
import { poll } from "./bridge-fns";
import pixiDevtools from "./pixi-devtools/pixiDevtools";
import pixiDevtoolsClickToSelect from "./pixi-devtools/pixiDevtoolsClickToSelect";
import pixiDevtoolsOutline from "./pixi-devtools/pixiDevtoolsOutline";
import pixiDevtoolsOverlay from "./pixi-devtools/pixiDevtoolsOverlay";
import pixiDevtoolsProperties from "./pixi-devtools/pixiDevtoolsProperties";
import pixiDevtoolsSelection from "./pixi-devtools/pixiDevtoolsSelection";
import pixiDevtoolsViewport from "./pixi-devtools/pixiDevtoolsViewport";

function detect() {
  (function evaDetect() {
    const game = globalThis.__EVA_GAME__;
    const Render = globalThis.__EVA_RENDER__;
    if (!game) {
      return;
    }
    const renderSystem = game.getSystem("Renderer");
    globalThis.__PIXI_APP__ = renderSystem.application;

    Object.defineProperty(renderSystem.application.ticker, "speed", {
      get: () => game.ticker.timeline.playbackRate,
      set: (v) => {
        game.ticker.timeline.playbackRate = v;
      },
    });

    // 检查所有gameObject，改写observer
    game.gameObjects.forEach((go) => {
      const container = renderSystem.containerManager.getContainer(go.id);
      if (!container) {
        return;
      }
      const observer = container.attachedObserver;
      if (observer) {
        return;
      }

      const newObserver = {};
      const transform = go.getComponent("Transform");
      container.attachedObserver = newObserver;

      container.setOrigin = function (x: number, y: number) {
        transform.origin.x = x;
        transform.origin.y = y;
      };
      Object.defineProperties(container, {
        anchor: {
          get: () => transform.anchor,
          set: (v) => {
            transform.anchor = v;
          },
        },
        anchorX: {
          get: () => transform.anchor.x,
          set: (v) => {
            transform.anchor.x = v;
          },
        },
        anchorY: {
          get: () => transform.anchor.y,
          set: (v) => {
            transform.anchor.y = v;
          },
        },
        origin: {
          get: () => transform.origin,
          set: (v) => {
            transform.origin = v;
          },
        },
        originX: {
          get: () => transform.origin.x,
          set: (v) => {
            transform.origin.x = v;
          },
        },
        originY: {
          get: () => transform.origin.y,
          set: (v) => {
            transform.origin.y = v;
          },
        },
      });
      const properties = {
        x: {
          obj: () => transform.position,
          key: "x",
        },
        y: {
          obj: () => transform.position,
          key: "y",
        },
        angle: {
          obj: () => transform,
          key: "rotation",
        },
        scaleX: {
          obj: () => transform.scale,
          key: "x",
        },
        scaleY: {
          obj: () => transform.scale,
          key: "y",
        },
        anchorX: {
          obj: () => transform.anchor,
          key: "x",
        },
        anchorY: {
          obj: () => transform.anchor,
          key: "y",
        },
        originX: {
          obj: () => transform.origin,
          key: "x",
        },
        originY: {
          obj: () => transform.origin,
          key: "y",
        },
        skewX: {
          obj: () => transform.skew,
          key: "y",
        },
        skewY: {
          obj: () => transform.skew,
          key: "y",
        },
        width: {
          obj: () => transform.size,
          key: "width",
        },
        height: {
          obj: () => transform.size,
          key: "height",
        },
        style: {
          obj: () => go.getComponent("Text"),
          key: "style",
        },
        alpha: {
          obj: () => {
            const render = go.getComponent("Render");
            if (render) {
              return render;
            }
            return go.addComponent(Render);
          },
          key: "alpha",
        },
        visible: {
          obj: () => {
            const render = go.getComponent("Render");
            if (render) {
              return render;
            }
            return go.addComponent(Render);
          },
          key: "visible",
        },
        sortableChildren: {
          obj: () => {
            const render = go.getComponent("Render");
            if (render) {
              return render;
            }
            return go.addComponent(Render);
          },
          key: "sortableChildren",
        },
        zIndex: {
          obj: () => {
            const render = go.getComponent("Render");
            if (render) {
              return render;
            }
            return go.addComponent(Render);
          },
          key: "zIndex",
        },
        text: {
          obj: () => {
            return go.getComponent("Text");
          },
          key: "text",
        },
      };
      Object.keys(properties).forEach((key) => {
        const data = properties[key];
        Object.defineProperty(newObserver, key, {
          get: () => {
            return data.obj()?.[key];
          },
          set: (v) => {
            const obj = data.obj();
            if (!obj) {
              return;
            }
            obj[data.key] = v;
          },
        });
      });
    });
  })();
  const win = window as any;
  function hasGlobal(varname: string) {
    if (win[varname]) {
      return true;
    }
    if (win.frames) {
      for (let i = 0; i < win.frames.length; i += 1) {
        try {
          if (win.frames[i][varname]) {
            return true;
          }
        } catch {
          // access to iframe was denied
        }
      }
    }
    return false;
  }
  const detected =
    hasGlobal("__PIXI_APP__") ||
    hasGlobal("__PHASER_GAME__") ||
    hasGlobal("__PIXI_STAGE__") ||
    hasGlobal("__PIXI_RENDERER__") ||
    hasGlobal("__PATCHED_RENDERER__");

  if (win.__PIXI_INSPECTOR__ !== undefined) {
    if (detected) {
      return "CONNECTED";
    }
    if (hasGlobal("PIXI")) {
      return "PATCHABLE";
    }
    return "DISCONNECTED";
  }
  if (detected) {
    return "INJECT";
  }
  if (hasGlobal("PIXI")) {
    return "PATCHABLE";
  }
  return "NOT_FOUND";
}

export default function connect(bridge: BridgeFn): Readable<
  "NOT_FOUND" | "INJECT" | "CONNECTED" | "DISCONNECTED" | "PATCHABLE" | "ERROR"
> & {
  error: Readable<Error | undefined>;
  retry: () => void;
} {
  const detected = poll<ReturnType<typeof detect>>(
    bridge,
    `(${detect.toString()}())`,

    2500,
  );
  const errorStore = writable<Error | undefined>();
  const readable = derived(detected, ({ data, error }) => {
    if (error || typeof data === "undefined") {
      const message = error?.message;
      if (typeof message === "string" && message.endsWith(": %s")) {
        errorStore.set(new Error(message.substring(0, message.length - 4)));
      } else if (typeof error !== "undefined") {
        console.warn(error);
        errorStore.set(error);
      }
      return "ERROR";
    }
    if (data === "INJECT") {
      bridge(`(() => {
        window.__PIXI_INSPECTOR__ = (${pixiDevtools.toString()}());
        window.__PIXI_INSPECTOR__.selection = (${pixiDevtoolsSelection.toString()}(window.__PIXI_INSPECTOR__));
        window.__PIXI_INSPECTOR__.viewport = (${pixiDevtoolsViewport.toString()}(window.__PIXI_INSPECTOR__));
        window.__PIXI_INSPECTOR__.outline = (${pixiDevtoolsOutline.toString()}(window.__PIXI_INSPECTOR__));
        window.__PIXI_INSPECTOR__.overlay = (${pixiDevtoolsOverlay.toString()}(window.__PIXI_INSPECTOR__));
        window.__PIXI_INSPECTOR__.properties = (${pixiDevtoolsProperties.toString()}(window.__PIXI_INSPECTOR__));
        window.__PIXI_INSPECTOR__.clickToSelect = (${pixiDevtoolsClickToSelect.toString()}(window.__PIXI_INSPECTOR__));
      })();`).then(() => detected.sync());
    }

    return data;
  });
  return {
    subscribe: readable.subscribe,
    error: { subscribe: errorStore.subscribe },
    retry() {
      console.log("retry!!!!");
      detected.sync();
    },
  };
}
