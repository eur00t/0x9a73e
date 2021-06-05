require("dotenv").config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  compilers: {
    solc: {
      version: "0.8.4",
      settings: {
        optimizer: {
          enabled: true,
          runs: 1,
        },
      },
    },
  },
  plugins: ["truffle-contract-size"],
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      chain_id: 1337,
      name: "Ganache",
      etherscan: "https://kovan.etherscan.io/",
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          process.env.KOVAN_ENDPOINT_URL
        );
      },
      network_id: 42,
      chain_id: 42,
      name: "Kovan",
      etherscan: "https://kovan.etherscan.io/",
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          process.env.ROPSTEN_ENDPOINT_URL
        );
      },
      network_id: 3,
      chain_id: 3,
      name: "Ropsten",
      skipBootstrap: true,
      etherscan: "https://ropsten.etherscan.io/",
    },
  },
};
