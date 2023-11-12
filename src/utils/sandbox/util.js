/* eslint-disable no-param-reassign */
/* eslint-disable no-prototype-builtins */

const naughtySafari =
  typeof document.all === "function" && typeof document.all === "undefined";
const callableFnCacheMap = new WeakMap();
export const isCallable = (fn) => {
  if (callableFnCacheMap.has(fn)) {
    return true;
  }

  const callable = naughtySafari
    ? typeof fn === "function" && typeof fn !== "undefined"
    : typeof fn === "function";
  if (callable) {
    callableFnCacheMap.set(fn, callable);
  }
  return callable;
};

let currentRunningApp = null;
/**
 * get the app that running tasks at current tick
 */
export function getCurrentRunningApp() {
  return currentRunningApp;
}
export function setCurrentRunningApp(appInstance) {
  currentRunningApp = appInstance;
}

const boundedMap = new WeakMap();
export function isBoundedFunction(fn) {
  if (boundedMap.has(fn)) {
    return boundedMap.get(fn);
  }
  /*
   indexOf is faster than startsWith
   see https://jsperf.com/string-startswith/72
   */
  const bounded =
    fn.name.indexOf("bound ") === 0 && !fn.hasOwnProperty("prototype");
  boundedMap.set(fn, bounded);
  return bounded;
}

const fnRegexCheckCacheMap = new WeakMap();
export function isConstructable(fn) {
  // prototype methods might be changed while code running, so we need check it every time
  const hasPrototypeMethods =
    fn.prototype &&
    fn.prototype.constructor === fn &&
    Object.getOwnPropertyNames(fn.prototype).length > 1;

  if (hasPrototypeMethods) return true;

  if (fnRegexCheckCacheMap.has(fn)) {
    return fnRegexCheckCacheMap.get(fn);
  }

  /*
    1. 有 prototype 并且 prototype 上有定义一系列非 constructor 属性
    2. 函数名大写开头
    3. class 函数
    满足其一则可认定为构造函数
   */
  let constructable = hasPrototypeMethods;
  if (!constructable) {
    // fn.toString has a significant performance overhead, if hasPrototypeMethods check not passed, we will check the function string with regex
    const fnString = fn.toString();
    const constructableFunctionRegex = /^function\b\s[A-Z].*/;
    const classRegex = /^class\b/;
    constructable =
      constructableFunctionRegex.test(fnString) || classRegex.test(fnString);
  }

  fnRegexCheckCacheMap.set(fn, constructable);
  return constructable;
}

const functionBoundedValueMap = new WeakMap();
export function getTargetValue(target, value) {
  if (
    isCallable(value) &&
    !isBoundedFunction(value) &&
    !isConstructable(value)
  ) {
    const cachedBoundFunction = functionBoundedValueMap.get(value);
    if (cachedBoundFunction) {
      return cachedBoundFunction;
    }
    const boundValue = Function.prototype.bind.call(value, target);
    // eslint-disable-next-line guard-for-in,no-restricted-syntax
    for (const key in value) {
      boundValue[key] = value[key];
    }
    if (
      value.hasOwnProperty("prototype") &&
      !boundValue.hasOwnProperty("prototype")
    ) {
      Object.defineProperty(boundValue, "prototype", {
        value: value.prototype,
        enumerable: false,
        writable: true,
      });
    }
    functionBoundedValueMap.set(value, boundValue);
    return boundValue;
  }
  return value;
}

const nextTick =
  typeof window.Zone === "function"
    ? setTimeout
    : (cb) => Promise.resolve().then(cb);

let globalTaskPending = false;
export function nextTask(cb) {
  if (!globalTaskPending) {
    globalTaskPending = true;
    nextTick(() => {
      cb();
      globalTaskPending = false;
    });
  }
}

export function uniq(array) {
  return array.filter(function filter(element) {
    return element in this ? false : (this[element] = true);
  }, Object.create(null));
}

export const nativeGlobal = new Function("return this")();

// zone.js will overwrite Object.defineProperty
const rawObjectDefineProperty = Object.defineProperty;

const variableWhiteListInDev =
  typeof process !== "undefined" && process?.env.NODE_ENV === "development" // || window.__QIANKUN_DEVELOPMENT__
    ? [
        // for react hot reload
        "__REACT_ERROR_OVERLAY_GLOBAL_HOOK__",
      ]
    : [];
export const variableWhiteList = [
  "System",
  "__cjsWrapper",
  ...variableWhiteListInDev,
];

/*
 variables who are impossible to be overwrite need to be escaped from proxy sandbox for performance reasons
 */
export const unscopables = {
  undefined: true,
  Array: true,
  Object: true,
  String: true,
  Boolean: true,
  Math: true,
  Number: true,
  Symbol: true,
  parseFloat: true,
  Float32Array: true,
};

export const useNativeWindowForBindingsProps = new Map([
  ["fetch", true],
  [
    "mockDomAPIInBlackList",
    typeof process !== "undefined" && process?.env.NODE_ENV === "test",
  ],
]);

export function createFakeWindow(globalContext) {
  const propertiesWithGetter = new Map();
  const fakeWindow = {};

  Object.getOwnPropertyNames(globalContext)
    .filter((p) => {
      const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
      return !descriptor?.configurable;
    })
    .forEach((p) => {
      const descriptor = Object.getOwnPropertyDescriptor(globalContext, p);
      if (descriptor) {
        const hasGetter = Object.prototype.hasOwnProperty.call(
          descriptor,
          "get"
        );

        if (
          p === "top" ||
          p === "parent" ||
          p === "self" ||
          p === "window" ||
          (typeof process !== "undefined" &&
            process?.env.NODE_ENV === "test" &&
            (p === "mockTop" || p === "mockSafariTop"))
        ) {
          descriptor.configurable = true;

          if (!hasGetter) {
            descriptor.writable = true;
          }
        }

        if (hasGetter) propertiesWithGetter.set(p, true);

        rawObjectDefineProperty(fakeWindow, p, Object.freeze(descriptor));
      }
    });

  return {
    fakeWindow,
    propertiesWithGetter,
  };
}
