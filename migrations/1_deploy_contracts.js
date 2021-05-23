const { parse, stringify } = require("envfile");
const fs = require("fs");
const path = require("path");

const CodeModules = artifacts.require("CodeModules");

const setTemplate = async (instance) => {
  const template = fs.readFileSync(
    path.resolve(`${__dirname}/../public/template.html`),
    "utf8"
  );
  const match = template.match(/^([\s\S]*){{inject}}([\s\S]*)$/m);
  const [, before, after] = match;

  await instance.setTemplate(before, after);
};

const uploadExampleModules = async (instance) => {
  for await (let fileName of fs
    .readdirSync(path.resolve(`${__dirname}/../src/example-modules`))
    .sort()) {
    const moduleName = fileName.replace(/\.js$/, "").replace(/^\d+_/, "");
    const content = fs.readFileSync(
      path.resolve(`${__dirname}/../src/example-modules/${fileName}`),
      "utf8"
    );
    const [, depsStr, code] = content.match(/^(.*);\n([\s\S]*)/m);

    await instance.createModule(
      moduleName,
      JSON.parse(depsStr),
      Buffer.from(code).toString("base64")
    );
  }
};

module.exports = async (deployer, network) => {
  await deployer.deploy(CodeModules);
  const instance = await CodeModules.deployed();

  await setTemplate(instance);
  await uploadExampleModules(instance);

  const configFilePath = path.resolve(`${__dirname}/../.env.${network}`);

  if (fs.existsSync(configFilePath)) {
    const envConfig = fs.readFileSync(configFilePath, "utf8");

    fs.writeFileSync(
      configFilePath,
      stringify({ ...parse(envConfig), CONTRACT_ADDRESS: instance.address })
    );
  }
};
