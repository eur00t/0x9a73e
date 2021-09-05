import React from "react";

import {
  useSupportedNetworks,
  getNetwork,
  MAINNET_ID,
} from "../utils/networks";
import { Page } from "../components/Page";
import { useWeb3Auth } from "../components/Web3Auth";

export const WrongNetworkRoute = () => {
  const networks = useSupportedNetworks();

  const { addNetwork } = useWeb3Auth();
  const mainNetwork = getNetwork(MAINNET_ID);

  return (
    <Page>
      <div className="alert alert-warning" style={{ maxWidth: "500px" }}>
        <p>
          This app only works with the following networks: {networks.join(", ")}
          .
        </p>
        <p className="mb-0">
          <span
            className="btn btn-sm btn-outline-warning"
            onClick={() => addNetwork(MAINNET_ID)}
          >
            Switch to {mainNetwork.name}
          </span>
        </p>
      </div>
    </Page>
  );
};
