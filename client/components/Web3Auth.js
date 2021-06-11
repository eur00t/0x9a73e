import { useWeb3React } from "@web3-react/core";
import React, { useEffect, useRef, useState } from "react";
import constate from "constate";

import { InjectedConnector } from "@web3-react/injected-connector";
import { NetworkConnector } from "@web3-react/network-connector";

import { useEffectOnValueChange } from "../utils/useEffectOnValueChange";
import { rpcNetworkPersistence } from "../utils/rpcNetworkPersistence";
import { getNetwork } from "../utils/networks";

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
  const { activate, active, connector } = useWeb3React();

  const activateInjected = async () => {
    try {
      await activate(injectedConnector, undefined, true);
    } catch {
      activate(rpcConnector);
    }
  };
  const activateRpc = () => {
    activate(rpcConnector);
  };

  useEffect(() => {
    (async () => {
      const injectedIsAuthorized = await injectedConnector.isAuthorized();

      if (injectedIsAuthorized) {
        activateInjected();
      } else {
        activateRpc();
      }
    })();
  }, []);

  const closeEventHappened = useRef(false);

  useEffectOnValueChange(
    (prevActive) => {
      if (prevActive && !active) {
        if (closeEventHappened.current) {
          activateInjected();
        } else {
          activateRpc();
        }

        closeEventHappened.current = false;
      }
    },
    [active, activate]
  );

  useEffect(() => {
    if (!window.ethereum) {
      return;
    }

    const updateChainId = (chainId) => {
      rpcConnector.currentChainId = parseInt(chainId.slice(2), 16);
    };

    const handleClose = () => {
      closeEventHappened.current = true;
    };

    window.ethereum.on("chainChanged", updateChainId);
    window.ethereum.on("close", handleClose);

    return () => {
      window.ethereum.off("chainChanged", updateChainId);
      window.ethereum.off("close", handleClose);
    };
  }, [closeEventHappened]);

  const isReady = connector !== null;
  const isRpc = active && connector === rpcConnector;
  const isInjected = active && connector === injectedConnector;
  const isInjectedAvailable = window.ethereum !== undefined;
  const isReadOnly = isRpc;

  const addNetwork = (networkId) => {
    if (!window.ethereum || !isInjected) {
      return;
    }

    const network = getNetwork(networkId);

    const { chainId, name, rpcUrl, rpcUrlMetamask, etherscan } = network;
    window.ethereum.request({
      method: "wallet_addEthereumChain",
      params: [
        {
          chainId: `0x${chainId.toString(16)}`,
          chainName: name,
          rpcUrls: [rpcUrlMetamask ?? rpcUrl],
          blockExplorerUrls: [etherscan],
          nativeCurrency: {
            symbol: "MATIC",
            decimals: 18,
          },
        },
      ],
    });
  };

  const setNetwork = (networkId) => {
    if (isRpc) {
      rpcNetworkPersistence.write(networkId);

      connector.changeChainId(networkId);
    }
  };

  return {
    isReady,
    isRpc,
    isInjected,
    isInjectedAvailable,
    isReadOnly,
    activateInjected,
    setNetwork,
    addNetwork,
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
