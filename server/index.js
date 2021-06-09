require("dotenv").config();

const express = require("express");
const serveStatic = require("serve-static");

var app = express();

app.use(`/`, serveStatic("dist"));
app.use(`/*`, serveStatic("dist/index.html"));

app.listen(process.env.WEB_APP_PORT);
