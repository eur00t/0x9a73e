import "react-loader-spinner/dist/loader/css/react-spinner-loader.css";
import "regenerator-runtime/runtime";

import { useWeb3React, Web3ReactProvider } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import React, { useEffect } from "react";
import ReactDOM from "react-dom";
import Loader from "react-loader-spinner";
import {
  BrowserRouter,
  NavLink,
  Redirect,
  Route,
  Switch,
} from "react-router-dom";
import Web3 from "web3";

import { ModuleEditRoute, ModuleDetailsRoute, TemplateRoute } from "./routes";
import { AppStateProvider, useAppStateContext } from "./state";

const App = () => {
  const { progress } = useAppStateContext();

  return (
    <>
      <nav className="navbar navbar-expand navbar-light bg-light">
        <div className="container">
          <a className="navbar-brand" href="#">
            0x9a73e
          </a>
          <div className="collapse navbar-collapse">
            <ul className="navbar-nav">
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/modules/details"
                  activeClassName="active"
                >
                  Module Details
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/modules/edit"
                  activeClassName="active"
                >
                  Module Edit
                </NavLink>
              </li>
              <li className="nav-item">
                <NavLink
                  className="nav-link"
                  to="/admin/template"
                  activeClassName="active"
                >
                  Template
                </NavLink>
              </li>
            </ul>
          </div>
          {progress ? <Loader type="Bars" height="20" color="#0d6efd" /> : null}
        </div>
      </nav>
      <div className="container">
        <Switch>
          <Route
            path={["/modules/details/:moduleName", "/modules/details"]}
            exact
          >
            <ModuleDetailsRoute />
          </Route>

          <Route path={["/modules/edit/:moduleName", "/modules/edit"]} exact>
            <ModuleEditRoute />
          </Route>

          <Route path="/admin/template" exact>
            <TemplateRoute />
          </Route>

          <Route path="/">
            <Redirect to="/modules/details"></Redirect>
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
