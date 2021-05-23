import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "regenerator-runtime/runtime";
import "./scss/custom.scss";

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import Loader from "react-loader-spinner";
import {
  BrowserRouter,
  NavLink,
  Link,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import Web3 from "web3";

import {
  ModuleEditRoute,
  ModuleDetailsRoute,
  TemplateRoute,
  ModulesRoute,
} from "./routes";
import { AppStateProvider, useAppStateContext } from "./state";

const App = () => {
  const { progress } = useAppStateContext();

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
          {progress ? <Loader type="Bars" height="20" color="#0d6efd" /> : null}
          <Link to="/modules/edit" className="btn btn-outline-primary">
            Create Module
          </Link>
        </div>
      </nav>
      <div className="container">
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
      </div>
    </>
  );
};

const Web3Auth = ({ children }) => {
  const { activate, active } = useWeb3React();

  useEffect(() => {
    activate(new InjectedConnector());
  }, []);

  return active ? children : null;
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
