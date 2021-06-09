import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "regenerator-runtime/runtime";
import "./scss/custom.scss";

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import React, { useEffect, useState } from "react";
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
  InvocationRoute,
} from "./routes";
import { AppStateProvider } from "./state";
import { useNetwork } from "./utils/networks";
import { OnlyContractOwner } from "./components/OnlyContractOwner";
import Plug from "./icons/plug.svg";

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

const NetworkIndicator = () => {
  const appMode = useAppMode();
  const network = useNetwork();

  switch (appMode) {
    case ACTIVE:
      return (
        <span className="badge d-block bg-info d-flex align-items-center">
          <Plug className="me-1" />
          {network.name}
        </span>
      );
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
  const { chainId, account } = useWeb3React();
  const appMode = useAppMode();

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container">
          <NavLink
            className="navbar-brand"
            to="/modules/list"
            activeClassName="active"
          >
            0x9a73e
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
          <NavLink
            to="/modules/create"
            activeClassName="d-none"
            className={classNames("btn btn-outline-primary ms-3", {
              disabled: appMode !== ACTIVE,
            })}
          >
            Create Module
          </NavLink>
        </div>
      </nav>
      <Routes key={`${chainId}-${account}`} />
    </>
  );
};

const injectedConnector = new InjectedConnector();

const Web3Auth = ({ children }) => {
  const { active, activate } = useWeb3React();

  const [isInitiallyAuthorized, setIsInitiallyAuthorized] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    (async () => {
      setIsInitiallyAuthorized(await injectedConnector.isAuthorized());
      setReady(true);
    })();
  }, []);

  useEffect(() => {
    // Trigger activate if we know that
    // metamask is already authorized.
    // Will require no action from the user.
    if (ready && isInitiallyAuthorized) {
      activate(injectedConnector);
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
