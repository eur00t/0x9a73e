const Web3 = require("web3");

const { abi: contractAbi } = require("../client/code_modules_abi.json");

const initWeb3 = () => {
  const networks = JSON.parse(process.env.NETWORKS);

  const map = new Map();

  networks.forEach(({ contractAddress, networkId, rpcUrl }) => {
    if (rpcUrl) {
      const web3 = new Web3(rpcUrl);
      const contract = new web3.eth.Contract(contractAbi, contractAddress);
      map.set(networkId, { web3, contract });
    }
  });

  return map;
};

const web3Map = initWeb3();

const getContract = (networkId) => {
  if (!web3Map.has(networkId)) {
    return null;
  }

  return web3Map.get(networkId).contract;
};

module.exports = {
  w3: web3Map,
  getContract,
};
