const fs = require("fs");
const path = require("path");

const dir = fs.readdirSync(
  path.resolve(`${__dirname}/../artifacts/build-info`)
);

const { input } = require(`../artifacts/build-info/${dir[0]}`);
const { networks } = require(`../build/contracts/CodeModulesRendering.json`);

input.settings.libraries = {
  "contracts/CodeModulesRendering.sol": {
    CodeModulesRendering: networks[process.argv[2]].address,
  },
};

fs.writeFileSync(path.resolve(process.argv[3]), JSON.stringify(input, null, 2));
