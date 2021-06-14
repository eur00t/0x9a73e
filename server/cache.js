const fsPromises = require("fs/promises");
const path = require("path");

const getCacheDirName = () => {
  return `${__dirname}/../nft-cache`;
};

let initCacheDir = async () => {
  const cacheDirName = getCacheDirName();

  try {
    await fsPromises.mkdir(cacheDirName);
  } catch {}

  initCacheDir = () => {};
};

const getCacheFileName = (networkId, tokenId, ext) => {
  return path.resolve(`${getCacheDirName()}/${networkId}-${tokenId}.${ext}`);
};

const setContentType = (ext, res) => {
  switch (ext) {
    case "html":
      res.set("Content-Type", "text/html");
      break;
    case "json":
      res.set("Content-Type", "application/json");
      break;
    case "png":
      res.set("Content-Type", "image/png");
      break;
  }
};

const readCache = (ext) => async (req, res, next) => {
  await initCacheDir();

  const cacheFileName = getCacheFileName(req.networkId, req.id, ext);

  try {
    await fsPromises.stat(cacheFileName);
  } catch (e) {
    next();
    return;
  }

  let httpContent;
  switch (ext) {
    case "html":
      httpContent = await fsPromises.readFile(cacheFileName, "utf-8");
      break;
    case "json":
      httpContent = JSON.parse(
        await fsPromises.readFile(cacheFileName, "utf-8")
      );
    case "png":
      httpContent = await fsPromises.readFile(cacheFileName);
      break;
  }

  setContentType(ext, res);

  res.send(httpContent);
};

const writeCache = (ext) => async (req, res, next) => {
  const cacheFileName = getCacheFileName(req.networkId, req.id, ext);

  let fileContent;
  switch (ext) {
    case "html":
    case "png":
      fileContent = req.content;
      break;
    case "json":
      fileContent = JSON.stringify(req.content);
      break;
  }

  await fsPromises.writeFile(cacheFileName, fileContent);

  next();
};

const invalidateCache = (ext) => async (req, res, next) => {
  const cacheFileName = getCacheFileName(req.networkId, req.id, ext);

  try {
    await fsPromises.stat(cacheFileName);
  } catch (e) {
    res.send("Not in cache");
    return;
  }

  await fsPromises.unlink(cacheFileName);
  res.send("Done");
};

const writeResponse = (ext) => (req, res) => {
  setContentType(ext, res);

  res.send(req.content);
};

const useWrapCache = (app, ext, url, route) => {
  app.use(`${url}/invalidate`, invalidateCache(ext));
  app.use(url, readCache(ext));
  app.use(url, route);
  app.use(url, writeCache(ext));
  app.use(url, writeResponse(ext));
};

module.exports = {
  useWrapCache,
};
