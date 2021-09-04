const fs = require("fs");
const path = require("path");

const storageDirName = path.resolve(`${__dirname}/../node-storage`);

try {
  fs.mkdirSync(storageDirName);
} catch {}

const getWhitelistedFileName = (networkId, moduleName) =>
  path.resolve(
    `${storageDirName}/whitelisted-${networkId.toString()}-${moduleName}`
  );

const extractWhitelistedModuleName = (fileName) => {
  const match = fileName.match(/^whitelisted-(.*?)-(.*?)$/);

  if (!match) {
    return;
  }

  const [, networkId, moduleName] = match;

  return [parseInt(networkId, 10), moduleName];
};

const addToCache = (cache, networkId, moduleName) => {
  if (!cache.has(networkId)) {
    cache.set(networkId, []);
  }

  cache.get(networkId).push(moduleName);

  return cache;
};

const removeFromCache = (cache, networkId, moduleNameRemove) => {
  if (!cache.has(networkId)) {
    return cache;
  }

  cache.set(
    networkId,
    cache.get(networkId).filter((moduleName) => moduleName !== moduleNameRemove)
  );

  return cache;
};

const init = () => {
  const whitelisted = fs
    .readdirSync(storageDirName)
    .map((fileName) => extractWhitelistedModuleName(fileName))
    .filter((val) => val !== undefined)
    .filter(([, moduleName]) => moduleName !== undefined)
    .reduce(
      (res, [networkId, moduleName]) => addToCache(res, networkId, moduleName),
      new Map()
    );
  return whitelisted;
};

let cacheWhitelisted = init();

const whitelistedStorage = {
  getAll(networkId) {
    return cacheWhitelisted.get(networkId) || [];
  },
  add(networkId, moduleName) {
    fs.writeFileSync(getWhitelistedFileName(networkId, moduleName), "");
    addToCache(cacheWhitelisted, networkId, moduleName);
  },
  remove(networkId, moduleNameRemove) {
    fs.unlinkSync(getWhitelistedFileName(networkId, moduleNameRemove));
    removeFromCache(cacheWhitelisted, networkId, moduleNameRemove);
  },
  has(networkId, moduleNameCheck) {
    return (
      cacheWhitelisted.has(networkId) &&
      cacheWhitelisted
        .get(networkId)
        .some((moduleName) => moduleName === moduleNameCheck)
    );
  },
};

module.exports = { whitelistedStorage };
