import { useWeb3React } from "@web3-react/core";
import { useCallback, useMemo, useState } from "react";
import { abi } from "../code_modules_abi.json";
import { useNetwork } from "../utils/networks";

export const useContract = (trackTransaction) => {
  const { account, library: web3 } = useWeb3React();
  const [progress, setProgress] = useState(false);

  const network = useNetwork();

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

  const getAllModules = useCallback(
    () => contract.methods.getAllModules().call(),
    [contract]
  );

  const getOwnedModules = useCallback(
    () => contract.methods.getOwnedModules().call(),
    [contract]
  );

  const getAllFeatured = useCallback(
    () => contract.methods.getAllFeatured().call(),
    [contract]
  );

  const setFeatured = useCallback(
    (scopeId, moduleName) =>
      trackTransaction(
        scopeId,
        contract.methods.setFeatured(moduleName).send()
      ),
    [contract]
  );

  const unsetFeatured = useCallback(
    (scopeId, moduleName) =>
      trackTransaction(
        scopeId,
        contract.methods.unsetFeatured(moduleName).send()
      ),
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
    getAllModules,
    getOwnedModules,
    getAllFeatured,
    setFeatured,
    unsetFeatured,
  };
};
