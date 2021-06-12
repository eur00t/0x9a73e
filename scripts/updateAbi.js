const fs = require("fs");
const path = require("path");

const { abi } = require("../build/contracts/CodeModules.json");

fs.writeFileSync(
  path.resolve(`${__dirname}/../client/code_modules_abi.json`),
  JSON.stringify({ abi }, null, 2)
);
