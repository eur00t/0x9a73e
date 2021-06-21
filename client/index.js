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
import classNames from "classnames";

import {
  ModuleEditRoute,
  ModuleDetailsRoute,
  TemplateRoute,
  ModulesRoute,
  DisconnectedRoute,
  WrongNetworkRoute,
  InvocationRoute,
} from "./routes";
import { AppStateProvider } from "./state";
import { OnlyContractOwner } from "./components/OnlyContractOwner";
import { OnlyConnectorType } from "./components/OnlyConnectorType";
import { OnlyInjectedAvailable } from "./components/OnlyInjectedAvailable";
import { OnlyWriteInjector } from "./components/OnlyWriteInjector";
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
          <Route path={["/modules/list"]} exact>
            <ModulesRoute />
          </Route>

          <Route path={["/modules/details/:moduleName"]} exact>
            <ModuleDetailsRoute />
          </Route>

          <Route path={["/modules/edit/:moduleName"]} exact>
            <ModuleEditRoute />
          </Route>

          <Route path={["/modules/create"]} exact>
            <ModuleEditRoute isCreateMode />
          </Route>

          <Route path="/admin/template" exact>
            <TemplateRoute />
          </Route>

          <Route path={["/modules/invocation/:tokenId"]} exact>
            <InvocationRoute />
          </Route>

          <Route path="/">
            <Redirect to="/modules/list"></Redirect>
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
  const appMode = useAppMode();

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container">
          <NavLink
            className="navbar-brand position-relative me-5"
            to="/modules/list"
            activeClassName="active"
          >
            <small
              className="text-muted"
              style={{
                position: "absolute",
                top: "0",
                right: "-25px",
                fontSize: "12px",
              }}
            >
              beta
            </small>
            <em style={{ color: "rgb(140, 140, 140)" }}>λ</em>NFT
          </NavLink>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <OnlyContractOwner>
                <li className="nav-item">
                  <NavLink
                    className="nav-link"
                    to="/admin/template"
                    activeClassName="active"
                  >
                    Admin
                  </NavLink>
                </li>
              </OnlyContractOwner>
            </ul>
          </div>
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

          <OnlyWriteInjector>
            <NavLink
              to="/modules/create"
              activeClassName="d-none"
              className={classNames("btn btn-outline-primary ms-3", {
                disabled: appMode !== ACTIVE,
              })}
            >
              Create Lambda
            </NavLink>
          </OnlyWriteInjector>
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
