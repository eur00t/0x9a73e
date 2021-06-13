require("dotenv").config();

const web3 = require("web3");
const crypto = require("crypto");
const path = require("path");
const fsPromises = require("fs/promises");
const puppeteer = require("puppeteer");
const express = require("express");
const serveStatic = require("serve-static");
const { recoverPersonalSignature } = require("eth-sig-util");
const app = express();

const { getContract } = require("./web3");
const { appUseWrapCache } = require("./cache");
const { featuredStorage } = require("./featuredStorage");

const { asciiToHex, hexToAscii } = web3.utils;

app.use(express.json());

let currentNonce;
const changeNonce = () => {
  currentNonce = crypto.randomBytes(16).toString("hex");
};
changeNonce();

const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

app.use("/protected", (req, res, next) => {
  if (req.method === "GET") {
    next();
    return;
  }

  const { signature } = req.body;
  if (!signature) {
    res.status(401).send({
      error: "Signature is missing",
    });
    return;
  }

  const address = recoverPersonalSignature({
    data: asciiToHex(JSON.stringify({ nonce: currentNonce })),
    sig: signature,
  });

  if (address !== ADMIN_ADDRESS) {
    res.status(403).send({
      error: `Address ${address} is not allowed to perform this action`,
    });
    return;
  }

  req.changeNonce = changeNonce;
  changeNonce();

  next();
});

app.get("/protected/nonce", (req, res) => {
  res.send({ nonce: currentNonce });
});

app.get("/protected/featured", (req, res) => {
  res.send(featuredStorage.getAll());
});

app.post("/protected/featured", (req, res) => {
  const { moduleName } = req.body;

  if (!moduleName) {
    res.status(400).send({ error: "Wrong input" });
    return;
  }

  featuredStorage.add(moduleName);
  res.send({ status: "OK" });
});

app.get("/protected/featured/:moduleName", (req, res) => {
  let { moduleName } = req.params;

  if (featuredStorage.has(moduleName)) {
    res.send({ status: "OK" });
    return;
  } else {
    res.status(404).send({ error: `Module "${moduleName}" was not featured` });
    return;
  }
});

app.delete("/protected/featured/:moduleName", (req, res) => {
  let { moduleName } = req.params;

  featuredStorage.remove(moduleName);
  res.send({ status: "OK" });
});

app.use("/network/:networkId", (req, res, next) => {
  let { networkId } = req.params;

  networkId = parseInt(networkId, 10);

  const contract = getContract(networkId);

  if (!contract) {
    res.status(404).send("Network is not available");
    return;
  }

  req.contract = contract;
  req.networkId = networkId;
  next();
});

app.use("/network/:networkId/tokens/:id", (req, res, next) => {
  let { id } = req.params;

  id = parseInt(id, 10);

  req.id = id;

  next();
});

let puppeteerInstancesCount = 0;
const MAX_PUPPETEER_INSTANCES = JSON.parse(
  process.env.MAX_PUPPETEER_INSTANCES,
  10
);

appUseWrapCache(
  app,
  "png",
  "/network/:networkId/tokens/:id/image",
  async (req, res, next) => {
    if (puppeteerInstancesCount >= MAX_PUPPETEER_INSTANCES) {
      res.send(503, "Max capacity reached, please try again later");
      return;
    }

    puppeteerInstancesCount += 1;

    try {
      const { module } = await req.contract.methods
        .getInvocation(req.id)
        .call();

      if (!featuredStorage.has(hexToAsciiWithTrim(module.name))) {
        req.content = await fsPromises.readFile(
          path.resolve(`${__dirname}/../images/non-featured.png`)
        );
        next();
        return;
      }

      const html = await req.contract.methods.getHtml(req.id).call();

      const browser = await puppeteer.launch({
        defaultViewport: { width: 350, height: 350 },
      });

      const page = await browser.newPage();
      await page.setContent(html);

      const image = await page.screenshot();
      await browser.close();
      puppeteerInstancesCount -= 1;

      req.content = image;

      next();
    } catch {
      res.status(404).send("Token does not exist");
    }
  }
);

appUseWrapCache(
  app,
  "html",
  "/network/:networkId/tokens/:id/render",
  async (req, res, next) => {
    try {
      const html = await req.contract.methods.getHtml(req.id).call();
      req.content = html;
      next();
    } catch {
      res.status(404).send("Token does not exist");
    }
  }
);

const hexToAsciiWithTrim = (hex) => {
  return hexToAscii(hex).replace(/(\0)+$/, "");
};

appUseWrapCache(
  app,
  "json",
  "/network/:networkId/tokens/:id",
  async (req, res, next) => {
    try {
      const invocation = await req.contract.methods
        .getInvocation(req.id)
        .call();

      req.content = {
        name: `${hexToAsciiWithTrim(invocation.module.name)}@${
          invocation.tokenId
        }`,
        description: JSON.parse(invocation.module.metadataJSON).description,
        image: `${process.env.WEB_URL_ROOT}/network/${req.networkId}/tokens/${req.id}/image`,
        external_url: `${process.env.WEB_URL_ROOT}/modules/invocation/${req.id}`,
        animation_url: `${process.env.WEB_URL_ROOT}/network/${req.networkId}/tokens/${req.id}/render`,
      };
      next();
    } catch {
      res.status(404).send("Token does not exist");
    }
  }
);

app.use(`/`, serveStatic("dist"));
app.use(`/*`, serveStatic("dist/index.html"));

app.listen(process.env.WEB_APP_PORT);
