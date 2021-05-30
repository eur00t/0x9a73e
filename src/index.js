import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "regenerator-runtime/runtime";
import "./scss/custom.scss";

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import {
  BrowserRouter,
  NavLink,
  Link,
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
} from "./routes";
import { AppStateProvider } from "./state";
import { useNetwork } from "./utils/networks";

const ACTIVE = "ACTIVE";
const DISCONNECTED = "DISCONNECTED";
const WRONG_NETWORK = "WRONG_NETWORK";

const useAppMode = () => {
  const { active } = useWeb3React();
  const network = useNetwork();

  if (!active) {
    return DISCONNECTED;
  }

  if (!network) {
    return WRONG_NETWORK;
  }

  return ACTIVE;
};

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

          <Route path={["/modules/edit/:moduleName", "/modules/edit"]} exact>
            <ModuleEditRoute />
          </Route>

          <Route path="/admin/template" exact>
            <TemplateRoute />
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

const NetworkIndicator = () => {
  const appMode = useAppMode();
  const network = useNetwork();

  switch (appMode) {
    case ACTIVE:
      return <span className="badge d-block bg-info">{network.name}</span>;
    case DISCONNECTED:
      return (
        <span className="badge d-block bg-warning">
          Wallet is not connected
        </span>
      );
    case WRONG_NETWORK:
      return (
        <span className="badge d-block bg-warning">
          Network is not supported
        </span>
      );
  }
};

const App = () => {
  const { chainId } = useWeb3React();
  const appMode = useAppMode();

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand">0x9a73e</a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/modules/list"
                  activeClassName="active"
                >
                  Modules
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/admin/template"
                  activeClassName="active"
                >
                  Admin
                </NavLink>
              </li>
            </ul>
          </div>
          <div className="me-3">
            <NetworkIndicator />
          </div>
          <Link
            to="/modules/edit"
            className={classNames("btn btn-outline-primary", {
              disabled: appMode !== ACTIVE,
            })}
          >
            Create Module
          </Link>
        </div>
      </nav>
      <div className="container">
        <Routes key={chainId} />
      </div>
    </>
  );
};

const Web3Auth = ({ children }) => {
  const { active, activate } = useWeb3React();

  const injected = window.ethereum && window.ethereum.selectedAddress !== null;

  useEffect(() => {
    if (injected) {
      activate(new InjectedConnector());
    }
  }, []);

  return !injected || active ? children : null;
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
