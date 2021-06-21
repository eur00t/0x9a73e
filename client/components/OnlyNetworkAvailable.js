import { ConditionalVisibility } from "../components/ConditionalVisibility";
import { useNetwork, getNetwork } from "../utils/networks";

export const OnlyNetworkAvailable = ConditionalVisibility(({ networkId }) => {
  const choosenNetwork = getNetwork(networkId);
  const currentNetwork = useNetwork();

  if (!currentNetwork || !choosenNetwork) {
    return false;
  }

  return true;
});
