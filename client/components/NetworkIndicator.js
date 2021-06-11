import React, { useState } from "react";
import classNames from "classnames";

import { useNetwork, useNetworks } from "../utils/networks";
import { useWeb3Auth } from "./Web3Auth";
import { useAppMode, ACTIVE, DISCONNECTED, WRONG_NETWORK } from "./useAppMode";
import { Modal } from "./Modal";

import Plug from "../icons/plug.svg";

export const NetworkIndicator = () => {
  const appMode = useAppMode();
  const network = useNetwork();
  const { isReadOnly, isRpc, setNetwork } = useWeb3Auth();

  const [isNetworkSelectOpen, setIsNetworkSelectOpen] = useState(false);

  const hideNetworkSelect = () => setIsNetworkSelectOpen(false);
  const openNetworkSelect = () => setIsNetworkSelectOpen(true);

  let badge;
  switch (appMode) {
    case ACTIVE:
      badge = (
        <span className="badge d-block bg-info d-flex align-items-center">
          <Plug className="me-1" />
          {isReadOnly ? `${network.name} (read-only)` : network.name}
        </span>
      );
      break;
    case DISCONNECTED:
      badge = (
        <span className="badge d-block bg-warning">
          Wallet is not connected
        </span>
      );
      break;
    case WRONG_NETWORK:
      badge = (
        <span className="badge d-block bg-warning">
          Network is not supported
        </span>
      );
      break;
  }

  const allNetworks = useNetworks();
  const currentNetwork = useNetwork();

  return (
    <>
      <Modal show={isNetworkSelectOpen} onClose={hideNetworkSelect}>
        <Modal.Header onClose={hideNetworkSelect}>Select Network</Modal.Header>
        <Modal.Body>
          {({ onClose }) => (
            <div className="list-group">
              {allNetworks.map(({ name, networkId }) => {
                const isActive = networkId === currentNetwork.networkId;

                return (
                  <button
                    key={networkId}
                    type="button"
                    className={classNames(
                      "list-group-item list-group-item-action",
                      {
                        active: isActive,
                      }
                    )}
                    onClick={
                      !isActive
                        ? () => {
                            setNetwork(networkId);
                            onClose();
                          }
                        : null
                    }
                  >
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </Modal.Body>
      </Modal>
      {isRpc
        ? React.cloneElement(badge, {
            onClick: openNetworkSelect,
            style: { cursor: "pointer" },
          })
        : badge}
    </>
  );
};
