const { parse, stringify } = require("envfile");
const fs = require("fs");
const path = require("path");

const truffleConfig = require("../truffle-config");

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
    const [, description, depsStr, code] = content.match(
      /^(.*);\n(.*);\n([\s\S]*)/m
    );

    await instance.createModule(
      moduleName,
      JSON.stringify({ description: description.slice(1, -1) }),
      JSON.parse(depsStr),
      Buffer.from(code).toString("base64")
    );
  }
};

const appendNetwork = (
  configValue,
  networkEnvName,
  contractAddress,
  contractOwner
) => {
  const parsedConfigValue =
    configValue === undefined ? [] : JSON.parse(configValue);

  if (!truffleConfig.networks[networkEnvName]) {
    return JSON.stringify(parsedConfigValue);
  }

  const {
    chain_id: chainId,
    network_id: networkId,
    etherscan,
    name,
  } = truffleConfig.networks[networkEnvName];

  const itemIndex = parsedConfigValue.findIndex(
    ({ chainId: _chainId }) => _chainId === chainId
  );

  const value = {
    contractAddress,
    contractOwner,
    name,
    chainId,
    networkId,
    etherscan,
  };

  if (itemIndex === -1) {
    parsedConfigValue.push(value);
  } else {
    parsedConfigValue[itemIndex] = value;
  }

  return JSON.stringify(parsedConfigValue);
};

module.exports = async (deployer, networkEnvName, [contractOwner]) => {
  await deployer.deploy(CodeModules);
  const instance = await CodeModules.deployed();

  const skipBootstrap =
    truffleConfig.networks[networkEnvName] &&
    truffleConfig.networks[networkEnvName].skipBootstrap
      ? true
      : false;

  if (!skipBootstrap) {
    await setTemplate(instance);
    await uploadExampleModules(instance);
  }

  const configFilePath = path.resolve(`${__dirname}/../.env`);

  if (fs.existsSync(configFilePath)) {
    const envConfig = parse(fs.readFileSync(configFilePath, "utf8"));

    fs.writeFileSync(
      configFilePath,
      stringify({
        ...envConfig,
        NETWORKS: appendNetwork(
          envConfig.NETWORKS,
          networkEnvName,
          instance.address,
          contractOwner
        ),
      })
    );
  }
};
