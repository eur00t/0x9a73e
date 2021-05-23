require("dotenv").config();

const HDWalletProvider = require("@truffle/hdwallet-provider");

module.exports = {
  compilers: {
    solc: {
      version: "0.8.4",
    },
  },
  networks: {
    development: {
      host: "127.0.0.1",
      port: 7545,
      network_id: 5777,
      chain_id: 1337,
      name: "Ganache",
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
    },
  },
};
