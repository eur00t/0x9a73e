import React from "react";

import MetaMaskOnboarding from "@metamask/onboarding";

import { useWeb3Auth } from "./Web3Auth";

export const ReadOnlyWarning = ({}) => {
  const { isReadOnly, isInjectedAvailable, activateInjected } = useWeb3Auth();

  if (!isReadOnly) {
    return null;
  }

  return (
    <div className="mt-3">
      <div className="alert alert-warning" style={{ maxWidth: "500px" }}>
        <h4 className="alert-heading">Read-Only Mode</h4>
        <p>
          The app functions in read-only mode. We cannot send any transactions
          right now.
        </p>

        {isInjectedAvailable ? (
          <>
            <hr />
            <p className="mb-0">
              Please{" "}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  activateInjected();
                }}
              >
                connect your wallet
              </a>{" "}
              to enable write functionality.
            </p>
          </>
        ) : (
          <>
            <hr />
            <p className="mb-0">
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  const onboarding = new MetaMaskOnboarding({});
                  onboarding.startOnboarding();
                }}
              >
                Check if Metamask is available for your browser.
              </a>
            </p>
          </>
        )}
      </div>
    </div>
  );
};
