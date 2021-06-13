const { cancelable, CancelablePromise } = require("cancelable-promise");

export const wrapFuncCancelable =
  (func) =>
  (...args) =>
    cancelable(Promise.resolve(func(...args)));
