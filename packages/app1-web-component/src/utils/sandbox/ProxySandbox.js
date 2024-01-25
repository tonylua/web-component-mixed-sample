/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */
// 修改自 qiankun/src/sandbox/proxySandbox.ts
import {
  setCurrentRunningApp,
  nextTask,
  getTargetValue,
  uniq,
  createFakeWindow,
  useNativeWindowForBindingsProps,
  unscopables,
  variableWhiteList,
  nativeGlobal,
} from "./util.js";

let activeSandboxCount = 0;

/**
 * @enum
 */
const SandBoxType = {
  Proxy: "Proxy",
  Snapshot: "Snapshot",
};

/**
 * @typedef {(string | number | symbol)} PropertyKey
 */

/**
 * @typedef SandBox
 * @property {string} name - 沙箱的名字
 * @property {SandBoxType} type - 沙箱的类型
 * @property {WindowProxy} proxy - 沙箱导出的代理实体
 * @property {boolean} sandboxRunning - 沙箱是否在运行中
 * @property {PropertyKey} [latestSetProp] - latest set property
 * @property {Function} active - 启动沙箱
 * @property {Function} inactive - 关闭沙箱
 */

/**
 * 基于 Proxy 实现的沙箱
 * @class ProxySandbox
 * @implements {SandBox}
 */
class ProxySandbox {
  updatedValueSet = new Set();
  name;
  type;
  proxy;
  globalContext;
  sandboxRunning = true;
  latestSetProp = null;

  registerRunningApp(name, proxy) {
    if (this.sandboxRunning) {
      setCurrentRunningApp({ name, window: proxy });
      nextTask(() => {
        setCurrentRunningApp(null);
      });
    }
  }

  active() {
    if (!this.sandboxRunning) activeSandboxCount++;
    this.sandboxRunning = true;
  }

  inactive() {
    if (
      typeof process !== "undefined" &&
      process?.env.NODE_ENV === "development"
    ) {
      console.info(
        `[sandbox] ${this.name} modified global properties restore...`,
        [...this.updatedValueSet.keys()]
      );
    }

    if (--activeSandboxCount === 0) {
      variableWhiteList.forEach((p) => {
        if (this.proxy.hasOwnProperty(p)) {
          // @ts-ignore
          delete this.globalContext[p];
        }
      });
    }

    this.sandboxRunning = false;
  }

  constructor(name, globalContext = window) {
    this.name = name;
    this.globalContext = globalContext;
    this.type = SandBoxType.Proxy;
    const { updatedValueSet } = this;

    const { fakeWindow, propertiesWithGetter } =
      createFakeWindow(globalContext);

    const descriptorTargetMap = new Map();
    const hasOwnProperty = (key) =>
      fakeWindow.hasOwnProperty(key) || globalContext.hasOwnProperty(key);

    const proxy = new Proxy(fakeWindow, {
      set: (target, p, value) => {
        if (this.sandboxRunning) {
          this.registerRunningApp(name, proxy);
          // We must kept its description while the property existed in globalContext before
          if (!target.hasOwnProperty(p) && globalContext.hasOwnProperty(p)) {
            const descriptor = Object.getOwnPropertyDescriptor(
              globalContext,
              p
            );
            const { writable, configurable, enumerable } = descriptor;
            if (writable) {
              Object.defineProperty(target, p, {
                configurable,
                enumerable,
                writable,
                value,
              });
            }
          } else {
            // @ts-ignore
            target[p] = value;
          }

          if (variableWhiteList.indexOf(p) !== -1) {
            // @ts-ignore
            globalContext[p] = value;
          }

          updatedValueSet.add(p);

          this.latestSetProp = p;

          return true;
        }

        if (
          typeof process !== "undefined" &&
          process.env.NODE_ENV === "development"
        ) {
          console.warn(
            `[sandbox] Set window.${p.toString()} while sandbox destroyed or inactive in ${name}!`
          );
        }

        // 在 strict-mode 下，Proxy 的 handler.set 返回 false 会抛出 TypeError，在沙箱卸载的情况下应该忽略错误
        return true;
      },

      get: (target, p) => {
        this.registerRunningApp(name, proxy);

        if (p === Symbol.unscopables) return unscopables;
        // avoid who using window.window or window.self to escape the sandbox environment to touch the really window
        // see https://github.com/eligrey/FileSaver.js/blob/master/src/FileSaver.js#L13
        if (p === "window" || p === "self") {
          return proxy;
        }

        // hijack globalWindow accessing with globalThis keyword
        if (p === "globalThis") {
          return proxy;
        }

        if (
          p === "top" ||
          p === "parent" ||
          (typeof process !== "undefined" &&
            process.env.NODE_ENV === "test" &&
            (p === "mockTop" || p === "mockSafariTop"))
        ) {
          // if your master app in an iframe context, allow these props escape the sandbox
          if (globalContext === globalContext.parent) {
            return proxy;
          }
          return globalContext[p];
        }

        // proxy.hasOwnProperty would invoke getter firstly, then its value represented as globalContext.hasOwnProperty
        if (p === "hasOwnProperty") {
          return hasOwnProperty;
        }

        if (p === "document") {
          return document;
        }

        if (p === "eval") {
          return eval;
        }

        const value = propertiesWithGetter.has(p)
          ? globalContext[p]
          : p in target
          ? target[p]
          : globalContext[p];
        /* Some dom api must be bound to native window, otherwise it would cause exception like 'TypeError: Failed to execute 'fetch' on 'Window': Illegal invocation'
           See this code:
             const proxy = new Proxy(window, {});
             const proxyFetch = fetch.bind(proxy);
             proxyFetch('https://qiankun.com');
        */
        const boundTarget = useNativeWindowForBindingsProps.get(p)
          ? nativeGlobal
          : globalContext;
        return getTargetValue(boundTarget, value);
      },

      // trap in operator
      // see https://github.com/styled-components/styled-components/blob/master/packages/styled-components/src/constants.js#L12
      has(target, p) {
        return p in unscopables || p in target || p in globalContext;
      },

      getOwnPropertyDescriptor(target, p) {
        /*
         as the descriptor of top/self/window/mockTop in raw window are configurable but not in proxy target, we need to get it from target to avoid TypeError
         see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy/handler/getOwnPropertyDescriptor
         > A property cannot be reported as non-configurable, if it does not exists as an own property of the target object or if it exists as a configurable own property of the target object.
         */
        if (target.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(target, p);
          descriptorTargetMap.set(p, "target");
          return descriptor;
        }

        if (globalContext.hasOwnProperty(p)) {
          const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
          descriptorTargetMap.set(p, "globalContext");
          // A property cannot be reported as non-configurable, if it does not exists as an own property of the target object
          if (descriptor && !descriptor.configurable) {
            descriptor.configurable = true;
          }
          return descriptor;
        }

        return undefined;
      },

      // trap to support iterator with sandbox
      ownKeys(target) {
        return uniq(
          Reflect.ownKeys(globalContext).concat(Reflect.ownKeys(target))
        );
      },

      defineProperty(target, p, attributes) {
        const from = descriptorTargetMap.get(p);
        /*
         Descriptor must be defined to native window while it comes from native window via Object.getOwnPropertyDescriptor(window, p),
         otherwise it would cause a TypeError with illegal invocation.
         */
        switch (from) {
          case "globalContext":
            return Reflect.defineProperty(globalContext, p, attributes);
          default:
            return Reflect.defineProperty(target, p, attributes);
        }
      },

      deleteProperty: (target, p) => {
        this.registerRunningApp(name, proxy);
        if (target.hasOwnProperty(p)) {
          // @ts-ignore
          delete target[p];
          updatedValueSet.delete(p);

          return true;
        }

        return true;
      },

      // makes sure `window instanceof Window` returns truthy in micro app
      getPrototypeOf() {
        return Reflect.getPrototypeOf(globalContext);
      },
    });

    this.proxy = proxy;

    activeSandboxCount++;
  }
}

window.ProxySandbox = ProxySandbox;
export default ProxySandbox;
