import type { PixiDevtools } from "../types";

// 定义属性配置的类型
interface PropertyConfig {
  obj: () => any;
  key: string;
}

// 定义属性映射的类型
interface PropertyMap {
  [key: string]: PropertyConfig;
}

// 定义观察者对象的类型
interface AttachedObserver {
  [key: string]: any;
}

export default function pixiDevtoolsEva() {
  let intervalId: number | null = null;
  let isProcessing = false;
  let isActive = false;

  function startEvaIntegration() {
    if (intervalId || isActive) {
      return; // 已经启动了
    }
    console.info("EVA.js 集成已启动");
    isActive = true;
    intervalId = window.setInterval(() => {
      if (isProcessing) {
        return;
      }
      isProcessing = true;

      try {
        const game = (globalThis as any).__EVA_GAME__;
        const Render = (globalThis as any).__EVA_RENDER__;
        if (!game) {
          return;
        }
        const renderSystem = game.getSystem("Renderer");
        (globalThis as any).__PIXI_APP__ = renderSystem.application;

        // 检查所有gameObject，创建 attachedObserver
        game.gameObjects.forEach((go: any) => {
          const container = renderSystem.containerManager.getContainer(go.id);
          if (!container) {
            return;
          }
          const observer = container.attachedObserver;
          if (observer) {
            return;
          }
          const newObserver: AttachedObserver = {};
          const transform = go.getComponent("Transform");
          container.attachedObserver = newObserver;

          const properties: PropertyMap = {
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
              get: (): any => {
                const obj = data.obj();
                return obj?.[data.key];
              },
              set: (v: any) => {
                const obj = data.obj();
                if (!obj) {
                  return;
                }
                obj[data.key] = v;
              },
            });
          });
        });
      } catch (error) {
        console.error("EVA 集成错误:", error);
      } finally {
        isProcessing = false;
      }
    }, 1000);
  }

  function stopEvaIntegration() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      isActive = false;
      console.info("EVA.js 集成已停止");
    }
  }

  function isEvaGameAvailable(): boolean {
    return !!(window as any).__EVA_GAME__;
  }

  function isRunning(): boolean {
    return isActive && intervalId !== null;
  }

  return {
    start: startEvaIntegration,
    stop: stopEvaIntegration,
    isAvailable: isEvaGameAvailable,
    isRunning,
  };
}
