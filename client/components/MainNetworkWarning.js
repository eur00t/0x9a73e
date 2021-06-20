import React from "react";

import { useWeb3Auth } from "./Web3Auth";
import { useNetwork, getNetwork } from "../utils/networks";

const MAINNET_ID = 137;

export const MainNetworkWarning = ({}) => {
  const { isReadOnly, addNetwork } = useWeb3Auth();

  const mainNetwork = getNetwork(MAINNET_ID);
  const currentNetwork = useNetwork();

  if (
    isReadOnly ||
    !currentNetwork ||
    !mainNetwork ||
    currentNetwork === mainNetwork
  ) {
    return null;
  }

  return (
    <div className="alert alert-warning" style={{ maxWidth: "500px" }}>
      <h4 className="alert-heading">Not on Main</h4>
      <p>
        You are currently connected to <strong>{currentNetwork.name}</strong>{" "}
        network. Our master app version is deployed to{" "}
        <strong>{mainNetwork.name}</strong>. Go there if you want to check it
        out.
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
  );
};
