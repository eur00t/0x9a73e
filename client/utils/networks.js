import { useWeb3React } from "@web3-react/core";

export const MAINNET_ID = 137;

const NETWORKS = (() => {
  try {
    return JSON.parse(process.env.NETWORKS);
  } catch {
    return [];
  }
})();

export const getNetwork = (chainId) => {
  return NETWORKS.find(
    ({ chainId: _chainId, networkId }) =>
      _chainId === chainId || networkId === chainId
  );
};

export const useNetwork = () => {
  const { chainId } = useWeb3React();

  return getNetwork(chainId);
};

export const useNetworks = () => {
  return NETWORKS;
};

export const useSupportedNetworks = () => {
  return NETWORKS.map(({ name }) => name);
};

export const useAccount = () => {
  const { account } = useWeb3React();

  return account;
};

export const useContractOwner = () => {
  const network = useNetwork();

  if (!network) {
    return "";
  }

  const { contractOwner } = network;

  return contractOwner;
};
