import { useWeb3React } from "@web3-react/core";
import React, { useEffect, useState, useRef } from "react";
import constate from "constate";

import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";

import { useEffectOnValueChange } from "../utils/useEffectOnValueChange";
import { rpcNetworkPersistence } from "../utils/rpcNetworkPersistence";

const injectedConnector = new InjectedConnector();
const rpcConnector = new NetworkConnector({
  defaultChainId: rpcNetworkPersistence.read(),
  urls: Object.fromEntries(
    JSON.parse(process.env.NETWORKS).map(({ networkId, rpcUrl }) => [
      networkId,
      rpcUrl,
    ])
  ),
});

const [Web3AuthProvider, _useWeb3Auth] = constate(() => {
  const [connectorCandidate, setConnectorCandidate] = useState(null);
  const { activate, active, connector } = useWeb3React();

  useEffect(() => {
    (async () => {
      const injectedIsAuthorized = await injectedConnector.isAuthorized();

      if (injectedIsAuthorized) {
        setConnectorCandidate(injectedConnector);
      } else {
        setConnectorCandidate(rpcConnector);
      }
    })();
  }, []);

  useEffect(() => {
    if (active === false && connectorCandidate === injectedConnector) {
      setConnectorCandidate(rpcConnector);
    }
  }, [active]);

  useEffectOnValueChange(
    (prevConnector) => {
      activate(connectorCandidate);
    },
    [connectorCandidate]
  );

  const isReady = connector !== null;
  const isRpc = active && connector === rpcConnector;
  const isInjected = active && connector === injectedConnector;
  const isInjectedAvailable = window.ethereum !== undefined;
  const isReadOnly = isRpc;
  const activateInjected = () => setConnectorCandidate(injectedConnector);
  const deactivateInjected = () => setConnectorCandidate(rpcConnector);

  const setNetwork = (networkId) => {
    if (!isRpc) {
      return;
    }

    rpcNetworkPersistence.write(networkId);

    connector.changeChainId(networkId);
  };

  return {
    isReady,
    isRpc,
    isInjected,
    isInjectedAvailable,
    isReadOnly,
    activateInjected,
    deactivateInjected,
    setNetwork,
  };
});

export const useWeb3Auth = _useWeb3Auth;

const Web3AuthInner = ({ children }) => {
  const { active } = useWeb3React();

  return active ? children : null;
};

export const Web3Auth = (props) => {
  return (
    <Web3AuthProvider>
      <Web3AuthInner {...props} />
    </Web3AuthProvider>
  );
};
