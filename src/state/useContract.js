import { useWeb3React } from "@web3-react/core";
import { useCallback, useMemo, useState } from "react";
import { abi } from "../code_modules_abi.json";
import { useNetwork } from "../utils/networks";

const parseTemplate = (str) => {
  const match = str.match(/^([\s\S]*){{inject}}([\s\S]*)$/m);

  if (match === null) {
    throw Error();
  }

  const [, before, after] = match;

  return { before, after };
};

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
    async (
      scopeId,
      { name, dependencies, code, metadataJSON, isInvocable }
    ) => {
      try {
        setProgress(true);

        const exists = await contract.methods.exists(name).call();
        if (exists) {
          await trackTransaction(
            scopeId,
            contract.methods
              .updateModule(
                name,
                metadataJSON,
                dependencies,
                btoa(code),
                isInvocable
              )
              .send()
          );
        } else {
          await trackTransaction(
            scopeId,
            contract.methods
              .createModule(
                name,
                metadataJSON,
                dependencies,
                btoa(code),
                isInvocable
              )
              .send()
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
      } catch (e) {
      } finally {
        setProgress(false);
      }
    },
    [contract, setProgress]
  );

  const getHtml = useCallback(
    (tokenId) => contract.methods.getHtml(tokenId).call(),
    [contract]
  );

  const getHtmlPreview = useCallback(
    (dependencies, code, isInvocable) => {
      let moduleConstructor;

      try {
        moduleConstructor = eval(code);
      } catch (e) {
        return "";
      }

      if (typeof moduleConstructor !== "function") {
        return "";
      }

      return contract.methods
        .getHtmlPreview(dependencies, btoa(code), isInvocable)
        .call();
    },
    [contract]
  );

  const getInvocation = useCallback(
    (tokenId) => contract.methods.getInvocation(tokenId).call(),
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

  const getOwnedInvocations = useCallback(
    () => contract.methods.getOwnedInvocations().call(),
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

  const setInvocable = useCallback(
    (scopeId, moduleName, invocationsMax) =>
      trackTransaction(
        scopeId,
        contract.methods.setInvocable(moduleName, invocationsMax).send()
      ),
    [contract]
  );

  const createInvocation = useCallback(
    (scopeId, moduleName, doneOptions) =>
      trackTransaction(
        scopeId,
        contract.methods.createInvocation(moduleName).send(),
        doneOptions
      ),
    [contract]
  );

  return {
    progress,
    setModule,
    setTemplate,
    getHtml,
    getHtmlPreview,
    getInvocation,
    getModule,
    getAllModules,
    getOwnedModules,
    getOwnedInvocations,
    getAllFeatured,
    setFeatured,
    unsetFeatured,
    setInvocable,
    createInvocation,
  };
};
