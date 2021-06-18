const LOCAL_STORAGE_KEY = "edit-module-persistence";

const getStorageKey = (moduleName) => `${LOCAL_STORAGE_KEY}-${moduleName}`;

export const editModulePersistence = {
  read(moduleName) {
    const storedValue = localStorage.getItem(getStorageKey(moduleName));

    return storedValue ? JSON.parse(storedValue) : null;
  },

  write(moduleName, value) {
    localStorage.setItem(getStorageKey(moduleName), JSON.stringify(value));
  },

  remove(moduleName) {
    localStorage.removeItem(getStorageKey(moduleName));
  },
};
