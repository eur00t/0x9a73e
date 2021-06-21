import React from "react";

import { useWeb3Auth } from "./Web3Auth";
import { useNetwork, getNetwork, MAINNET_ID } from "../utils/networks";
import { OnlyWriteInjector } from "./OnlyWriteInjector";
import { OnlyMainnet } from "./OnlyMainnet";

export const MainNetworkWarning = ({}) => {
  const { addNetwork } = useWeb3Auth();

  const mainNetwork = getNetwork(MAINNET_ID);
  const currentNetwork = useNetwork();

  return (
    <OnlyWriteInjector>
      <OnlyMainnet on={false}>
        <div className="alert alert-warning" style={{ maxWidth: "500px" }}>
          <h4 className="alert-heading">Not on Main</h4>
          <p>
            You are currently connected to{" "}
            <strong>{currentNetwork.name}</strong> network. Our master app
            version is deployed to <strong>{mainNetwork.name}</strong>. Go there
            if you want to check it out.
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
      </OnlyMainnet>
    </OnlyWriteInjector>
  );
};
