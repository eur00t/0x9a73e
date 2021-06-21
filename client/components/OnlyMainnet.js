import React from "react";

import { ConditionalVisibility } from "../components/ConditionalVisibility";
import { useNetwork, getNetwork, MAINNET_ID } from "../utils/networks";
import { OnlyNetworkAvailable } from "../components/OnlyNetworkAvailable";

const OnlyMainnetInner = ConditionalVisibility(() => {
  const mainNetwork = getNetwork(MAINNET_ID);
  const currentNetwork = useNetwork();

  if (currentNetwork === mainNetwork) {
    return true;
  }

  return false;
});

export const OnlyMainnet = (props) => (
  <OnlyNetworkAvailable networkId={MAINNET_ID}>
    <OnlyMainnetInner {...props} />
  </OnlyNetworkAvailable>
);
