const fs = require("fs");
const path = require("path");

const storageDirName = path.resolve(`${__dirname}/../node-storage`);

try {
  fs.mkdirSync(storageDirName);
} catch {}

const getFeaturedFileName = (networkId, moduleName) =>
  path.resolve(
    `${storageDirName}/featured-${networkId.toString()}-${moduleName}`
  );

const extractFeaturedModuleName = (fileName) => {
  const match = fileName.match(/^featured-(.*?)-(.*?)$/);

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
  const featured = fs
    .readdirSync(storageDirName)
    .map((fileName) => extractFeaturedModuleName(fileName))
    .filter(([, moduleName]) => moduleName !== undefined)
    .reduce(
      (res, [networkId, moduleName]) => addToCache(res, networkId, moduleName),
      new Map()
    );
  return featured;
};

let cacheFeatured = init();

const featuredStorage = {
  getAll(networkId) {
    return cacheFeatured.get(networkId) || [];
  },
  add(networkId, moduleName) {
    fs.writeFileSync(getFeaturedFileName(networkId, moduleName), "");
    addToCache(cacheFeatured, networkId, moduleName);
  },
  remove(networkId, moduleNameRemove) {
    fs.unlinkSync(getFeaturedFileName(networkId, moduleNameRemove));
    removeFromCache(cacheFeatured, networkId, moduleNameRemove);
  },
  has(networkId, moduleNameCheck) {
    return (
      cacheFeatured.has(networkId) &&
      cacheFeatured
        .get(networkId)
        .some((moduleName) => moduleName === moduleNameCheck)
    );
  },
};

module.exports = { featuredStorage };
