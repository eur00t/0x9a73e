import { useWeb3React } from "@web3-react/core";
import React, { useEffect, useState } from "react";

import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";

const injectedConnector = new InjectedConnector();
const networkConnector = new NetworkConnector({
  defaultChainId: 4,
  urls: Object.fromEntries(
    JSON.parse(process.env.NETWORKS).map(({ networkId, rpcUrl }) => [
      networkId,
      rpcUrl,
    ])
  ),
});

const connector = injectedConnector;

export const Web3Auth = ({ children }) => {
  const { active, activate } = useWeb3React();

  const [isInitiallyAuthorized, setIsInitiallyAuthorized] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      if (typeof connector.isAuthorized === "function") {
        setIsInitiallyAuthorized(await connector.isAuthorized());
      } else {
        setIsInitiallyAuthorized(true);
      }
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    // Trigger activate if we know that
    // metamask is already authorized.
    // Will require no action from the user.
    if (ready && isInitiallyAuthorized) {
      activate(connector);
    }
  }, [ready, isInitiallyAuthorized]);

  // Render the app if:
  // 1. Metamask was not authorized (will render disconnected UI).
  // or
  // 2. web3-react is active.
  //
  // Will not render the app, if we still waiting for
  // getting the initial auth state, or activation.
  return (ready && !isInitiallyAuthorized) || active ? children : null;
};
