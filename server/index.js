require("dotenv").config();

const puppeteer = require("puppeteer");
const express = require("express");
const serveStatic = require("serve-static");
const app = express();

const { getContract } = require("./web3");
const { appUseWrapCache } = require("./cache");

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
const MAC_PUPPETEER_INSTANCES = 10;

appUseWrapCache(
  app,
  "png",
  "/network/:networkId/tokens/:id/image",
  async (req, res, next) => {
    if (puppeteerInstancesCount >= MAC_PUPPETEER_INSTANCES) {
      res.send(503, "Max capacity reached, please try again later");
      return;
    }

    try {
      const html = await req.contract.methods.getHtml(req.id).call();

      const browser = await puppeteer.launch({
        defaultViewport: { width: 350, height: 350 },
      });
      puppeteerInstancesCount += 1;
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
        name: `${invocation.module.name}#${invocation.tokenId}`,
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
