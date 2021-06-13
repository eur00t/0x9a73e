const fs = require("fs");
const path = require("path");

const storageDirName = path.resolve(`${__dirname}/../node-storage`);

try {
  fs.mkdirSync(storageDirName);
} catch {}

const getFeaturedFileName = (moduleName) =>
  path.resolve(`${storageDirName}/featured-${moduleName}`);

const extractFeaturedModuleName = (fileName) => {
  const match = fileName.match(/^featured-(.*)$/);

  if (!match) {
    return;
  }

  const [, moduleName] = match;

  return moduleName;
};

const readAll = () => {
  const featured = fs
    .readdirSync(storageDirName)
    .map((fileName) => extractFeaturedModuleName(fileName))
    .filter((moduleName) => moduleName !== undefined);
  return featured;
};

let cachedFeatured = readAll();

const featuredStorage = {
  getAll() {
    return cachedFeatured;
  },
  add(moduleName) {
    fs.writeFileSync(getFeaturedFileName(moduleName), "");
    cachedFeatured.push(moduleName);
  },
  remove(moduleNameRemove) {
    fs.unlinkSync(getFeaturedFileName(moduleNameRemove));
    cachedFeatured = cachedFeatured.filter(
      (moduleName) => moduleName !== moduleNameRemove
    );
  },
  has(moduleNameCheck) {
    return cachedFeatured.some((moduleName) => moduleName === moduleNameCheck);
  },
};

module.exports = { featuredStorage };
