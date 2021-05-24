import { useWeb3React } from "@web3-react/core";
import constate from "constate";
import { useCallback, useMemo, useState } from "react";
import { abi } from "../code_modules_abi.json";
import { useNetwork } from "../utils/networks";
import { useTransactions } from "./useTransactions";

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

  const transactions = useTransactions();
  const { trackTransaction } = transactions;

  let contract = useMemo(
    () =>
      network && web3
        ? new web3.eth.Contract(abi, network.contractAddress, {
            from: account,
          })
        : null,
    [web3, network, account]
  );

  const setModule = useCallback(
    async (scopeId, { name, deps, code }) => {
      try {
        setProgress(true);

        const exists = await contract.methods.exists(name).call();
        if (exists) {
          await trackTransaction(
            scopeId,
            contract.methods.updateModule(name, deps, btoa(code)).send()
          );
        } else {
          await trackTransaction(
            scopeId,
            contract.methods.createModule(name, deps, btoa(code)).send()
          );
        }
      } catch (e) {
      } finally {
        setProgress(false);
      }
    },
    [contract, setProgress]
  );

  const setTemplate = useCallback(
    async (scopeId, templateValue) => {
      try {
        setProgress(true);

        const { before, after } = parseTemplate(templateValue);
        await trackTransaction(
          scopeId,
          contract.methods.setTemplate(before, after).send()
        );

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
    transactions,
  };
};

export const [AppStateProvider, useAppStateContext, useTransactionsContext] =
  constate(
    useAppState,
    ({ transactions, ...v }) => v,
    ({ transactions, ...v }) => transactions
  );
