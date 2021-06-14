const web3 = require("web3");
const crypto = require("crypto");
const express = require("express");
const { recoverPersonalSignature } = require("eth-sig-util");

const { featuredStorage } = require("./featuredStorage");

const { asciiToHex } = web3.utils;

const protectedRouter = express.Router();

let currentNonce;
const changeNonce = () => {
  currentNonce = crypto.randomBytes(16).toString("hex");
};
changeNonce();

const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

protectedRouter.use("/", (req, res, next) => {
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

protectedRouter.get("/nonce", (req, res) => {
  res.send({ nonce: currentNonce });
});

protectedRouter.get("/featured", (req, res) => {
  res.send(featuredStorage.getAll());
});

protectedRouter.post("/featured", (req, res) => {
  const { moduleName } = req.body;

  if (!moduleName) {
    res.status(400).send({ error: "Wrong input" });
    return;
  }

  featuredStorage.add(moduleName);
  res.send({ status: "OK" });
});

protectedRouter.get("/featured/:moduleName", (req, res) => {
  let { moduleName } = req.params;

  if (featuredStorage.has(moduleName)) {
    res.send({ status: "OK" });
    return;
  } else {
    res.status(404).send({ error: `Module "${moduleName}" was not featured` });
    return;
  }
});

protectedRouter.delete("/featured/:moduleName", (req, res) => {
  let { moduleName } = req.params;

  featuredStorage.remove(moduleName);
  res.send({ status: "OK" });
});

module.exports = { protectedRouter };
