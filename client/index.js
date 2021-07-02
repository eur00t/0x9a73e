import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "regenerator-runtime/runtime";
import "./scss/custom.scss";

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";

import React from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  NavLink,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import Web3 from "web3";

import { DisconnectedRoute, WrongNetworkRoute, WalletRoute } from "./routes";
import { AppStateProvider } from "./state";
import { OnlyConnectorType } from "./components/OnlyConnectorType";
import { OnlyInjectedAvailable } from "./components/OnlyInjectedAvailable";
import { NetworkIndicator } from "./components/NetworkIndicator";

import { Web3Auth } from "./components/Web3Auth";
import { useWeb3Auth } from "./components/Web3Auth";
import {
  useAppMode,
  ACTIVE,
  DISCONNECTED,
  WRONG_NETWORK,
} from "./components/useAppMode";

const Routes = () => {
  const appMode = useAppMode();

  switch (appMode) {
    case ACTIVE:
      return (
        <Switch>
          <Route path={["/wallet"]} exact>
            <WalletRoute />
          </Route>
          <Route path="/">
            <Redirect to="/wallet"></Redirect>
          </Route>
        </Switch>
      );
    case DISCONNECTED:
      return (
        <Switch>
          <Route path="/disconnected" exact>
            <DisconnectedRoute />
          </Route>
          <Route path="/">
            <Redirect to="/disconnected"></Redirect>
          </Route>
        </Switch>
      );
    case WRONG_NETWORK:
      return (
        <Switch>
          <Route path="/wrong-network" exact>
            <WrongNetworkRoute />
          </Route>
          <Route path="/">
            <Redirect to="/wrong-network"></Redirect>
          </Route>
        </Switch>
      );
  }
};

const App = () => {
  const { chainId, account } = useWeb3React();
  const { activateInjected } = useWeb3Auth();

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container">
          <NavLink
            className="navbar-brand position-relative me-5"
            to="/modules/list"
            activeClassName="active"
          >
            ERC20 Wallet
          </NavLink>
          <div className="collapse navbar-collapse"></div>
          <div>
            <NetworkIndicator />
          </div>

          <OnlyConnectorType type="rpc">
            <OnlyInjectedAvailable>
              <div
                className="btn btn-outline-primary ms-3"
                onClick={activateInjected}
              >
                Connect Wallet
              </div>
            </OnlyInjectedAvailable>
          </OnlyConnectorType>
        </div>
      </nav>

      <Routes key={`${chainId}-${account}`} />
    </>
  );
};

ReactDOM.render(
  <BrowserRouter>
    <Web3ReactProvider getLibrary={(provider) => new Web3(provider)}>
      <Web3Auth>
        <AppStateProvider>
          <App />
        </AppStateProvider>
      </Web3Auth>
    </Web3ReactProvider>
  </BrowserRouter>,
  document.getElementById("app")
);

console.log({ version: process.env.GIT_COMMIT });
