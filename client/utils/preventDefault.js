export const preventDefault =
  (func) =>
  (e, ...args) => {
    e.preventDefault();
    func(...args);
  };
