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
      rpcUrl: "http://127.0.0.1:7545",
    },
    test: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "*",
    },
    matic: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        );
      },
      network_id: 137,
      chain_id: 137,
      name: "Matic",
      etherscan: "https://polygonscan.com/",
      rpcUrl: `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
    kovan: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        );
      },
      network_id: 42,
      chain_id: 42,
      name: "Kovan",
      etherscan: "https://kovan.etherscan.io/",
      rpcUrl: `https://kovan.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
    rinkeby: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        );
      },
      network_id: 4,
      chain_id: 4,
      name: "Rinkeby",
      etherscan: "https://rinkeby.etherscan.io/",
      rpcUrl: `https://rinkeby.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
    ropsten: {
      provider: () => {
        return new HDWalletProvider(
          process.env.WALLET_MNEMONIC,
          `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`
        );
      },
      network_id: 3,
      chain_id: 3,
      name: "Ropsten",
      skipBootstrap: true,
      etherscan: "https://ropsten.etherscan.io/",
      rpcUrl: `https://ropsten.infura.io/v3/${process.env.INFURA_PROJECT_ID}`,
    },
  },
};
