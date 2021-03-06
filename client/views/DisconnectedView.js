import React from "react";
import { useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import { Page } from "../components/Page";

export const DisconnectedView = () => {
  const { activate } = useWeb3React();

  const connectMetamask = () => {
    activate(new InjectedConnector());
  };

  return (
    <Page>
      <div>
        <p>This application doesn't work without a wallet.</p>
        <button className="btn btn-primary" onClick={connectMetamask}>
          Connect Metamask
        </button>
      </div>
    </Page>
  );
};
