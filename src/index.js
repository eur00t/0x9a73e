import "regenerator-runtime/runtime";

import React, { useEffect, useState, useRef } from "react";
import ReactDOM from "react-dom";
import styled from "styled-components";
import { Web3ReactProvider, useWeb3React } from "@web3-react/core";
import { InjectedConnector } from "@web3-react/injected-connector";
import Web3 from "web3";

import abi from "./code_modules_abi.json";

const Title = styled.div`
  font-size: 24px;
`;

const ModuleForm = ({ onSet }) => {
  const nameRef = useRef();
  const depsRef = useRef();
  const codeRef = useRef();

  const setModule = () => {
    onSet({
      name: nameRef.current.value,
      deps: JSON.parse(depsRef.current.value),
      code: codeRef.current.value,
    });
  };

  return (
    <>
      <form>
        <label>
          Name
          <input ref={nameRef} type="text"></input>
        </label>
        <label>
          Deps
          <input ref={depsRef} type="text"></input>
        </label>
        <label>
          Code
          <textarea ref={codeRef}></textarea>
        </label>
      </form>

      <button onClick={setModule}>set module</button>
    </>
  );
};

const InternalActive = () => {
  const { account, library: web3 } = useWeb3React();

  useEffect(() => {
    window.web3 = web3;
  }, []);

  let contract = new web3.eth.Contract(
    abi.d,
    "0xa0726a7D59684dE10Ba69ab35A9b6A1fc85dC2a7",
    { from: account }
  );

  const [html, setHtml] = useState("");
  const [progress, setProgress] = useState(false);

  const templateRef = useRef();
  const moduleIdRef = useRef();

  const retrieve = async () => {
    if (moduleIdRef.current.value === "") {
      return;
    }

    const html = await contract.methods
      .getHtml(moduleIdRef.current.value)
      .call();
    setHtml(html);
  };

  useEffect(() => {
    retrieve();
  }, []);

  const parseTemplate = (str) => {
    const match = str.match(/^([\s\S]*){{inject}}([\s\S]*)$/m);

    if (match === null) {
      throw Error();
    }

    const [, before, after] = match;

    return { before, after };
  };

  const setTemplate = async (e) => {
    e.preventDefault();

    try {
      setProgress(true);

      const { before, after } = parseTemplate(templateRef.current.value);
      await Promise.all([contract.methods.setTemplate(before, after).send()]);

      retrieve();
    } catch (e) {
    } finally {
      setProgress(false);
    }
  };

  const setModule = async ({ name, deps, code }) => {
    try {
      setProgress(true);

      const exists = await contract.methods.exists(name).call();
      if (exists) {
        await contract.methods.updateModule(name, deps, btoa(code)).send();
      } else {
        await contract.methods.createModule(name, deps, btoa(code)).send();
      }
    } catch (e) {
    } finally {
      setProgress(false);
    }
  };

  return (
    <>
      {progress ? <div>Loading...</div> : null}
      <form>
        <label>
          Module
          <input ref={moduleIdRef} type="text"></input>
        </label>
      </form>

      <button onClick={() => retrieve()}>get module html</button>

      {/* <pre>{html}</pre> */}
      <iframe srcDoc={html} style={{ width: "100%", height: "500px" }}></iframe>
      <form>
        <label>
          Template
          <textarea ref={templateRef}></textarea>
        </label>
      </form>

      <button onClick={setTemplate}>set template</button>

      <ModuleForm onSet={setModule} />
    </>
  );
};

const App = () => {
  const { activate, active } = useWeb3React();

  useEffect(() => {
    activate(new InjectedConnector());
  }, []);

  return <>{active ? <InternalActive /> : null}</>;
};

ReactDOM.render(
  <Web3ReactProvider getLibrary={(provider) => new Web3(provider)}>
    <App />
  </Web3ReactProvider>,
  document.getElementById("app")
);
