const { parse, stringify } = require("envfile");
const fs = require("fs");
const path = require("path");
const web3 = require("web3");
const { deployProxy, upgradeProxy } = require("@openzeppelin/truffle-upgrades");

const truffleConfig = require("../truffle-config");

const CodeModules = artifacts.require("CodeModules");
const CodeModulesRendering = artifacts.require("CodeModulesRendering");

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
    .readdirSync(path.resolve(`${__dirname}/../example-modules`))
    .sort()) {
    const moduleName = fileName.replace(/\.js$/, "").replace(/^\d+_/, "");
    const content = fs.readFileSync(
      path.resolve(`${__dirname}/../example-modules/${fileName}`),
      "utf8"
    );
    const [, description, isInvocable, depsStr, code] = content.match(
      /^(.*);\n(.*);\n(.*);\n([\s\S]*)/m
    );

    await instance.createModule(
      web3.utils.asciiToHex(moduleName),
      JSON.stringify({ description: description.slice(1, -1) }),
      JSON.parse(depsStr).map((str) => web3.utils.asciiToHex(str)),
      Buffer.from(code).toString("base64"),
      JSON.parse(isInvocable)
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
    rpcUrl,
    rpcUrlMetamask,
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
    rpcUrl,
    rpcUrlMetamask: rpcUrlMetamask ?? rpcUrl,
  };

  if (itemIndex === -1) {
    parsedConfigValue.push(value);
  } else {
    parsedConfigValue[itemIndex] = value;
  }

  return JSON.stringify(parsedConfigValue);
};

module.exports = async (deployer, networkEnvName, [contractOwner]) => {
  await deployer.deploy(CodeModulesRendering);
  await deployer.link(CodeModulesRendering, CodeModules);

  let instance;
  try {
    instance = await CodeModules.deployed();
  } catch {}

  let skipBootstrap =
    truffleConfig.networks[networkEnvName] &&
    truffleConfig.networks[networkEnvName].skipBootstrap
      ? true
      : false;

  if (instance) {
    await upgradeProxy(instance.address, CodeModules, {
      deployer,
      unsafeAllow: ["external-library-linking"],
    });
    skipBootstrap = true;
  } else {
    instance = await deployProxy(
      CodeModules,
      [
        truffleConfig.networks[networkEnvName].network_id,
        web3.utils.asciiToHex(process.env.WEB_URL_ROOT),
      ],
      { deployer, unsafeAllow: ["external-library-linking"] }
    );
  }

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
