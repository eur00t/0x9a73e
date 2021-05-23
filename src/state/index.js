import { useWeb3React } from "@web3-react/core";
import constate from "constate";
import { useCallback, useMemo, useState } from "react";
import abi from "../code_modules_abi.json";
import { useNetwork } from "../utils/networks";

const parseTemplate = (str) => {
  const match = str.match(/^([\s\S]*){{inject}}([\s\S]*)$/m);

  if (match === null) {
    throw Error();
  }

  const [, before, after] = match;

  return { before, after };
};

const useAppState = () => {
  const { account, library: web3 } = useWeb3React();
  const [progress, setProgress] = useState(false);

  const network = useNetwork();

  let contract = useMemo(
    () =>
      network && web3
        ? new web3.eth.Contract(abi.d, network.contractAddress, {
            from: account,
          })
        : null,
    [web3, network, account]
  );

  const setModule = useCallback(
    async ({ name, deps, code }) => {
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
    },
    [contract, setProgress]
  );

  const setTemplate = useCallback(
    async (templateValue) => {
      try {
        setProgress(true);

        const { before, after } = parseTemplate(templateValue);
        await Promise.all([contract.methods.setTemplate(before, after).send()]);

        retrieve();
      } catch (e) {
      } finally {
        setProgress(false);
      }
    },
    [contract, setProgress]
  );

  const getHtml = useCallback(
    (moduleName) => contract.methods.getHtml(moduleName).call(),
    [contract]
  );

  const getModules = useCallback(
    () => contract.methods.getModules().call(),
    [contract]
  );

  const getModule = useCallback(
    async (moduleName) => {
      const { code, ...rest } = await contract.methods
        .getModule(moduleName)
        .call();

      return {
        code: atob(code),
        ...rest,
      };
    },
    [contract]
  );

  return {
    progress,
    setModule,
    setTemplate,
    getHtml,
    getModule,
    getModules,
  };
};

export const [AppStateProvider, useAppStateContext] = constate(useAppState);
