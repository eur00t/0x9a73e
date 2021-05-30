import { useWeb3React } from "@web3-react/core";

const NETWORKS = (() => {
  try {
    return JSON.parse(process.env.NETWORKS);
  } catch {
    return [];
  }
})();

export const useNetwork = () => {
  const { chainId } = useWeb3React();

  return NETWORKS.find(
    ({ chainId: _chainId, networkId }) =>
      _chainId === chainId || networkId === chainId
  );
};

export const useSupportedNetworks = () => {
  return NETWORKS.map(({ name }) => name);
};

export const useAccount = () => {
  const { account } = useWeb3React();

  return account;
};
