import { useNetwork } from "../utils/networks";
import { useWeb3React } from "@web3-react/core";

export const ACTIVE = "ACTIVE";
export const DISCONNECTED = "DISCONNECTED";
export const WRONG_NETWORK = "WRONG_NETWORK";

export const useAppMode = () => {
  const { active } = useWeb3React();
  const network = useNetwork();

  if (!active) {
    return DISCONNECTED;
  }

  if (!network) {
    return WRONG_NETWORK;
  }

  return ACTIVE;
};
