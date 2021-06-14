require("dotenv").config();

const express = require("express");
const serveStatic = require("serve-static");

const { protectedRouter } = require("./protectedRouter");
const { tokensRouter } = require("./tokensRouter");

const app = express();

app.use(express.json());

app.use("/protected", protectedRouter);
app.use("/", tokensRouter);

app.use(`/`, serveStatic("dist"));
app.use(`/*`, serveStatic("dist/index.html"));

app.listen(process.env.WEB_APP_PORT);
