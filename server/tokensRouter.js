const web3 = require("web3");
const path = require("path");
const fsPromises = require("fs/promises");
const puppeteer = require("puppeteer");
const express = require("express");

const { getContract } = require("./web3");
const { useWrapCache } = require("./cache");
const { featuredStorage } = require("./featuredStorage");

const { hexToAscii } = web3.utils;

const tokensRouter = express.Router();

tokensRouter.use("/network/:networkId", (req, res, next) => {
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

tokensRouter.use("/network/:networkId/tokens/:id", (req, res, next) => {
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

useWrapCache(
  tokensRouter,
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

      if (
        !featuredStorage.has(req.networkId, hexToAsciiWithTrim(module.name))
      ) {
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

useWrapCache(
  tokensRouter,
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

useWrapCache(
  tokensRouter,
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

module.exports = {
  tokensRouter,
};
